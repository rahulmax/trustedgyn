'use client'

import { Search, SlidersHorizontal } from 'lucide-react'
import { useTranslation } from '@/lib/translation-context'

type SearchBarProps = {
  value: string
  onChange: (value: string) => void
}

export function SearchBar({ value, onChange }: SearchBarProps) {
  const { t } = useTranslation()

  return (
    <div className="flex items-center gap-2 rounded-[14px] bg-card px-4 py-3 shadow-sm">
      <Search size={20} className="shrink-0 text-text-muted" />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={t('searchPlaceholder')}
        className="min-w-0 flex-1 bg-transparent text-[15px] text-text-primary outline-none placeholder:text-text-muted"
      />
      <button
        type="button"
        className="shrink-0 rounded-lg p-1 transition-colors hover:bg-bg"
        aria-label={t('filters')}
      >
        <SlidersHorizontal size={18} className="text-text-muted" />
      </button>
    </div>
  )
}
