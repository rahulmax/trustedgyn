import { readFileSync, writeFileSync, existsSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'
import OpenAI from 'openai'

const __dirname = dirname(fileURLToPath(import.meta.url))
const translationsDir = join(__dirname, '..', 'src', 'translations')

const LANGUAGES = [
  { code: 'hi', label: 'Hindi' },
  { code: 'ta', label: 'Tamil' },
  { code: 'te', label: 'Telugu' },
  { code: 'kn', label: 'Kannada' },
  { code: 'bn', label: 'Bengali' },
  { code: 'mr', label: 'Marathi' },
  { code: 'ml', label: 'Malayalam' },
  { code: 'gu', label: 'Gujarati' },
]

const force = process.argv.includes('--force')

async function main() {
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) {
    console.error('Error: OPENAI_API_KEY environment variable is required')
    process.exit(1)
  }

  const openai = new OpenAI({ apiKey })
  const enStrings = JSON.parse(readFileSync(join(translationsDir, 'en.json'), 'utf-8'))

  for (const lang of LANGUAGES) {
    const outPath = join(translationsDir, `${lang.code}.json`)

    if (!force && existsSync(outPath)) {
      console.log(`Skipping ${lang.label} (${lang.code}) — file exists. Use --force to overwrite.`)
      continue
    }

    console.log(`Translating to ${lang.label} (${lang.code})...`)

    try {
      const response = await openai.chat.completions.create({
        model: 'gpt-4o',
        temperature: 0.3,
        response_format: { type: 'json_object' },
        messages: [
          {
            role: 'system',
            content: `You are an expert translator for Indian languages. You are translating UI strings for TrustedGyn — a directory that helps women, queer people, trans folks, and survivors find safe, non-judgmental gynecologists in India.

TRANSLATE INTO: ${lang.label}

CRITICAL RULES:
1. Use the CORRECT script for ${lang.label}. Do not mix scripts from other languages.
2. Keep placeholder variables EXACTLY as-is: {count}, {plural}, {city} — do not translate or modify these.
3. Use natural, colloquial ${lang.label} — how a real person would speak, not formal/literary style.
4. Keep English terms that are commonly used in ${lang.label} as-is: "LGBTQ+", "CC BY-NC-SA 4.0", "@AmbaAzaad", "Google Sheets", "AI"
5. For medical/technical terms that people commonly say in English even when speaking ${lang.label}, keep the English: "gynaecologist" can stay as-is or use the common ${lang.label} equivalent.

SPECIFIC TRANSLATION GUIDANCE:
- "gynaecologist" → MUST be translated into ${lang.label}. Use the common native word for a women's doctor / स्त्री रोग विशेषज्ञ / பெண் மருத்துவர் etc. Do NOT keep it in English.
- "Call" = the action of making a phone call. Translate it: कॉल करें / அழைக்கவும் etc.
- "Map" = a geographical map. Translate it: नक्शा / வரைபடம் etc.
- "Details" = more information. Translate it.
- "Directions" = navigation directions to a place. Translate it.
- "Testimonial" = a patient's review/experience/feedback about a doctor (NOT "interview", NOT "certificate"). Use the word for "experience" or "review": अनुभव / அனுபவம் etc.
- "Crowdsourced" = collected from community contributions (translate the concept, don't transliterate)
- ALL badge labels MUST be translated into ${lang.label}. Do NOT leave them in English:
  - "Queer-friendly" = welcoming to LGBTQ+ people. Translate: समलैंगिक-मित्र / LGBTQ+ நட்பான etc.
  - "Sex-positive" = open and non-judgmental about sexuality. Translate the concept.
  - "Trauma-informed" = sensitive to people who have experienced trauma/abuse. Translate.
  - "Non-trad family" = supportive of non-traditional family structures. Translate.
  - "Repro autonomy" = reproductive autonomy / freedom of reproductive choices. Translate.
  - "Confidential & Autonomous" = keeps your information private, treats you as independent. Translate.
  - "Affordable" = reasonably priced, won't charge unnecessarily. Translate.
  - "Accessible" = physically accessible (wheelchair, etc.). Translate.
- ALL button labels, section headings, and UI text MUST be in ${lang.label}. Do NOT leave any user-facing text in English.
- Only keep in English: "LGBTQ+", "CC BY-NC-SA 4.0", "@AmbaAzaad", "Google Sheets", "AI"

Return a JSON object with the EXACT same keys as the input.`,
          },
          {
            role: 'user',
            content: JSON.stringify(enStrings, null, 2),
          },
        ],
      })

      const content = response.choices[0].message.content
      const translated = JSON.parse(content)

      // Validate that all keys are present
      const missingKeys = Object.keys(enStrings).filter(k => !(k in translated))
      if (missingKeys.length > 0) {
        console.warn(`  Warning: missing keys for ${lang.label}: ${missingKeys.join(', ')}`)
        // Fill in missing keys with English fallback
        for (const key of missingKeys) {
          translated[key] = enStrings[key]
        }
      }

      writeFileSync(outPath, JSON.stringify(translated, null, 2) + '\n', 'utf-8')
      console.log(`  Saved ${outPath}`)
    } catch (err) {
      console.error(`  Error translating ${lang.label}:`, err.message)
    }
  }

  console.log('\nDone!')
}

main()
