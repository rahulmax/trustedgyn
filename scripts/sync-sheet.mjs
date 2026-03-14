/**
 * Google Sheets → doctors.json sync script
 *
 * Discovers city tabs from a public spreadsheet, fetches CSV data,
 * transposes (rows = fields, columns = doctors), parses 58 fields per doctor,
 * computes inclusivity badges, deduplicates, and writes src/data/doctors.json.
 *
 * Usage: node scripts/sync-sheet.mjs
 */

import { writeFileSync, mkdirSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const PROJECT_ROOT = join(__dirname, '..')
const OUTPUT_PATH = join(PROJECT_ROOT, 'src', 'data', 'doctors.json')

const SPREADSHEET_ID = '1o2QJKrPjKS92cCj6SX73B8siKlW6TlRNKYe0SC7WrX8'
const HTMLVIEW_URL = `https://docs.google.com/spreadsheets/d/${SPREADSHEET_ID}/htmlview`
const CSV_URL = (tabName) =>
  `https://docs.google.com/spreadsheets/d/${SPREADSHEET_ID}/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent(tabName)}`
const SHEET_URL = (gid) =>
  `https://docs.google.com/spreadsheets/d/${SPREADSHEET_ID}/edit#gid=${gid}`

// Tabs to skip (non-India / non-city tabs)
const SKIP_TABS = new Set([
  'non-india',
  'colombo',
  'other places',
  'instructions',
  'template',
  'metadata',
  'readme',
  'index',
  'summary',
  'about',
])

// ─── Inclusivity column mapping (1-based row index) ──────────────────
// In the transposed sheet, row N corresponds to the Nth field.
// These indices match the spec's 1-based column numbers.

const INCLUSIVITY_COLUMN_MAP = {
  'confidential-autonomous': {
    13: 'keeps-info-private',
    14: 'treats-as-autonomous',
    15: 'advocates-legal-rights',
    16: 'respects-companions',
  },
  'financially-considerate': {
    17: 'welcomes-poor-illiterate',
    18: 'no-unnecessary-tests',
    19: 'welcomes-oppressed-groups',
    20: 'respects-dietary-choices',
    21: 'alternative-therapies',
  },
  'queer-friendly': {
    22: 'welcomes-trans',
    23: 'discusses-gender-dysphoria',
    24: 'queer-sexuality',
    25: 'kink-polyamory',
  },
  'trauma-informed': {
    26: 'welcomes-survivors',
    27: 'supports-minors',
    28: 'welcomes-std',
    29: 'disability-sexuality',
    30: 'mental-illness-sexuality',
  },
  'sex-positive': {
    31: 'discusses-sex-work',
    32: 'advocates-sexual-satisfaction',
    33: 'discusses-masturbation',
    34: 'menstrual-hygiene-choices',
    35: 'respects-hymen-views',
  },
  'reproductive-autonomy': {
    36: 'no-marriage-as-cure',
    37: 'accepts-sexual-history',
    38: 'celibate-childfree',
    39: 'birth-control-options',
    40: 'morning-after-pill',
    41: 'respects-abortion-choice',
    42: 'surgical-abortions',
    43: 'pill-abortions',
    44: 'respects-fertility-choices',
    45: 'infertility-treatment',
  },
  'non-traditional-family': {
    46: 'supports-single-parenting',
    47: 'refuses-sex-reveal',
    48: 'non-traditional-birthing',
    49: 'welcomes-companions-delivery',
    50: 'respects-surgical-decisions',
  },
  accessible: {
    51: 'up-to-date-knowledge',
    52: 'screens-for-cancers',
    53: 'examines-professionally',
    54: 'answers-without-judgment',
    55: 'respects-boundaries',
    56: 'refers-competently',
    57: 'accepts-criticism',
  },
}

// ─── CSV Parser ──────────────────────────────────────────────────────

function parseCSV(text) {
  const rows = []
  let row = []
  let cell = ''
  let inQuotes = false

  for (let i = 0; i < text.length; i++) {
    const ch = text[i]
    if (inQuotes) {
      if (ch === '"') {
        if (text[i + 1] === '"') {
          cell += '"'
          i++
        } else {
          inQuotes = false
        }
      } else {
        cell += ch
      }
    } else {
      if (ch === '"') {
        inQuotes = true
      } else if (ch === ',') {
        row.push(cell)
        cell = ''
      } else if (ch === '\n' || ch === '\r') {
        if (ch === '\r' && text[i + 1] === '\n') i++
        row.push(cell)
        cell = ''
        rows.push(row)
        row = []
      } else {
        cell += ch
      }
    }
  }
  if (cell || row.length) {
    row.push(cell)
    rows.push(row)
  }
  return rows
}

// ─── Value normalization ─────────────────────────────────────────────

function normalizeAnswer(raw) {
  if (!raw || raw.trim() === '' || raw.trim().toLowerCase() === 'n/a') return ''
  const lower = raw.trim().toLowerCase()
  if (['yes', 'happily, yep', 'happily', 'yep'].includes(lower)) return 'Yes'
  if (['maybe', 'not sure', 'possibly'].includes(lower)) return 'Maybe'
  if (['no', 'not at all', 'nope'].includes(lower)) return 'No'
  return raw.trim()
}

// ─── Badge computation ───────────────────────────────────────────────

function computeBadges(inclusivity) {
  const badges = []
  for (const [groupKey, questions] of Object.entries(inclusivity)) {
    const answers = Object.values(questions).filter((v) => v !== '')
    if (answers.length < 2) continue

    let score = 0
    for (const answer of answers) {
      if (answer === 'Yes') score += 1
      else if (answer === 'Maybe') score += 0.5
    }

    const ratio = score / answers.length
    if (ratio >= 0.6) badges.push(groupKey)
  }
  return badges
}

// ─── Response count derivation ───────────────────────────────────────

function deriveResponseCount(aboutReccer) {
  if (!aboutReccer || aboutReccer.trim().length < 2) return 1
  const segments = aboutReccer.split(/[;\n]/).filter((s) => s.trim().length > 3)
  return Math.max(segments.length, 1)
}

// ─── Data cleaning ──────────────────────────────────────────────────

function cleanFee(raw) {
  if (!raw) return ''
  let s = raw.trim()

  // Skip if it looks like an address or non-fee data
  if (s.length > 40 || /hospital|center|clinic|road|marg|nagar/i.test(s)) return ''

  // Remove conversational noise
  s = s.replace(/i\s*think\s*(it'?s?|its?)\s*/gi, '~')
  s = s.replace(/around\s*/gi, '~')
  s = s.replace(/approx\.?\s*/gi, '~')
  s = s.replace(/about\s*/gi, '~')

  // Remove "rs", "Rs.", "INR", currency words
  s = s.replace(/\b(rs\.?|inr|rupees?)\b/gi, '').trim()

  // Handle ranges like "300-500", "1000 - 1500", "300 to 500"
  const rangeMatch = s.match(/~?\s*(\d[\d,]*)\s*[-–—to]+\s*(\d[\d,]*)/)
  if (rangeMatch) {
    const upper = parseInt(rangeMatch[2].replace(/,/g, ''), 10)
    if (upper >= 10 && upper <= 100000) return `~₹${upper.toLocaleString('en-IN')}`
  }

  // Handle single numbers with optional ~
  const hasApprox = s.includes('~')
  const numMatch = s.match(/(\d[\d,]*)/)
  if (numMatch) {
    const num = parseInt(numMatch[1].replace(/,/g, ''), 10)
    if (num >= 10 && num <= 100000) {
      return `${hasApprox ? '~' : ''}₹${num.toLocaleString('en-IN')}`
    }
  }

  // Remove trailing hyphens, stray chars
  s = s.replace(/[-–—/\\]+$/, '').replace(/^[-–—/\\]+/, '').trim()
  if (!s || s === '₹') return ''
  return s
}

function cleanHours(raw) {
  if (!raw) return ''
  let s = raw.trim()

  // Skip non-hours data (phone numbers, addresses, vague text)
  if (/^\d{10,}/.test(s)) return '' // phone number
  if (/no idea|varies|varied|by appointment|probably|weekdays evening/i.test(s)) return s

  // Normalize separators: . → : for times
  s = s.replace(/(\d)\.(\d{2})/g, '$1:$2')

  // Normalize am/pm spacing
  s = s.replace(/\s*(a\.?m\.?|p\.?m\.?)/gi, (_, p) => p.replace(/\./g, '').toLowerCase())

  // Strip leading zeros from hours: 06:30 → 6:30, 08:00 → 8:00, 09am → 9am
  s = s.replace(/\b0(\d:\d{2})/g, '$1')
  s = s.replace(/\b0(\d)(am|pm)/gi, '$1$2')

  // Remove :00 minutes (8:00pm → 8pm) but keep :30, :15 etc.
  s = s.replace(/(\d):00\s*(am|pm)/gi, '$1$2')
  // Fix leftover :0 from prior stripping (8:0pm → 8pm)
  s = s.replace(/(\d):0(am|pm)/gi, '$1$2')

  // "24*7" → "24/7", "24 hrs" / "24 hours" → "24/7"
  s = s.replace(/24\s*\*\s*7/, '24/7')
  s = s.replace(/24\s*(hrs|hours)\b/gi, '24/7')

  // Add am/pm to bare numbers where context is clear
  // "9-6" → likely "9am–6pm"
  // "5-8pm" → "5–8pm"

  // Normalize range separators: "to", "-", "—" → "–"
  s = s.replace(/\s*(?:to|-|—)\s*/g, '–')

  // Fix "9–6" style (no am/pm) → leave as is, it's clear enough
  // Fix "&" and "/" separators between time blocks
  s = s.replace(/\s*[&]\s*/g, ', ')
  s = s.replace(/\s*[/]\s*/g, ', ')

  // Trim trailing periods, dots, ellipsis
  s = s.replace(/[.\s]+$/, '').trim()

  // Remove trailing partial words like "...mo"
  s = s.replace(/\.\.\.\w*$/, '').trim()

  // Capitalize day abbreviations
  s = s.replace(/\b(mon|tue|tues|wed|thu|thur|thurs|fri|sat|sun)\b/gi, (d) =>
    d.charAt(0).toUpperCase() + d.slice(1).toLowerCase()
  )
  s = s.replace(/\b(monday|tuesday|wednesday|thursday|friday|saturday|sunday)\b/gi, (d) =>
    d.charAt(0).toUpperCase() + d.slice(1).toLowerCase()
  )

  // Capitalize sentence starts
  s = s.replace(/^[a-z]/, c => c.toUpperCase())

  // Capitalize after semicolons/commas that start new segments
  s = s.replace(/([;,]\s*)([a-z])/g, (_, sep, c) => sep + c.toUpperCase())

  // "24, 7" → "24/7"
  s = s.replace(/24\s*,\s*7/, '24/7')

  // Remove "ish", "approx" noise
  s = s.replace(/\s*\(ish\)|\s*ish\b/gi, '')
  s = s.replace(/\(approx\)/gi, '')

  // "dont know" / "not sure" / "no idea" → empty
  if (/^(dont|don.t)\s*know$/i.test(s) || /^not\s*sure$/i.test(s) || /^no\s*idea$/i.test(s)) return ''

  // "varies by days" → "Varies by day"
  s = s.replace(/varies\s+by\s+days?/gi, 'Varies by day')
  s = s.replace(/^varied$/i, 'Varies')

  // Filter out phone numbers that ended up in hours
  if (/^\d{10,}$/.test(s.replace(/[–\-,\s]/g, ''))) return ''

  // Filter out languages that ended up in hours
  if (/^(english|hindi|kannada|telugu|marathi|malayalam|gujarati|bengali|tamil|punjabi)/i.test(s)) return ''

  return s
}

function cleanAddress(raw) {
  if (!raw) return ''
  let s = raw.trim()

  // Remove conversational noise
  s = s.replace(/don'?t\s+remember\s+exact\s+address\s*(but)?\s*(one\s+can\s+always\s+)?(call\s+(her|him|them)\s+and\s+ask\.?\s*)?/gi, '')
  s = s.replace(/somewhere\s+near\s+/gi, 'Near ')
  s = s.replace(/it\s+is\s+(good\s+to\s+)?(call|near)\s+/gi, '')
  s = s.replace(/she'?s?\s+there\s+every\s+morning[^.]*\./gi, '')
  s = s.replace(/you\s+can\s+time\s+your\s+visit\s+accordingly\.?\s*/gi, '')
  s = s.replace(/but\s+it\s+is\s+good\s+to\s+call[^.]*\.\s*/gi, '')

  // Remove trailing/leading junk
  s = s.replace(/[,\s·.]+$/, '').replace(/^[,\s·.]+/, '').trim()

  // Collapse whitespace
  s = s.replace(/\s+/g, ' ')

  return s
}

function cleanPhone(raw) {
  if (!raw) return ''
  let s = raw.replace(/[\s\-()]/g, '').trim()
  s = s.replace(/^\+?91(?=\d{10})/, '')
  s = s.replace(/^0(?=\d{10})/, '')
  s = s.split(/[,/]/)[0].trim()
  s = s.replace(/[^\d]/g, '')
  return s
}

function cleanLanguages(raw) {
  if (!raw) return []
  return raw
    .split(/[,/&]/)
    .map(s => s.trim())
    .filter(s => {
      if (!s || s.length < 2) return false
      // Filter out fee amounts, "Rs.", numbers, noise
      if (/^(rs\.?|₹|\d+|free|minimal|yep|probably|happily)/i.test(s)) return false
      if (/\d{3,}/.test(s)) return false // numbers like "150", "300-500"
      if (/not\s*(sure|aware)/i.test(s)) return false
      if (/^(i\s|did|for\s|as\s)/i.test(s)) return false
      return true
    })
    .map(s => titleCase(s))
}

function cleanPayment(raw) {
  if (!raw) return []
  return raw
    .split(/[,/&]/)
    .map(s => s.trim())
    .filter(s => {
      if (!s || s.length < 2) return false
      // Filter out hours, personal info, noise
      if (/^\d{1,2}[:\.]?\d{0,2}\s*(am|pm|hrs|to|-)/i.test(s)) return false
      if (/^(mon|tue|wed|thu|fri|sat|sun|all\s*day|always|9-|9am|10|11|12)/i.test(s)) return false
      if (/not\s*sure|don.t\s*know|i.m\s*not/i.test(s)) return false
      if (/as\s*far\s*as/i.test(s)) return false
      return true
    })
    .map(s => {
      const lower = s.toLowerCase()
      if (lower === 'cash') return 'Cash'
      if (lower === 'card' || lower === 'cards') return 'Card'
      if (/credit/i.test(s) && /debit/i.test(s)) return 'Card'
      if (/credit/i.test(s)) return 'Credit Card'
      if (/debit/i.test(s)) return 'Debit Card'
      if (/cheque/i.test(s)) return 'Cheque'
      if (/paytm|e-wallet|internet|upi/i.test(s)) return 'UPI/Digital'
      if (/insurance/i.test(s)) return 'Insurance'
      if (/all/i.test(s)) return 'All'
      return titleCase(s)
    })
    .filter((v, i, a) => a.indexOf(v) === i) // dedupe
}

function cleanWheelchair(raw) {
  if (!raw) return ''
  const lower = raw.trim().toLowerCase()
  if (/^(yes|yep|yes\b)/i.test(lower)) return 'Yes'
  if (/partial/i.test(lower)) return 'Partial'
  if (/elevator|lift/i.test(lower)) return 'Elevator'
  if (/^no\b|nope|not\s*(wheelchair|really|the\s*clinic)|unfortunately/i.test(lower)) return 'No'
  if (/not\s*sure|don.t\s*know|i.m\s*not|maybe/i.test(lower)) return 'Unknown'
  // Filter out completely wrong data (personal descriptions, cash, etc.)
  if (lower.length > 60 || /cash|rs\.|credit|married|female|male|survivor|year/i.test(lower)) return ''
  return ''
}

function cleanHygienic(raw) {
  if (!raw) return ''
  const lower = raw.trim().toLowerCase()
  if (/^(yes|yep|happily|definitely|extremely|very\s*clean)/i.test(lower)) return 'Yes'
  if (/maybe|probably/i.test(lower)) return 'Maybe'
  if (/^no\b/i.test(lower)) return 'No'
  if (/don.t\s*know|not\s*sure/i.test(lower)) return ''
  if (lower.length > 80) return '' // long descriptions, just skip
  return ''
}

function titleCase(s) {
  if (!s) return ''
  return s
    .toLowerCase()
    .replace(/\b\w/g, c => c.toUpperCase())
    .replace(/\b(And|Or|Of|The|To|In|For|A|An)\b/g, w => w.toLowerCase())
    .replace(/^./, c => c.toUpperCase())
}

function cleanLocality(raw) {
  if (!raw) return ''
  let s = raw.trim()
  // Filter out age ranges, numbers, garbage
  if (/^\d{2}-\d{2}$/.test(s)) return '' // age range
  if (/^\d+$/.test(s)) return '' // just a number
  if (s.length < 3) return ''
  return s
}

// ─── Locality extraction ────────────────────────────────────────────

function extractLocality(address) {
  if (!address) return ''
  const parts = address.split(',').map((s) => s.trim()).filter(Boolean)
  if (parts.length >= 3) return parts[parts.length - 3]
  if (parts.length >= 2) return parts[parts.length - 2]
  return parts[0] || ''
}

// ─── Tab discovery via /htmlview ─────────────────────────────────────

async function discoverTabs() {
  console.log('Discovering tabs from htmlview...')
  const res = await fetch(HTMLVIEW_URL)
  if (!res.ok) throw new Error(`Failed to fetch htmlview: ${res.status}`)
  const html = await res.text()

  const tabs = []
  const regex = /items\.push\(\{name:\s*"([^"]+)",\s*pageUrl:[^,]+,\s*gid:\s*"(\d+)"/g
  let match
  while ((match = regex.exec(html)) !== null) {
    tabs.push({ name: match[1], gid: match[2] })
  }

  if (tabs.length === 0) {
    throw new Error('Could not discover any tabs from htmlview page')
  }

  console.log(`Found ${tabs.length} tabs total`)
  return tabs
}

// ─── Transpose + parse doctors from a single tab ─────────────────────
// The spreadsheet is transposed: rows = fields, columns = doctors.
// Row 0 has field labels in col 0, and doctor data in cols 1..N.
// We need to read column-by-column to extract each doctor.

function parseDoctorsFromTab(rows, city, gid) {
  if (rows.length < 12) return [] // need at least 12 field rows

  // Number of doctor columns = max cols across rows, minus 1 (the label col)
  const maxCols = Math.max(...rows.map((r) => r.length))
  const doctors = []

  // Iterate over each doctor column (starting from column index 1)
  for (let colIdx = 1; colIdx < maxCols; colIdx++) {
    // Build an array of field values for this doctor (1-based field index)
    // fieldValues[0] is unused; fieldValues[1] = row 0's value, etc.
    const fieldValues = [''] // placeholder for index 0
    for (let rowIdx = 0; rowIdx < Math.min(rows.length, 58); rowIdx++) {
      const val = rows[rowIdx]?.[colIdx] || ''
      fieldValues.push(val) // fieldValues[rowIdx + 1]
    }

    // Field 1: "Name Gender Age-Range" — space-separated, not comma
    // Format: "Firstname Lastname Female 40-49"
    const nameField = (fieldValues[1] || '').trim()
    if (!nameField || nameField.length < 2) continue

    // Parse name, gender, ageRange from the name field
    // The field uses spaces: "Anita Balakrishna Female 40-49"
    // But some entries use commas: "Suhasini Inamdhar, Bharathi G Female 40-49"
    const { name, gender, ageRange } = parseNameField(nameField)
    if (!name || name.length < 2) continue

    const phone = cleanPhone(fieldValues[2] || '')
    const address = cleanAddress(fieldValues[3] || '')
    const locality = cleanLocality(extractLocality(address))
    const hours = cleanHours(fieldValues[4] || '')
    const fee = cleanFee(fieldValues[5] || '')
    const payment = cleanPayment(fieldValues[6] || '')
    const languages = cleanLanguages(fieldValues[7] || '')

    const wheelchairAccessible = cleanWheelchair(fieldValues[8] || '')
    const otherDisability = (fieldValues[9] || '').trim()
    const hygienic = cleanHygienic(fieldValues[10] || '')

    const aboutReccer = (fieldValues[11] || '').trim()
    const testimonial = (fieldValues[12] || '').trim()
    const responseCount = deriveResponseCount(aboutReccer)

    // Build inclusivity object
    const inclusivity = {}
    for (const [groupKey, columnMap] of Object.entries(INCLUSIVITY_COLUMN_MAP)) {
      inclusivity[groupKey] = {}
      for (const [fieldStr, questionKey] of Object.entries(columnMap)) {
        const fieldIdx = parseInt(fieldStr, 10) // 1-based, matches fieldValues index
        const raw = fieldValues[fieldIdx] || ''
        inclusivity[groupKey][questionKey] = normalizeAnswer(raw)
      }
    }

    // Add wheelchair + other-disability into accessible group
    inclusivity.accessible['wheelchair-accessible'] = normalizeAnswer(wheelchairAccessible)
    if (otherDisability && otherDisability.trim().length > 0 && otherDisability.toLowerCase() !== 'n/a') {
      inclusivity.accessible['other-disability'] = normalizeAnswer(otherDisability)
    }

    const badges = computeBadges(inclusivity)
    const sheetUrl = SHEET_URL(gid)

    doctors.push({
      id: 0,
      name,
      gender,
      ageRange,
      city,
      phone,
      address,
      locality,
      hours,
      fee,
      payment,
      languages,
      wheelchairAccessible,
      hygienic,
      testimonial,
      responseCount,
      inclusivity,
      badges,
      sheetUrl,
    })
  }

  return doctors
}

// ─── Parse name field ────────────────────────────────────────────────
// Format varies: "Firstname Lastname Female 40-49" or "Name Female" etc.
// Gender keywords to detect: Female, Male, "I'm not sure"
// Age range pattern: \d{2}-\d{2}

const AGE_RANGE_REGEX = /\b(\d{2}-\d{2})\b/
// Match "Female" or "Male" as whole words (word boundary prevents "male" inside "Female")
const GENDER_REGEX = /\b(Female|Male)\b/gi

function parseNameField(raw) {
  let name = ''
  let gender = ''
  let ageRange = ''

  // Extract age range
  const ageMatch = raw.match(AGE_RANGE_REGEX)
  if (ageMatch) {
    ageRange = ageMatch[1]
  }

  // Remove age range from string for further parsing
  let remaining = raw.replace(AGE_RANGE_REGEX, '').trim()

  // Find all whole-word gender matches; use the last one
  let genderMatch
  let lastGenderMatch = null
  // Reset regex state
  GENDER_REGEX.lastIndex = 0
  while ((genderMatch = GENDER_REGEX.exec(remaining)) !== null) {
    lastGenderMatch = genderMatch
  }

  if (lastGenderMatch) {
    gender = lastGenderMatch[1].charAt(0).toUpperCase() + lastGenderMatch[1].slice(1).toLowerCase()
    name = remaining.substring(0, lastGenderMatch.index).trim()
    name = name.replace(/[,\s]+$/, '')
  } else {
    // No gender found -- treat entire string as name
    name = remaining.replace(/[,\s]+$/, '')
  }

  return { name, gender, ageRange }
}

// ─── Deduplication ───────────────────────────────────────────────────

function deduplicationKey(doctor) {
  const name = doctor.name.toLowerCase().replace(/dr\.?\s*/g, '').replace(/[^a-z]/g, '')
  const addr = doctor.address.toLowerCase().replace(/[^a-z]/g, '')
  return `${name}::${addr}`
}

function deduplicateDoctors(doctors) {
  const seen = new Set()
  const unique = []
  for (const doc of doctors) {
    const key = deduplicationKey(doc)
    if (seen.has(key)) continue
    seen.add(key)
    unique.push(doc)
  }
  return unique
}

// ─── Main ────────────────────────────────────────────────────────────

async function main() {
  const tabs = await discoverTabs()

  // Filter to Indian city tabs only
  const cityTabs = tabs.filter((t) => {
    const lower = t.name.toLowerCase().trim()
    return !SKIP_TABS.has(lower) && !lower.includes('non-ind') && !lower.includes('non ind')
  })

  console.log(`Processing ${cityTabs.length} city tabs...\n`)

  let allDoctors = []
  let headerPrinted = false

  for (const tab of cityTabs) {
    const url = CSV_URL(tab.name)
    try {
      const res = await fetch(url)
      if (!res.ok) {
        console.warn(`  [!] Skipping "${tab.name}" -- HTTP ${res.status}`)
        continue
      }
      const text = await res.text()
      const rows = parseCSV(text)

      if (rows.length < 2) {
        console.log(`  ${tab.name}: empty (${rows.length} rows)`)
        continue
      }

      // Print field labels from first tab for verification
      if (!headerPrinted) {
        console.log('Field labels (rows from first tab):')
        for (let i = 0; i < Math.min(rows.length, 58); i++) {
          const label = (rows[i]?.[0] || '').substring(0, 80)
          console.log(`  Row ${i + 1} (field ${i + 1}): "${label}"`)
        }
        console.log(`  ... (${rows.length} rows, ${rows[0]?.length || 0} columns)\n`)
        headerPrinted = true
      }

      const doctors = parseDoctorsFromTab(rows, tab.name, tab.gid)
      allDoctors.push(...doctors)

      console.log(`  ${tab.name}: ${doctors.length} doctors`)
    } catch (err) {
      console.warn(`  [!] Error fetching "${tab.name}": ${err.message}`)
    }
  }

  console.log(`\nTotal before dedup: ${allDoctors.length}`)

  allDoctors = deduplicateDoctors(allDoctors)
  console.log(`Total after dedup: ${allDoctors.length}`)

  // Assign sequential IDs
  allDoctors.forEach((doc, i) => {
    doc.id = i + 1
  })

  // Collect unique cities
  const cities = [...new Set(allDoctors.map((d) => d.city))].sort()

  // Write output
  mkdirSync(dirname(OUTPUT_PATH), { recursive: true })
  writeFileSync(OUTPUT_PATH, JSON.stringify(allDoctors, null, 2))
  console.log(`\nWrote ${allDoctors.length} doctors across ${cities.length} cities to ${OUTPUT_PATH}`)
  console.log(`Cities: ${cities.join(', ')}`)

  // Badge summary
  const badgeCounts = {}
  for (const doc of allDoctors) {
    for (const badge of doc.badges) {
      badgeCounts[badge] = (badgeCounts[badge] || 0) + 1
    }
  }
  console.log('\nBadge distribution:')
  for (const [badge, count] of Object.entries(badgeCounts).sort((a, b) => b[1] - a[1])) {
    console.log(`  ${badge}: ${count}`)
  }
}

main().catch((err) => {
  console.error('Sync failed:', err)
  process.exit(1)
})
