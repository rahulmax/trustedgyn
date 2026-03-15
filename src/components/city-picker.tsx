'use client'

import { useState, useRef, useEffect } from 'react'
import { MapPin, ChevronDown } from 'lucide-react'

type CityPickerProps = {
  cities: { name: string; count: number }[]
  selected: string
  onSelect: (city: string) => void
}

const TIER_1_CITIES = new Set([
  'Mumbai', 'Delhi', 'Bengaluru', 'Chennai', 'Kolkata',
  'Hyderabad', 'Pune', 'Ahmedabad',
])

export function CityPicker({ cities, selected, onSelect }: CityPickerProps) {
  const [open, setOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  const tier1 = cities.filter(c => TIER_1_CITIES.has(c.name))
  const rest = cities.filter(c => !TIER_1_CITIES.has(c.name))

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

  const cityButton = (city: { name: string; count: number }) => (
    <button
      key={city.name}
      type="button"
      onClick={() => { onSelect(city.name); setOpen(false) }}
      className={`flex w-full items-center justify-between px-4 py-2.5 text-left text-[15px] transition-colors hover:bg-card-inset ${
        selected === city.name ? 'font-semibold text-text-primary' : 'text-text-secondary'
      }`}
    >
      <span>{city.name}</span>
      <span className="text-[13px] text-text-muted">{city.count}</span>
    </button>
  )

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 rounded-full bg-card px-4 py-2 text-[15px] font-medium text-text-primary shadow-sm transition-colors hover:bg-card-inset"
      >
        <MapPin size={16} className="text-text-muted" />
        <span>{selected || 'All Cities'}</span>
        <ChevronDown
          size={16}
          className={`text-text-muted transition-transform ${open ? 'rotate-180' : ''}`}
        />
      </button>

      {open && (
        <div className="absolute top-full left-0 z-50 mt-2 max-h-[60vh] w-64 overflow-y-auto rounded-[14px] bg-card py-2 shadow-lg">
          <button
            type="button"
            onClick={() => { onSelect(''); setOpen(false) }}
            className={`flex w-full items-center justify-between px-4 py-2.5 text-left text-[15px] transition-colors hover:bg-card-inset ${
              !selected ? 'font-semibold text-text-primary' : 'text-text-secondary'
            }`}
          >
            <span>All Cities</span>
            <span className="text-[13px] text-text-muted">
              {cities.reduce((sum, c) => sum + c.count, 0)}
            </span>
          </button>
          {tier1.map(cityButton)}
          {rest.length > 0 && (
            <>
              <div className="mx-4 my-1.5 border-t border-border" />
              {rest.map(cityButton)}
            </>
          )}
        </div>
      )}
    </div>
  )
}
