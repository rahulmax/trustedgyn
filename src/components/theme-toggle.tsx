'use client'

import { useState, useCallback, useSyncExternalStore } from 'react'
import { Sun, Moon } from 'lucide-react'

const STORAGE_KEY = 'trustedgyn-theme'

function getTheme(): 'light' | 'dark' {
  if (typeof document === 'undefined') return 'light'
  return document.documentElement.classList.contains('dark') ? 'dark' : 'light'
}

function applyTheme(theme: 'light' | 'dark') {
  document.documentElement.classList.toggle('dark', theme === 'dark')
  localStorage.setItem(STORAGE_KEY, theme)
}

export function ThemeToggle() {
  const [, rerender] = useState(0)

  const theme = useSyncExternalStore(
    useCallback(() => () => {}, []),
    getTheme,
    () => 'light' as const,
  )

  const toggle = () => {
    const next = theme === 'light' ? 'dark' : 'light'
    applyTheme(next)
    rerender((n) => n + 1)
  }

  return (
    <button
      type="button"
      onClick={toggle}
      className="flex h-10 w-10 items-center justify-center rounded-full bg-card shadow-sm transition-colors hover:bg-card-inset"
      aria-label={theme === 'light' ? 'Switch to dark mode' : 'Switch to light mode'}
    >
      {theme === 'light' ? (
        <Moon size={18} className="text-text-muted" />
      ) : (
        <Sun size={18} className="text-text-muted" />
      )}
    </button>
  )
}
