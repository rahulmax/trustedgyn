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
        className="shrink-0 rounded-full px-4 py-2 text-[15px] font-medium whitespace-nowrap transition-colors"
        style={{
          backgroundColor: isAllActive ? '#2a2a2a' : '#ffffff',
          color: isAllActive ? '#ffffff' : '#555555',
          boxShadow: isAllActive ? 'none' : '0 1px 3px rgba(0,0,0,0.08)',
        }}
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
            className="shrink-0 rounded-full px-4 py-2 text-[15px] font-medium whitespace-nowrap transition-colors"
            style={{
              backgroundColor: isActive ? '#2a2a2a' : '#ffffff',
              color: isActive ? '#ffffff' : '#555555',
              boxShadow: isActive ? 'none' : '0 1px 3px rgba(0,0,0,0.08)',
            }}
            onClick={() => onToggle(key)}
          >
            {BADGE_CONFIG[key].label}
          </button>
        )
      })}
    </div>
  )
}
