"use client"

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react"

type Theme = "light" | "dark" | "system"
type Accent = "neutral" | "blue" | "green" | "violet" | "orange"

type CmsThemeContextValue = {
  theme: Theme
  accent: Accent
  setTheme: (theme: Theme) => void
  setAccent: (accent: Accent) => void
  /** The resolved mode after applying system preference */
  resolvedTheme: "light" | "dark"
}

const CmsThemeContext = createContext<CmsThemeContextValue | undefined>(
  undefined
)

const THEME_KEY = "cms-theme"
const ACCENT_KEY = "cms-accent"

function getStoredValue<T extends string>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback
  try {
    const stored = localStorage.getItem(key)
    return (stored as T) ?? fallback
  } catch {
    return fallback
  }
}

function getSystemTheme(): "light" | "dark" {
  if (typeof window === "undefined") return "light"
  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light"
}

export function CmsThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>(() =>
    getStoredValue(THEME_KEY, "system")
  )
  const [accent, setAccentState] = useState<Accent>(() =>
    getStoredValue(ACCENT_KEY, "neutral")
  )
  const [systemTheme, setSystemTheme] = useState<"light" | "dark">(
    getSystemTheme
  )

  // Listen for system preference changes
  useEffect(() => {
    const mq = window.matchMedia("(prefers-color-scheme: dark)")
    const handler = (e: MediaQueryListEvent) => {
      setSystemTheme(e.matches ? "dark" : "light")
    }
    mq.addEventListener("change", handler)
    return () => mq.removeEventListener("change", handler)
  }, [])

  const resolvedTheme = theme === "system" ? systemTheme : theme

  // Apply .dark class and data-accent attribute to <html>
  useEffect(() => {
    const root = document.documentElement
    if (resolvedTheme === "dark") {
      root.classList.add("dark")
    } else {
      root.classList.remove("dark")
    }
  }, [resolvedTheme])

  useEffect(() => {
    const root = document.documentElement
    if (accent === "neutral") {
      root.removeAttribute("data-accent")
    } else {
      root.setAttribute("data-accent", accent)
    }
  }, [accent])

  const setTheme = useCallback((t: Theme) => {
    setThemeState(t)
    try {
      localStorage.setItem(THEME_KEY, t)
    } catch {
      // localStorage may be unavailable
    }
  }, [])

  const setAccent = useCallback((a: Accent) => {
    setAccentState(a)
    try {
      localStorage.setItem(ACCENT_KEY, a)
    } catch {
      // localStorage may be unavailable
    }
  }, [])

  const value = useMemo<CmsThemeContextValue>(
    () => ({ theme, accent, setTheme, setAccent, resolvedTheme }),
    [theme, accent, setTheme, setAccent, resolvedTheme]
  )

  return (
    <CmsThemeContext.Provider value={value}>
      {children}
    </CmsThemeContext.Provider>
  )
}

export function useCmsTheme() {
  const ctx = useContext(CmsThemeContext)
  if (!ctx) {
    throw new Error("useCmsTheme must be used within a CmsThemeProvider")
  }
  return ctx
}
