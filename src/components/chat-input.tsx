'use client'

import { useState, useRef } from 'react'
import { Sparkles, ArrowUp, Loader2 } from 'lucide-react'
import { type BadgeKey } from '@/lib/types'

type ChatFilters = {
  city?: string
  badges: BadgeKey[]
  searchTerms: string[]
}

type ChatInputProps = {
  onFiltersExtracted: (filters: ChatFilters) => void
  cities: string[]
}

type ChatResponse = {
  city: string | null
  badges: string[]
  languages: string[]
  searchTerms: string[]
  summary: string
}

export function ChatInput({ onFiltersExtracted, cities }: ChatInputProps) {
  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(false)
  const [summary, setSummary] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  const handleSubmit = async () => {
    const trimmed = query.trim()
    if (!trimmed || loading) return

    setLoading(true)
    setSummary('')

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: trimmed, cities: cities.map(c => c) }),
      })

      const data = (await res.json()) as ChatResponse

      setSummary(data.summary)
      setQuery('')

      const searchTerms = [
        ...data.searchTerms,
        ...data.languages,
      ]

      onFiltersExtracted({
        city: data.city ?? undefined,
        badges: data.badges as BadgeKey[],
        searchTerms,
      })
    } catch {
      setSummary('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <div className="flex items-center gap-2 rounded-[14px] bg-card px-4 py-3 shadow-sm">
        <Sparkles size={20} className="shrink-0 text-text-muted" />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleSubmit()
          }}
          placeholder="Describe what you're looking for..."
          disabled={loading}
          className="min-w-0 flex-1 bg-transparent text-[15px] text-text-primary outline-none placeholder:text-text-muted disabled:opacity-50"
        />
        {(query.trim() || loading) && (
          <button
            type="button"
            onClick={handleSubmit}
            disabled={loading || !query.trim()}
            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-chip-active text-chip-active-text transition-colors disabled:opacity-40"
            aria-label="Send"
          >
            {loading ? (
              <Loader2 size={14} className="animate-spin" />
            ) : (
              <ArrowUp size={14} />
            )}
          </button>
        )}
      </div>
      {summary && (
        <p className="mt-2 rounded-xl bg-card-inset px-4 py-2.5 text-[13px] leading-relaxed text-text-secondary">
          {summary}
        </p>
      )}
    </div>
  )
}
