'use client'

import { useState, useMemo, useCallback, useRef } from 'react'
import { PhoneCall, SlidersHorizontal } from 'lucide-react'
import { type Doctor, type BadgeKey } from '@/lib/types'
import { useTranslation } from '@/lib/translation-context'
import { CityPicker } from './city-picker'
import { SearchBar, SearchStatus as SearchStatusDisplay } from './search-bar'
import { FilterChips } from './filter-chips'
import { DoctorCard } from './doctor-card'
import { DoctorDetail } from './doctor-detail'
import { AboutSection } from './about-section'
import { StickyFooter } from './sticky-footer'
import { LanguagePicker } from './language-picker'
import { HeroTitle } from './hero-title'

type DirectoryProps = {
  doctors: Doctor[]
}

export function Directory({ doctors }: DirectoryProps) {
  const { t } = useTranslation()

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
  const [inputValue, setInputValue] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [fallbackQuery, setFallbackQuery] = useState('')
  const [languageFilter, setLanguageFilter] = useState<string[]>([])
  const [activeFilters, setActiveFilters] = useState<BadgeKey[]>([])
  const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null)
  const [detailVisible, setDetailVisible] = useState(false)
  const [scrollPosition, setScrollPosition] = useState(0)
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [searchStatus, setSearchStatus] = useState<{ type: 'idle' | 'loading' | 'result' | 'error'; message: string }>({ type: 'idle', message: '' })
  const detailRef = useRef<HTMLDivElement>(null)

  const cityNames = useMemo(() => cities.map(c => c.name), [cities])

  const filteredDoctors = useMemo(() => {
    let result = doctors

    if (selectedCity) {
      result = result.filter((d) => d.city === selectedCity)
    }

    // AI-derived search terms (specific name/locality from AI)
    if (searchQuery.trim()) {
      const terms = searchQuery.toLowerCase().split(/\s+/)
      result = result.filter((d) =>
        terms.some((q) =>
          d.name.toLowerCase().includes(q) ||
          d.locality.toLowerCase().includes(q) ||
          (d.clinic && d.clinic.toLowerCase().includes(q))
        )
      )
    }

    // Fallback text search (broad match when AI unavailable)
    if (fallbackQuery.trim() && !searchQuery.trim() && activeFilters.length === 0 && languageFilter.length === 0) {
      const terms = fallbackQuery.toLowerCase().split(/\s+/).filter(t => t.length > 1)
      result = result.filter((d) => {
        const haystack = [
          d.name, d.locality, d.city, d.address,
          d.clinic || '', d.qualifications || '',
          ...d.languages, ...d.badges,
          ...(d.testimonial ? (Array.isArray(d.testimonial) ? d.testimonial : [d.testimonial]) : []),
        ].join(' ').toLowerCase()
        return terms.some((q) => haystack.includes(q))
      })
    }

    if (activeFilters.length > 0) {
      result = result.filter((d) =>
        activeFilters.every((f) => d.badges.includes(f))
      )
    }

    if (languageFilter.length > 0) {
      result = result.filter((d) =>
        languageFilter.some((lang) =>
          d.languages.some((dl) => dl.toLowerCase() === lang.toLowerCase())
        )
      )
    }

    return result
  }, [doctors, selectedCity, searchQuery, fallbackQuery, activeFilters, languageFilter])

  const cityDoctorCount = useMemo(() => {
    if (!selectedCity) return doctors.length
    return doctors.filter((d) => d.city === selectedCity).length
  }, [doctors, selectedCity])

  const clearSearchStatus = useCallback(() => {
    setSearchStatus({ type: 'idle', message: '' })
  }, [])

  const handleToggleFilter = useCallback((badge: BadgeKey) => {
    clearSearchStatus()
    setActiveFilters((prev) =>
      prev.includes(badge)
        ? prev.filter((f) => f !== badge)
        : [...prev, badge]
    )
  }, [clearSearchStatus])

  const handleViewDetails = useCallback((doctor: Doctor) => {
    clearSearchStatus()
    setScrollPosition(window.scrollY)
    setSelectedDoctor(doctor)
    window.scrollTo(0, 0)
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        setDetailVisible(true)
      })
    })
  }, [clearSearchStatus])

  const handleBack = useCallback(() => {
    setDetailVisible(false)
    setTimeout(() => {
      setSelectedDoctor(null)
      const pos = scrollPosition
      requestAnimationFrame(() => {
        window.scrollTo(0, pos)
      })
    }, 300)
  }, [scrollPosition])

  const handleChatFilters = useCallback((filters: {
    city?: string
    badges: BadgeKey[]
    searchTerms: string[]
    languages?: string[]
  }) => {
    if (filters.city) {
      setSelectedCity(filters.city)
    }
    setActiveFilters(filters.badges)
    setSearchQuery(filters.searchTerms.length > 0 ? filters.searchTerms.join(' ') : '')
    setLanguageFilter(filters.languages ?? [])
    setFallbackQuery('')
    setInputValue('')
  }, [])

  const handleFallbackSearch = useCallback((query: string) => {
    setFallbackQuery(query)
    // Clear any previous AI filters so fallback has a clean slate
    setSearchQuery('')
    setActiveFilters([])
    setLanguageFilter([])
  }, [])


  const plural = filteredDoctors.length !== 1 ? 's' : ''
  const countText = selectedCity
    ? t('trustedDoctorsIn', { count: filteredDoctors.length, plural, city: selectedCity })
    : t('trustedDoctors', { count: filteredDoctors.length, plural })

  return (
    <div className="mx-auto max-w-[480px] overflow-x-hidden px-4 pb-28">
      {!selectedDoctor && (
        <div className="pt-4">
          <div className="flex items-center justify-between">
            <CityPicker
              cities={cities}
              selected={selectedCity}
              onSelect={(city) => { clearSearchStatus(); setSelectedCity(city) }}
            />
            <div className="flex items-center gap-2">
              <LanguagePicker />
              <a
                href="tel:181"
                className="flex h-10 w-10 items-center justify-center rounded-full bg-card shadow-sm"
                aria-label="Women Helpline: 181"
              >
                <PhoneCall size={20} className="text-emergency" />
              </a>
            </div>
          </div>
          <HeroTitle />
        </div>
      )}
      <div className="sticky top-0 z-10 -mx-4 bg-bg px-4 pb-3 pt-3">
        <div className="flex items-center gap-2">
          <div className="min-w-0 flex-1">
            <SearchBar
              value={inputValue}
              onChange={setInputValue}
              onAIFilters={handleChatFilters}
              onFallbackSearch={handleFallbackSearch}
              cities={cityNames}
              status={searchStatus}
              onStatusChange={setSearchStatus}
            />
          </div>
          <button
            type="button"
            onClick={() => setFiltersOpen(!filtersOpen)}
            className={`relative flex h-10 w-10 shrink-0 items-center justify-center rounded-full shadow-sm transition-colors ${
              filtersOpen || activeFilters.length > 0
                ? 'bg-text-primary text-bg'
                : 'bg-card text-text-muted'
            }`}
            aria-label={t('filters')}
          >
            <SlidersHorizontal size={18} />
            {activeFilters.length > 0 && !filtersOpen && (
              <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-emergency text-[10px] font-bold text-white">
                {activeFilters.length}
              </span>
            )}
          </button>
        </div>
        {searchStatus.type !== 'idle' && (
          <div className="mt-2">
            <SearchStatusDisplay status={searchStatus} />
          </div>
        )}
        {filtersOpen && (
          <div className="mt-3">
            <FilterChips
              activeFilters={activeFilters}
              onToggle={handleToggleFilter}
              totalCount={cityDoctorCount}
              filteredCount={filteredDoctors.length}
            />
          </div>
        )}
      </div>

      {selectedDoctor ? (
        <div
          ref={detailRef}
          className="transition-all duration-300 ease-out"
          style={{
            opacity: detailVisible ? 1 : 0,
            transform: detailVisible ? 'translateY(0)' : 'translateY(24px)',
          }}
        >
          <DoctorDetail doctor={selectedDoctor} onBack={handleBack} />
        </div>
      ) : (
        <>
          <p className="mt-4 text-[14px] text-text-muted">
            {countText}
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
        </>
      )}
    </div>
  )
}
