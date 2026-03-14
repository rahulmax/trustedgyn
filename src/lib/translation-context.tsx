'use client'

import { createContext, useContext, useState, useEffect, useCallback, useRef, type ReactNode } from 'react'
import { type UIStrings, type LanguageCode, getEnglishStrings, loadTranslation, t as translate } from './i18n'

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
