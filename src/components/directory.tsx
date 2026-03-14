'use client'

import { useState, useMemo, useCallback } from 'react'
import { PhoneCall, MessageSquare, Search } from 'lucide-react'
import { type Doctor, type BadgeKey } from '@/lib/types'
import { CityPicker } from './city-picker'
import { SearchBar } from './search-bar'
import { ChatInput } from './chat-input'
import { FilterChips } from './filter-chips'
import { DoctorCard } from './doctor-card'
import { DoctorDetail } from './doctor-detail'
import { AboutSection } from './about-section'
import { StickyFooter } from './sticky-footer'

type DirectoryProps = {
  doctors: Doctor[]
}

export function Directory({ doctors }: DirectoryProps) {
  const cities = useMemo(() => {
    const counts = new Map<string, number>()
    for (const d of doctors) {
      counts.set(d.city, (counts.get(d.city) ?? 0) + 1)
    }
    return Array.from(counts.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => a.name.localeCompare(b.name))
  }, [doctors])

  const defaultCity = useMemo(() => {
    let maxCity = ''
    let maxCount = 0
    for (const c of cities) {
      if (c.count > maxCount) {
        maxCount = c.count
        maxCity = c.name
      }
    }
    return maxCity
  }, [cities])

  const [selectedCity, setSelectedCity] = useState(defaultCity)
  const [searchQuery, setSearchQuery] = useState('')
  const [activeFilters, setActiveFilters] = useState<BadgeKey[]>([])
  const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null)
  const [scrollPosition, setScrollPosition] = useState(0)
  const [chatMode, setChatMode] = useState(false)

  const cityNames = useMemo(() => cities.map(c => c.name), [cities])

  const filteredDoctors = useMemo(() => {
    let result = doctors

    if (selectedCity) {
      result = result.filter((d) => d.city === selectedCity)
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      result = result.filter(
        (d) =>
          d.name.toLowerCase().includes(q) ||
          d.locality.toLowerCase().includes(q)
      )
    }

    if (activeFilters.length > 0) {
      result = result.filter((d) =>
        activeFilters.every((f) => d.badges.includes(f))
      )
    }

    return result
  }, [doctors, selectedCity, searchQuery, activeFilters])

  const cityDoctorCount = useMemo(() => {
    if (!selectedCity) return doctors.length
    return doctors.filter((d) => d.city === selectedCity).length
  }, [doctors, selectedCity])

  const handleToggleFilter = useCallback((badge: BadgeKey) => {
    setActiveFilters((prev) =>
      prev.includes(badge)
        ? prev.filter((f) => f !== badge)
        : [...prev, badge]
    )
  }, [])

  const handleViewDetails = useCallback((doctor: Doctor) => {
    setScrollPosition(window.scrollY)
    setSelectedDoctor(doctor)
    window.scrollTo(0, 0)
  }, [])

  const handleBack = useCallback(() => {
    setSelectedDoctor(null)
    const pos = scrollPosition
    requestAnimationFrame(() => {
      window.scrollTo(0, pos)
    })
  }, [scrollPosition])

  const handleChatFilters = useCallback((filters: {
    city?: string
    badges: BadgeKey[]
    searchTerms: string[]
  }) => {
    if (filters.city) {
      setSelectedCity(filters.city)
    }
    setActiveFilters(filters.badges)
    setSearchQuery(filters.searchTerms.join(' '))
  }, [])

  if (selectedDoctor) {
    return (
      <div className="mx-auto max-w-[480px] px-4">
        <DoctorDetail doctor={selectedDoctor} onBack={handleBack} />
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-[480px] px-4 pb-28">
      <div className="pt-4">
        <div className="flex items-center justify-between">
          <CityPicker
            cities={cities}
            selected={selectedCity}
            onSelect={setSelectedCity}
          />
          <a
            href="tel:181"
            className="flex h-10 w-10 items-center justify-center rounded-full bg-card shadow-sm"
            aria-label="Women Helpline: 181"
          >
            <PhoneCall size={20} className="text-emergency" />
          </a>
        </div>
        <h1 className="mt-4 font-serif text-[28px] font-bold text-text-primary">
          Find a gynaecologist you can trust
        </h1>
      </div>
      <div className="sticky top-0 z-10 -mx-4 bg-bg px-4 pb-3 pt-3">
        <div className="flex items-center gap-2">
          <div className="min-w-0 flex-1">
            {chatMode ? (
              <ChatInput
                onFiltersExtracted={handleChatFilters}
                cities={cityNames}
              />
            ) : (
              <SearchBar value={searchQuery} onChange={setSearchQuery} />
            )}
          </div>
          <button
            type="button"
            onClick={() => setChatMode(!chatMode)}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-card shadow-sm transition-colors"
            aria-label={chatMode ? 'Switch to search' : 'Switch to AI chat'}
          >
            {chatMode ? (
              <Search size={18} className="text-text-muted" />
            ) : (
              <MessageSquare size={18} className="text-text-muted" />
            )}
          </button>
        </div>
      </div>

      <div className="mt-3">
        <FilterChips
          activeFilters={activeFilters}
          onToggle={handleToggleFilter}
          totalCount={cityDoctorCount}
          filteredCount={filteredDoctors.length}
        />
      </div>

      <p className="mt-4 text-[14px] text-text-muted">
        {filteredDoctors.length} trusted doctor{filteredDoctors.length !== 1 ? 's' : ''}{selectedCity ? ` in ${selectedCity}` : ''}
      </p>

      <div className="mt-3 flex flex-col gap-4">
        {filteredDoctors.map((doctor) => (
          <DoctorCard
            key={doctor.id}
            doctor={doctor}
            onViewDetails={handleViewDetails}
          />
        ))}
      </div>

      <div className="mt-8">
        <AboutSection />
      </div>

      <StickyFooter />
    </div>
  )
}
