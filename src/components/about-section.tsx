'use client'

import { useState } from 'react'
import { ChevronDown, ChevronUp, Phone } from 'lucide-react'
import { HELPLINES, EXTERNAL_URLS } from '@/lib/constants'

export function AboutSection() {
  const [expanded, setExpanded] = useState(false)

  return (
    <div id="about-section">
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="flex w-full items-center justify-between rounded-[14px] bg-white px-5 py-4 text-left shadow-sm"
      >
        <span className="text-[15px] font-semibold text-text-primary">About this directory</span>
        {expanded ? (
          <ChevronUp size={18} color="#999" />
        ) : (
          <ChevronDown size={18} color="#999" />
        )}
      </button>

      {expanded && (
        <div className="mt-2 rounded-[14px] bg-white px-5 py-5 shadow-sm">
          <p className="text-[15px] leading-relaxed text-text-secondary">
            A crowdsourced directory of trusted gynecologists in India who provide respectful,
            judgment-free care — regardless of your lifestyle, identity, or choices.
          </p>

          <p className="mt-4 text-[14px] text-text-secondary">
            Based on the crowdsourced directory by{' '}
            <a
              href={EXTERNAL_URLS.creatorTwitter}
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-text-primary underline"
            >
              Amba Azaad
            </a>
            {' \u00B7 '}
            <a
              href={EXTERNAL_URLS.originalDoc}
              target="_blank"
              rel="noopener noreferrer"
              className="underline"
            >
              View original doc
            </a>
          </p>

          <div id="helplines" className="mt-5 border-t border-border pt-4">
            <p className="mb-3 text-[12px] font-medium tracking-wider text-text-muted uppercase">
              Helplines
            </p>
            <div className="flex flex-col gap-2.5">
              {HELPLINES.map((helpline) => (
                <a
                  key={helpline.number}
                  href={`tel:${helpline.number}`}
                  className="flex items-center gap-2 text-[14px] text-text-secondary transition-colors hover:text-text-primary"
                >
                  <Phone size={14} color="#999" className="shrink-0" />
                  <span className="font-medium">{helpline.label}</span>
                  <span className="text-text-muted">{helpline.number}</span>
                </a>
              ))}
            </div>
          </div>

          <p className="mt-5 border-t border-border pt-4 text-[13px] text-text-muted">
            Content licensed under CC BY-NC-SA 4.0
          </p>
        </div>
      )}
    </div>
  )
}
