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
        model: 'gpt-4o-mini',
        temperature: 0.3,
        response_format: { type: 'json_object' },
        messages: [
          {
            role: 'system',
            content: `Translate the following UI strings for a medical directory website into ${lang.label}. Keep translations natural, not literal. These are for a gynecologist directory that helps people find non-judgmental doctors. Keep the tone warm and supportive. Return a JSON object with the same keys. Do not translate placeholder variables like {count}, {plural}, {city} — keep them exactly as-is.`,
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
