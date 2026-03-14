import enStrings from '@/translations/en.json'

export const LANGUAGES = [
  { code: 'en', label: 'English', nativeLabel: 'English', script: null },
  { code: 'hi', label: 'Hindi', nativeLabel: 'हिन्दी', script: 'Devanagari' },
  { code: 'ta', label: 'Tamil', nativeLabel: 'தமிழ்', script: 'Tamil' },
  { code: 'te', label: 'Telugu', nativeLabel: 'తెలుగు', script: 'Telugu' },
  { code: 'kn', label: 'Kannada', nativeLabel: 'ಕನ್ನಡ', script: 'Kannada' },
  { code: 'bn', label: 'Bengali', nativeLabel: 'বাংলা', script: 'Bengali' },
  { code: 'mr', label: 'Marathi', nativeLabel: 'मराठी', script: 'Devanagari' },
  { code: 'ml', label: 'Malayalam', nativeLabel: 'മലയാളം', script: 'Malayalam' },
  { code: 'gu', label: 'Gujarati', nativeLabel: 'ગુજરાતી', script: 'Gujarati' },
] as const

export function getNotoFontUrl(script: string): string {
  const serif = `Noto+Serif+${script}`
  const sans = `Noto+Sans+${script}`
  return `https://fonts.googleapis.com/css2?family=${serif}:wght@400;600;700&family=${sans}:wght@300;400;500;700&display=swap`
}

export function getNotoFontFamily(script: string): { sans: string, serif: string } {
  return {
    sans: `'Noto Sans ${script}', sans-serif`,
    serif: `'Noto Serif ${script}', serif`,
  }
}

export type LanguageCode = typeof LANGUAGES[number]['code']

export type UIStrings = typeof enStrings

const translationCache = new Map<string, UIStrings>()
translationCache.set('en', enStrings)

export async function loadTranslation(code: LanguageCode): Promise<UIStrings> {
  if (translationCache.has(code)) {
    return translationCache.get(code)!
  }

  try {
    const mod = await import(`@/translations/${code}.json`)
    const strings = mod.default as UIStrings
    translationCache.set(code, strings)
    return strings
  } catch {
    // Fall back to English if translation file doesn't exist
    return enStrings
  }
}

export function getEnglishStrings(): UIStrings {
  return enStrings
}

export function t(strings: UIStrings, key: keyof UIStrings, vars?: Record<string, string | number>): string {
  let value = strings[key] ?? enStrings[key] ?? key
  if (vars) {
    for (const [k, v] of Object.entries(vars)) {
      value = value.replaceAll(`{${k}}`, String(v))
    }
  }
  return value
}
