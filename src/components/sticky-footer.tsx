'use client'

import { Siren, Info, PlusCircle } from 'lucide-react'
import { EXTERNAL_URLS } from '@/lib/constants'
import { useTranslation } from '@/lib/translation-context'

export function StickyFooter() {
  const { t } = useTranslation()

  const scrollToSection = (id: string) => {
    const el = document.getElementById(id)
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' })
    }
  }

  return (
    <div className="fixed right-0 bottom-0 left-0 z-40 border-t border-border bg-card" style={{ paddingBottom: 'env(safe-area-inset-bottom, 4px)' }}>
      <div className="mx-auto flex max-w-[480px] items-center justify-between px-5 py-2">
        <button
          type="button"
          onClick={() => scrollToSection('helplines')}
          className="flex items-center gap-1.5 text-[14px] font-semibold text-emergency transition-colors hover:opacity-80"
        >
          <Siren size={15} />
          <span>{t('helplines')}</span>
        </button>

        <button
          type="button"
          onClick={() => scrollToSection('about-section')}
          className="flex items-center gap-1.5 text-[14px] font-medium text-text-secondary transition-colors hover:text-text-primary"
        >
          <Info size={14} />
          <span>{t('about')}</span>
        </button>

        <a
          href={EXTERNAL_URLS.submissionForm}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1.5 text-[14px] font-medium text-text-secondary transition-colors hover:text-text-primary"
        >
          <PlusCircle size={14} />
          <span>{t('submit')}</span>
        </a>
      </div>
    </div>
  )
}
