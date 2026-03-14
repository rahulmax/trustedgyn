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

    const phone = (fieldValues[2] || '').trim()
    const address = (fieldValues[3] || '').trim()
    const locality = extractLocality(address)
    const hours = (fieldValues[4] || '').trim()
    const fee = (fieldValues[5] || '').trim()
    const payment = (fieldValues[6] || '')
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean)
    const languages = (fieldValues[7] || '')
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean)

    const wheelchairAccessible = (fieldValues[8] || '').trim()
    const otherDisability = (fieldValues[9] || '').trim()
    const hygienic = (fieldValues[10] || '').trim()

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
