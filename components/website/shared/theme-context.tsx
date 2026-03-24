"use client"

import { createContext, useContext } from "react"
import { themeTokens, type SectionTheme, type ThemeTokens } from "./theme-tokens"

export { type SectionTheme, type ThemeTokens } from "./theme-tokens"

export const SectionThemeContext = createContext<SectionTheme>("light")

/** Returns resolved ThemeTokens for the current section's color scheme. */
export function useSectionTheme(): ThemeTokens {
  const theme = useContext(SectionThemeContext)
  return themeTokens[theme]
}

/** Returns the raw scheme name ("dark" | "light" | "brand" | "muted"). */
export function useRawSectionTheme(): SectionTheme {
  return useContext(SectionThemeContext)
}

/**
 * Resolve tokens from an explicit scheme override or fall back to context.
 * Use this in components that accept an optional `colorScheme` prop.
 */
export function useResolvedTheme(override?: SectionTheme): ThemeTokens {
  const contextTheme = useContext(SectionThemeContext)
  return themeTokens[override ?? contextTheme]
}
