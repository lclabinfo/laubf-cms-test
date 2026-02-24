"use client"

import { createContext, useContext } from "react"

export type SectionTheme = "dark" | "light"

export interface ThemeTokens {
  bg: string
  surfaceBg: string
  surfaceBgSubtle: string
  textPrimary: string
  textSecondary: string
  textMuted: string
  borderColor: string
  borderSubtle: string
  btnPrimaryBg: string
  btnPrimaryText: string
  btnOutlineBorder: string
  btnOutlineText: string
  cardBg: string
  cardBorder: string
}

export const themeTokens: Record<SectionTheme, ThemeTokens> = {
  light: {
    bg: "bg-white-1",
    surfaceBg: "bg-white-1-5",
    surfaceBgSubtle: "bg-white-0",
    textPrimary: "text-black-1",
    textSecondary: "text-black-2",
    textMuted: "text-black-3",
    borderColor: "border-white-2",
    borderSubtle: "border-white-2-5",
    btnPrimaryBg: "bg-black-1",
    btnPrimaryText: "text-white-1",
    btnOutlineBorder: "border-black-1",
    btnOutlineText: "text-black-1",
    cardBg: "bg-white-1-5",
    cardBorder: "border-white-2-5",
  },
  dark: {
    bg: "bg-black-1",
    surfaceBg: "bg-black-1-5",
    surfaceBgSubtle: "bg-black-gradient",
    textPrimary: "text-white-1",
    textSecondary: "text-white-2",
    textMuted: "text-white-3",
    borderColor: "border-black-2",
    borderSubtle: "border-black-2-5",
    btnPrimaryBg: "bg-white-1",
    btnPrimaryText: "text-black-1",
    btnOutlineBorder: "border-white-1",
    btnOutlineText: "text-white-1",
    cardBg: "bg-black-1-5",
    cardBorder: "border-black-2-5",
  },
}

export const SectionThemeContext = createContext<SectionTheme>("light")

export function useSectionTheme(): ThemeTokens {
  const theme = useContext(SectionThemeContext)
  return themeTokens[theme]
}

export function useRawSectionTheme(): SectionTheme {
  return useContext(SectionThemeContext)
}

export function useResolvedTheme(override?: SectionTheme): ThemeTokens {
  const contextTheme = useContext(SectionThemeContext)
  return themeTokens[override ?? contextTheme]
}

export const eventTypeColors: Record<string, string> = {
  meeting: "bg-accent-green",
  event: "bg-accent-blue",
  program: "bg-accent-orange",
}

export const EVENT_TYPE_FALLBACK_COLOR = "bg-black-3"
