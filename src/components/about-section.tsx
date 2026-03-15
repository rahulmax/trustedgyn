'use client'

import { useState } from 'react'
import { ChevronDown, ChevronUp, Phone } from 'lucide-react'
import { HELPLINES, EXTERNAL_URLS } from '@/lib/constants'
import { useTranslation } from '@/lib/translation-context'

export function AboutSection() {
  const { t } = useTranslation()
  const [expanded, setExpanded] = useState(false)

  return (
    <div id="about-section">
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="flex w-full items-center justify-between rounded-[14px] bg-card px-5 py-4 text-left shadow-sm"
      >
        <span className="text-[15px] font-semibold text-text-primary">{t('aboutThisDirectory')}</span>
        {expanded ? (
          <ChevronUp size={18} className="text-text-muted" />
        ) : (
          <ChevronDown size={18} className="text-text-muted" />
        )}
      </button>

      {expanded && (
        <div className="mt-2 rounded-[14px] bg-card px-5 py-5 shadow-sm">
          <p className="text-[15px] leading-relaxed text-text-secondary">
            {t('missionStatement')}
          </p>

          <p className="mt-4 text-[14px] text-text-secondary">
            {t('creditLine')}{' '}
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
              {t('viewOriginalDoc')}
            </a>
          </p>

          <div id="helplines" className="mt-5 border-t border-border pt-4">
            <p className="mb-3 text-[12px] font-medium tracking-wider text-text-muted uppercase">
              {t('helplines')}
            </p>
            <div className="flex flex-col gap-2.5">
              {HELPLINES.map((helpline) => (
                <a
                  key={helpline.number}
                  href={`tel:${helpline.number}`}
                  className="flex items-center gap-2 text-[14px] text-text-secondary transition-colors hover:text-text-primary"
                >
                  <Phone size={14} className="shrink-0 text-text-muted" />
                  <span className="font-medium">{helpline.label}</span>
                  <span className="text-text-muted">{helpline.number}</span>
                </a>
              ))}
            </div>
          </div>

          <p className="mt-5 border-t border-border pt-4 text-[13px] text-text-muted">
            {t('license')}
          </p>

          <p className="mt-4 border-t border-border pt-4 text-[13px] font-medium text-text-secondary">
            Built by{' '}
            <a
              href="https://rahulmax.com"
              target="_blank"
              rel="noopener noreferrer"
              className="underline transition-colors hover:text-text-primary"
            >
              rahulmax
            </a>
          </p>
        </div>
      )}

      <div className="mt-6 px-1 pb-4">
        <div className="space-y-0 text-[13px] leading-relaxed text-text-secondary">
          <p className="border-t border-border pt-3 pb-3">
            This directory is provided &ldquo;as is&rdquo; for informational purposes only.
            It does not constitute medical advice, endorsement, or recommendation of any healthcare provider.
            Doctor listings are crowdsourced from publicly available data and community submissions &mdash;
            information may be inaccurate, outdated, or incomplete.
            We make no warranties regarding the accuracy, reliability, or completeness of any listing.
          </p>
          <p className="border-t border-border pt-3 pb-3">
            Always verify a doctor&rsquo;s credentials, registration, and suitability independently before
            seeking treatment. You assume all risk associated with your use of this information.
            The creators and operators of this directory shall not be liable for any loss, damage,
            or adverse outcome arising from reliance on the information provided here.
          </p>
          <p className="border-t border-border pt-3 pb-3">
            No personal data is collected or stored. This site does not use cookies for tracking.
            If you are a listed doctor and wish to update or remove your information,
            or if you have any grievances, please contact{' '}
            <a href="mailto:hello@rahulmax.com" className="underline">hello@rahulmax.com</a>.
          </p>
          <p className="border-t border-border pt-3">
            Built for India &middot; Information Technology Act, 2000
          </p>
        </div>
      </div>
    </div>
  )
}
