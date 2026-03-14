'use client'

import { BADGE_CONFIG } from '@/lib/badges'
import { type BadgeKey } from '@/lib/types'

type FilterChipsProps = {
  activeFilters: BadgeKey[]
  onToggle: (badge: BadgeKey) => void
  totalCount: number
  filteredCount: number
}

const badgeKeys = Object.keys(BADGE_CONFIG) as BadgeKey[]

export function FilterChips({ activeFilters, onToggle, totalCount, filteredCount }: FilterChipsProps) {
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
        All ({isAllActive ? totalCount : filteredCount})
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
            {BADGE_CONFIG[key].label}
          </button>
        )
      })}
    </div>
  )
}
