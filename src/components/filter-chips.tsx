'use client'

import { BADGE_CONFIG } from '@/lib/badges'
import { type BadgeKey } from '@/lib/types'
import { useTranslation } from '@/lib/translation-context'
import { type UIStrings } from '@/lib/i18n'

type FilterChipsProps = {
  activeFilters: BadgeKey[]
  onToggle: (badge: BadgeKey) => void
  totalCount: number
  filteredCount: number
}

const badgeKeys = Object.keys(BADGE_CONFIG) as BadgeKey[]

const BADGE_LABEL_KEYS: Record<BadgeKey, keyof UIStrings> = {
  'queer-friendly': 'badgeQueerFriendly',
  'reproductive-autonomy': 'badgeReproAutonomy',
  'trauma-informed': 'badgeTraumaInformed',
  'accessible': 'badgeAccessible',
  'financially-considerate': 'badgeAffordable',
  'confidential-autonomous': 'badgeConfidentialAutonomous',
  'sex-positive': 'badgeSexPositive',
  'non-traditional-family': 'badgeNonTradFamily',
}

export function FilterChips({ activeFilters, onToggle, totalCount, filteredCount }: FilterChipsProps) {
  const { t } = useTranslation()
  const isAllActive = activeFilters.length === 0

  return (
    <div className="scrollbar-hide flex gap-2 overflow-x-auto">
      <button
        type="button"
        className={`shrink-0 rounded-full px-4 py-2 text-[15px] font-medium whitespace-nowrap transition-colors ${
          isAllActive
            ? 'bg-chip-active text-chip-active-text'
            : 'bg-chip-inactive text-chip-inactive-text shadow-[0_1px_3px_rgba(0,0,0,0.08)]'
        }`}
        onClick={() => {
          if (!isAllActive) {
            activeFilters.forEach((f) => onToggle(f))
          }
        }}
      >
        {t('allFilter')} ({isAllActive ? totalCount : filteredCount})
      </button>
      {badgeKeys.map((key) => {
        const isActive = activeFilters.includes(key)
        return (
          <button
            key={key}
            type="button"
            className={`shrink-0 rounded-full px-4 py-2 text-[15px] font-medium whitespace-nowrap transition-colors ${
              isActive
                ? 'bg-chip-active text-chip-active-text'
                : 'bg-chip-inactive text-chip-inactive-text shadow-[0_1px_3px_rgba(0,0,0,0.08)]'
            }`}
            onClick={() => onToggle(key)}
          >
            {t(BADGE_LABEL_KEYS[key])}
          </button>
        )
      })}
    </div>
  )
}
