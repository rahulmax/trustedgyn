'use client'

import { createContext, useContext, useState, useEffect, useCallback, useRef, type ReactNode } from 'react'
import { type UIStrings, type LanguageCode, LANGUAGES, getEnglishStrings, loadTranslation, getNotoFontUrl, getNotoFontFamily, t as translate } from './i18n'

type TranslationContextValue = {
  language: LanguageCode
  setLanguage: (code: LanguageCode) => void
  strings: UIStrings
  t: (key: keyof UIStrings, vars?: Record<string, string | number>) => string
}

const TranslationContext = createContext<TranslationContextValue | null>(null)

const STORAGE_KEY = 'trustedgyn-lang'

function getStoredLanguage(): LanguageCode {
  if (typeof window === 'undefined') return 'en'
  return (localStorage.getItem(STORAGE_KEY) as LanguageCode) ?? 'en'
}

export function TranslationProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<LanguageCode>(getStoredLanguage)
  const [strings, setStrings] = useState<UIStrings>(getEnglishStrings())
  const initialized = useRef(false)

  useEffect(() => {
    if (initialized.current) return
    initialized.current = true
    if (language !== 'en') {
      loadTranslation(language).then(setStrings)
    }
  }, [language])

  // Load Noto fonts for non-English languages
  useEffect(() => {
    const langConfig = LANGUAGES.find(l => l.code === language)
    const script = langConfig?.script
    if (!script) {
      // English — reset to Alegreya
      document.documentElement.style.removeProperty('--noto-sans')
      document.documentElement.style.removeProperty('--noto-serif')
      document.documentElement.classList.remove('noto-active')
      return
    }

    // Inject Google Fonts link if not already present
    const linkId = `noto-font-${script}`
    if (!document.getElementById(linkId)) {
      const link = document.createElement('link')
      link.id = linkId
      link.rel = 'stylesheet'
      link.href = getNotoFontUrl(script)
      document.head.appendChild(link)
    }

    // Set CSS custom properties for Noto fonts
    const { sans, serif } = getNotoFontFamily(script)
    document.documentElement.style.setProperty('--noto-sans', sans)
    document.documentElement.style.setProperty('--noto-serif', serif)
    document.documentElement.classList.add('noto-active')
  }, [language])

  const setLanguage = useCallback((code: LanguageCode) => {
    setLanguageState(code)
    localStorage.setItem(STORAGE_KEY, code)
    loadTranslation(code).then(setStrings)
  }, [])

  const t = useCallback((key: keyof UIStrings, vars?: Record<string, string | number>) => {
    return translate(strings, key, vars)
  }, [strings])

  return (
    <TranslationContext.Provider value={{ language, setLanguage, strings, t }}>
      {children}
    </TranslationContext.Provider>
  )
}

export function useTranslation() {
  const ctx = useContext(TranslationContext)
  if (!ctx) {
    throw new Error('useTranslation must be used within TranslationProvider')
  }
  return ctx
}
