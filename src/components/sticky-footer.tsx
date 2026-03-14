'use client'

import { Siren, Info, PlusCircle } from 'lucide-react'
import { EXTERNAL_URLS } from '@/lib/constants'

export function StickyFooter() {
  const scrollToSection = (id: string) => {
    const el = document.getElementById(id)
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' })
    }
  }

  return (
    <div className="fixed right-0 bottom-0 left-0 z-40 border-t border-border bg-card pb-8">
      <div className="mx-auto flex max-w-[480px] items-center justify-between px-5 py-2.5">
        <button
          type="button"
          onClick={() => scrollToSection('helplines')}
          className="flex items-center gap-1.5 text-[14px] font-semibold text-emergency transition-colors hover:opacity-80"
        >
          <Siren size={15} />
          <span>Helplines</span>
        </button>

        <button
          type="button"
          onClick={() => scrollToSection('about-section')}
          className="flex items-center gap-1.5 text-[14px] font-medium text-text-secondary transition-colors hover:text-text-primary"
        >
          <Info size={14} />
          <span>About</span>
        </button>

        <a
          href={EXTERNAL_URLS.submissionForm}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1.5 text-[14px] font-medium text-text-secondary transition-colors hover:text-text-primary"
        >
          <PlusCircle size={14} />
          <span>Submit</span>
        </a>
      </div>
    </div>
  )
}
