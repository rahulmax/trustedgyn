'use client'

import { useState, useEffect, useMemo } from 'react'
import { useTranslation } from '@/lib/translation-context'
import type { BadgeKey } from '@/lib/types'

// More saturated versions of badge colors for hero display
const HERO_COLORS: Record<string, { light: string; dark: string }> = {
  'queer-friendly':        { light: '#4a3d8f', dark: '#b8a8e8' },
  'trauma-informed':       { light: '#8f3d3d', dark: '#d4a0a0' },
  'reproductive-autonomy': { light: '#7a5a2a', dark: '#d4b070' },
  'accessible':            { light: '#2a6080', dark: '#80c0e0' },
  'financially-considerate': { light: '#2a7a2a', dark: '#80d080' },
  'confidential-autonomous': { light: '#505050', dark: '#c0c0c0' },
  'sex-positive':          { light: '#3d3d8f', dark: '#a8a8e0' },
  'non-traditional-family': { light: '#6a6a2a', dark: '#c8c888' },
}

const HERO_WORDS: { word: string; article: 'a' | 'an'; badgeKey: BadgeKey }[] = [
  { word: 'queer-friendly', article: 'a', badgeKey: 'queer-friendly' },
  { word: 'trauma-informed', article: 'a', badgeKey: 'trauma-informed' },
  { word: 'pro-choice', article: 'a', badgeKey: 'reproductive-autonomy' },
  { word: 'accessible', article: 'an', badgeKey: 'accessible' },
  { word: 'affordable', article: 'an', badgeKey: 'financially-considerate' },
  { word: 'confidential', article: 'a', badgeKey: 'confidential-autonomous' },
  { word: 'sex-positive', article: 'a', badgeKey: 'sex-positive' },
  { word: 'judgment-free', article: 'a', badgeKey: 'non-traditional-family' },
]

const CYCLE_INTERVAL = 3000
const ANIMATION_DURATION = 400

export function HeroTitle() {
  const { t, language } = useTranslation()
  const [index, setIndex] = useState(0)
  const [prevIndex, setPrevIndex] = useState(0)
  const [animating, setAnimating] = useState(false)

  const isDark = useMemo(() => {
    if (typeof window === 'undefined') return false
    return window.matchMedia('(prefers-color-scheme: dark)').matches
  }, [])

  const getColor = (badgeKey: BadgeKey) => {
    const colors = HERO_COLORS[badgeKey]
    if (!colors) return isDark ? '#b0b0b0' : '#4a4a4a'
    return isDark ? colors.dark : colors.light
  }

  useEffect(() => {
    if (language !== 'en') return
    const interval = setInterval(() => {
      setAnimating(true)
      setIndex((prev) => {
        setPrevIndex(prev)
        return (prev + 1) % HERO_WORDS.length
      })
    }, CYCLE_INTERVAL)
    return () => clearInterval(interval)
  }, [language])

  useEffect(() => {
    if (!animating) return
    const timeout = setTimeout(() => setAnimating(false), ANIMATION_DURATION)
    return () => clearTimeout(timeout)
  }, [animating])

  if (language !== 'en') {
    return (
      <h1 className="mt-4 font-serif text-[28px] font-bold text-text-primary">
        {t('heroTitle')}
      </h1>
    )
  }

  const current = HERO_WORDS[index]
  const prev = HERO_WORDS[prevIndex]
  const color = getColor(current.badgeKey)

  return (
    <h1 className="mt-4 font-serif text-[28px] font-bold leading-[1.3] text-text-primary">
      {'Find '}
      {current.article}
      {' '}
      <span className="relative inline-block h-[1.3em] overflow-hidden align-bottom">
        {animating ? (
          <>
            <span
              key={`out-${prevIndex}`}
              className="block"
              style={{
                color: getColor(prev.badgeKey),
                animation: `hero-slide-up-out ${ANIMATION_DURATION}ms ease-in-out forwards`,
              }}
            >
              {prev.word}
            </span>
            <span
              key={`in-${index}`}
              className="absolute inset-x-0 top-0 block"
              style={{
                color,
                animation: `hero-slide-up-in ${ANIMATION_DURATION}ms ease-in-out forwards`,
              }}
            >
              {current.word}
            </span>
          </>
        ) : (
          <span className="block" style={{ color }}>{current.word}</span>
        )}
      </span>
      <br />
      gynaecologist you can trust.
    </h1>
  )
}
