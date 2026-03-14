'use client'

import { useState, useRef, useEffect } from 'react'
import { Globe, ChevronDown } from 'lucide-react'
import { LANGUAGES } from '@/lib/i18n'
import { useTranslation } from '@/lib/translation-context'

export function LanguagePicker() {
  const { language, setLanguage } = useTranslation()
  const [open, setOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  const current = LANGUAGES.find(l => l.code === language) ?? LANGUAGES[0]

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    if (open) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [open])

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 rounded-full bg-card px-3 py-2 text-[13px] font-medium text-text-primary shadow-sm transition-colors hover:bg-card-inset"
      >
        <Globe size={14} className="text-text-muted" />
        <span>{current.nativeLabel}</span>
        <ChevronDown
          size={14}
          className={`text-text-muted transition-transform ${open ? 'rotate-180' : ''}`}
        />
      </button>

      {open && (
        <div className="absolute top-full right-0 z-50 mt-2 w-44 overflow-y-auto rounded-[14px] bg-card py-2 shadow-lg">
          {LANGUAGES.map((lang) => (
            <button
              key={lang.code}
              type="button"
              onClick={() => { setLanguage(lang.code); setOpen(false) }}
              className={`flex w-full items-center justify-between px-4 py-2.5 text-left text-[14px] transition-colors hover:bg-card-inset ${
                language === lang.code ? 'font-semibold text-text-primary' : 'text-text-secondary'
              }`}
            >
              <span>{lang.nativeLabel}</span>
              <span className="text-[12px] text-text-muted">{lang.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
