'use client'

import { useState, useRef } from 'react'
import { Search, ArrowUp, Loader2, Sparkles, AlertCircle } from 'lucide-react'
import { type BadgeKey } from '@/lib/types'

type ChatFilters = {
  city?: string
  badges: BadgeKey[]
  searchTerms: string[]
  languages?: string[]
}

type ChatResponse = {
  city: string | null
  badges: string[]
  languages: string[]
  searchTerms: string[]
  summary: string
}

type SearchStatus = {
  type: 'idle' | 'loading' | 'result' | 'error'
  message: string
}

type SearchBarProps = {
  value: string
  onChange: (value: string) => void
  onAIFilters: (filters: ChatFilters) => void
  cities: string[]
  status: SearchStatus
  onStatusChange: (status: SearchStatus) => void
}

export function SearchBar({ value, onChange, onAIFilters, cities, status, onStatusChange }: SearchBarProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [abortController, setAbortController] = useState<AbortController | null>(null)

  const handleSubmit = async () => {
    const trimmed = value.trim()
    if (!trimmed || status.type === 'loading') return

    const controller = new AbortController()
    setAbortController(controller)
    onStatusChange({ type: 'loading', message: 'Understanding your query...' })

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: trimmed, cities }),
        signal: controller.signal,
      })

      const data = (await res.json()) as ChatResponse

      onStatusChange({ type: 'result', message: data.summary })
      onChange('')

      onAIFilters({
        city: data.city ?? undefined,
        badges: data.badges as BadgeKey[],
        searchTerms: data.searchTerms ?? [],
        languages: data.languages ?? [],
      })
    } catch (e) {
      if ((e as Error).name !== 'AbortError') {
        onStatusChange({ type: 'error', message: 'Something went wrong. Please try again.' })
      }
    }

    setAbortController(null)
  }

  const handleChange = (val: string) => {
    onChange(val)
    if (status.type !== 'idle') {
      onStatusChange({ type: 'idle', message: '' })
    }
    if (abortController) {
      abortController.abort()
      setAbortController(null)
    }
  }

  return (
    <div className="flex items-center gap-2 rounded-[14px] bg-card px-4 py-3 shadow-sm">
      <Search size={20} className="shrink-0 text-text-muted" />
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={(e) => handleChange(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') handleSubmit()
        }}
        placeholder="Search or describe what you need..."
        disabled={status.type === 'loading'}
        className="min-w-0 flex-1 bg-transparent text-[15px] text-text-primary outline-none placeholder:text-text-muted disabled:opacity-50"
      />
      {status.type === 'loading' && (
        <Loader2 size={18} className="shrink-0 animate-spin text-text-muted" />
      )}
      {status.type !== 'loading' && value.trim() && (
        <button
          type="button"
          onClick={handleSubmit}
          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-chip-active text-chip-active-text transition-colors"
          aria-label="Search"
        >
          <ArrowUp size={14} />
        </button>
      )}
    </div>
  )
}

export function SearchStatus({ status }: { status: SearchStatus }) {
  if (status.type === 'idle') return null

  return (
    <div className={`flex items-start gap-2 rounded-xl px-4 py-2.5 text-[13px] leading-relaxed ${
      status.type === 'error'
        ? 'bg-red-50 text-red-700 dark:bg-red-950/30 dark:text-red-400'
        : status.type === 'loading'
          ? 'bg-card-inset text-text-muted'
          : 'bg-card-inset text-text-secondary'
    }`}>
      {status.type === 'error' && <AlertCircle size={14} className="mt-0.5 shrink-0" />}
      {status.type === 'loading' && <Loader2 size={14} className="mt-0.5 shrink-0 animate-spin" />}
      {status.type === 'result' && <Sparkles size={14} className="mt-0.5 shrink-0 text-text-muted" />}
      <span>{status.message}</span>
    </div>
  )
}
