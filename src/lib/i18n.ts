import enStrings from '@/translations/en.json'

export const LANGUAGES = [
  { code: 'en', label: 'English', nativeLabel: 'English' },
  { code: 'hi', label: 'Hindi', nativeLabel: 'हिन्दी' },
  { code: 'ta', label: 'Tamil', nativeLabel: 'தமிழ்' },
  { code: 'te', label: 'Telugu', nativeLabel: 'తెలుగు' },
  { code: 'kn', label: 'Kannada', nativeLabel: 'ಕನ್ನಡ' },
  { code: 'bn', label: 'Bengali', nativeLabel: 'বাংলা' },
  { code: 'mr', label: 'Marathi', nativeLabel: 'मराठी' },
  { code: 'ml', label: 'Malayalam', nativeLabel: 'മലയാളം' },
  { code: 'gu', label: 'Gujarati', nativeLabel: 'ગુજરાતી' },
] as const

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
