// ─── localStorage-backed state hook ──────────────────────────────────────

'use client'

import { useCallback, useEffect, useState, useSyncExternalStore } from 'react'
import { DEFAULT_STATE, type AppState, STORAGE_KEY } from '@/app/lib/types'
import { DEFAULT_FAQS } from '@/app/lib/defaultFaqs'

const subscribeToHydration = () => () => {}
const getClientHydrationSnapshot = () => true
const getServerHydrationSnapshot = () => false

export function useStore() {
  const [state, setState] = useState<AppState>(() => {
    if (typeof window === 'undefined') return DEFAULT_STATE
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY)
      if (!raw) return { ...DEFAULT_STATE, rules: DEFAULT_FAQS }

      const parsed = JSON.parse(raw) as AppState
      const rules = Array.isArray(parsed.rules) && parsed.rules.length > 0
        ? parsed.rules
        : DEFAULT_FAQS
      return { ...DEFAULT_STATE, ...parsed, rules }
    } catch (err) {
      console.warn('[useStore] hydrate failed', err)
      return { ...DEFAULT_STATE, rules: DEFAULT_FAQS }
    }
  })
  // The server snapshot stays false for SSR and the first client render. Once
  // hydration subscribes, the client snapshot becomes true without an effect
  // that synchronously updates component state.
  const hydrated = useSyncExternalStore(
    subscribeToHydration,
    getClientHydrationSnapshot,
    getServerHydrationSnapshot,
  )

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
    setState({ ...DEFAULT_STATE, rules: DEFAULT_FAQS })
    if (typeof window !== 'undefined') {
      window.localStorage.removeItem(STORAGE_KEY)
    }
  }, [])

  return { state, update, reset, hydrated }
}
