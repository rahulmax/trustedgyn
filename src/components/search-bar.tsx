'use client'

import { Search, SlidersHorizontal } from 'lucide-react'

type SearchBarProps = {
  value: string
  onChange: (value: string) => void
}

export function SearchBar({ value, onChange }: SearchBarProps) {
  return (
    <div className="flex items-center gap-2 rounded-[14px] bg-white px-4 py-3 shadow-sm">
      <Search size={20} color="#999" className="shrink-0" />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Search doctors, cities, languages..."
        className="min-w-0 flex-1 bg-transparent text-[15px] text-text-primary outline-none placeholder:text-text-muted"
      />
      <button
        type="button"
        className="shrink-0 rounded-lg p-1 transition-colors hover:bg-bg"
        aria-label="Filters"
      >
        <SlidersHorizontal size={18} color="#999" />
      </button>
    </div>
  )
}
