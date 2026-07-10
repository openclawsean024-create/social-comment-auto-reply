// ─── localStorage-backed state hook ──────────────────────────────────────

'use client'

import { useCallback, useEffect, useState } from 'react'
import { DEFAULT_STATE, type AppState, STORAGE_KEY } from '@/app/lib/types'

export function useStore() {
  const [state, setState] = useState<AppState>(DEFAULT_STATE)
  const [hydrated, setHydrated] = useState(false)

  // Hydrate from localStorage on mount (client only)
  useEffect(() => {
    if (typeof window === 'undefined') return
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY)
      if (raw) {
        const parsed = JSON.parse(raw) as AppState
        setState({ ...DEFAULT_STATE, ...parsed })
      }
    } catch (err) {
      console.warn('[useStore] hydrate failed', err)
    } finally {
      setHydrated(true)
    }
  }, [])

  // Persist on change
  useEffect(() => {
    if (!hydrated) return
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
    } catch (err) {
      console.warn('[useStore] persist failed', err)
    }
  }, [state, hydrated])

  const update = useCallback((partial: Partial<AppState>) => {
    setState((s) => ({ ...s, ...partial }))
  }, [])

  const reset = useCallback(() => {
    setState(DEFAULT_STATE)
    if (typeof window !== 'undefined') {
      window.localStorage.removeItem(STORAGE_KEY)
    }
  }, [])

  return { state, update, reset, hydrated }
}
