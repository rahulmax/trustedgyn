'use client'

import { useState, useRef, useEffect } from 'react'
import { MapPin, ChevronDown } from 'lucide-react'

type CityPickerProps = {
  cities: { name: string; count: number }[]
  selected: string
  onSelect: (city: string) => void
}

export function CityPicker({ cities, selected, onSelect }: CityPickerProps) {
  const [open, setOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

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

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 rounded-full bg-white px-4 py-2 text-[15px] font-medium text-text-primary shadow-sm transition-colors hover:bg-gray-50"
      >
        <MapPin size={16} color="#999" />
        <span>{selected || 'All Cities'}</span>
        <ChevronDown
          size={16}
          color="#999"
          className={`transition-transform ${open ? 'rotate-180' : ''}`}
        />
      </button>

      {open && (
        <div className="absolute top-full left-0 z-50 mt-2 max-h-[60vh] w-64 overflow-y-auto rounded-[14px] bg-white py-2 shadow-lg">
          <button
            type="button"
            onClick={() => { onSelect(''); setOpen(false) }}
            className={`flex w-full items-center justify-between px-4 py-2.5 text-left text-[15px] transition-colors hover:bg-gray-50 ${
              !selected ? 'font-semibold text-text-primary' : 'text-text-secondary'
            }`}
          >
            <span>All Cities</span>
            <span className="text-[13px] text-text-muted">
              {cities.reduce((sum, c) => sum + c.count, 0)}
            </span>
          </button>
          {cities.map((city) => (
            <button
              key={city.name}
              type="button"
              onClick={() => { onSelect(city.name); setOpen(false) }}
              className={`flex w-full items-center justify-between px-4 py-2.5 text-left text-[15px] transition-colors hover:bg-gray-50 ${
                selected === city.name ? 'font-semibold text-text-primary' : 'text-text-secondary'
              }`}
            >
              <span>{city.name}</span>
              <span className="text-[13px] text-text-muted">{city.count}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
