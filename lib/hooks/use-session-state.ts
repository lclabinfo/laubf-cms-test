import { useState, useCallback } from "react"

/**
 * Drop-in replacement for useState that persists to sessionStorage.
 * State survives back-navigation but clears on tab close.
 */
export function useSessionState<T>(
  key: string,
  defaultValue: T
): [T, (value: T | ((prev: T) => T)) => void] {
  const [state, setStateRaw] = useState<T>(() => {
    if (typeof window === "undefined") return defaultValue
    try {
      const stored = sessionStorage.getItem(key)
      return stored ? JSON.parse(stored) : defaultValue
    } catch {
      return defaultValue
    }
  })

  const setState = useCallback(
    (value: T | ((prev: T) => T)) => {
      setStateRaw((prev) => {
        const next =
          typeof value === "function"
            ? (value as (prev: T) => T)(prev)
            : value
        try {
          sessionStorage.setItem(key, JSON.stringify(next))
        } catch {
          // sessionStorage full or unavailable — silently degrade
        }
        return next
      })
    },
    [key]
  )

  return [state, setState]
}
