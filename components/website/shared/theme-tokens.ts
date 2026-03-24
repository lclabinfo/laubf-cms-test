/*
 * ============================================
 * COLOR SCHEMES -- Global Theme Palette
 * ============================================
 * Every section in the CMS receives a `colorScheme` setting.
 * SectionContainer reads this value and provides the matching
 * ThemeTokens via React context so child components can render
 * correctly on any background without hard-coding colors.
 *
 * Shopify equivalent: "Color scheme" section setting
 * -- "light"  -> white-1 bg, black-{1,2,3} text   (Scheme 1)
 * -- "dark"   -> black-1 bg, white-{1,2,3} text   (Scheme 2)
 *
 * Inverse mapping logic:
 *   light                  <->  dark
 *   ----------------------------------------
 *   white-1   (bg)         <->  black-1   (bg)
 *   white-1-5 (surface)    <->  black-1-5 (surface)
 *   white-2   (border)     <->  black-2   (border)
 *   white-2-5 (border dim) <->  black-2-5 (border dim)
 *   white-3   (muted)      <->  black-3   (muted)
 *   black-1   (primary)    <->  white-1   (primary)
 *   black-2   (secondary)  <->  white-2   (secondary)
 *   black-3   (muted)      <->  white-3   (muted)
 *
 * -- "brand" -> primary-color bg, white-{1,2,3} text (dark-like, on brand bg)
 * -- "muted" -> neutral-100 bg, black-{1,2,3} text  (light-like, subtler)
 *
 * DB COLUMN: color_scheme ENUM('LIGHT','DARK','BRAND','MUTED') DEFAULT 'LIGHT'
 * ============================================
 */

/**
 * Available color schemes for any section or component.
 * Maps 1-to-1 with ThemeTokens entries below.
 */
export type SectionTheme = "dark" | "light" | "brand" | "muted"

/**
 * Complete set of design tokens resolved from a color scheme.
 * Components should use these tokens instead of hard-coding
 * color classes like `text-black-1` or `text-white-1`.
 */
export interface ThemeTokens {
  /* -- Backgrounds -- */
  bg: string               // section / page background
  surfaceBg: string        // card / input / elevated surface
  surfaceBgSubtle: string  // very subtle raised surface

  /* -- Text hierarchy -- */
  textPrimary: string      // headings, strong labels
  textSecondary: string    // body text, descriptions
  textMuted: string        // overlines, captions, meta info

  /* -- Borders & dividers -- */
  borderColor: string      // standard borders
  borderSubtle: string     // softer / decorative borders

  /* -- Buttons -- primary (filled) -- */
  btnPrimaryBg: string
  btnPrimaryText: string

  /* -- Buttons -- secondary (outline) -- */
  btnOutlineBorder: string
  btnOutlineText: string

  /* -- Cards -- */
  cardBg: string
  cardBorder: string
}

/**
 * Color scheme definitions.
 *
 * light: white-1 background, black-{1,2,3} text scale,
 *        white-{1-5, 2, 2-5} surface / border scale
 *
 * dark:  black-1 background, white-{1,2,3} text scale,
 *        black-{1-5, 2, 2-5} surface / border scale
 */
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
  brand: {
    bg: "bg-[var(--ws-color-primary,#1a1a2e)]",
    surfaceBg: "bg-white-1/10",
    surfaceBgSubtle: "bg-white-1/5",
    textPrimary: "text-white-1",
    textSecondary: "text-white-2",
    textMuted: "text-white-3",
    borderColor: "border-white-1/20",
    borderSubtle: "border-white-1/10",
    btnPrimaryBg: "bg-white-1",
    btnPrimaryText: "text-black-1",
    btnOutlineBorder: "border-white-1",
    btnOutlineText: "text-white-1",
    cardBg: "bg-white-1/10",
    cardBorder: "border-white-1/15",
  },
  muted: {
    bg: "bg-neutral-100",
    surfaceBg: "bg-white",
    surfaceBgSubtle: "bg-neutral-50",
    textPrimary: "text-black-1",
    textSecondary: "text-black-2",
    textMuted: "text-black-3",
    borderColor: "border-neutral-200",
    borderSubtle: "border-neutral-100",
    btnPrimaryBg: "bg-black-1",
    btnPrimaryText: "text-white-1",
    btnOutlineBorder: "border-black-1",
    btnOutlineText: "text-black-1",
    cardBg: "bg-white",
    cardBorder: "border-neutral-200",
  },
}

/* -- Event Type Tag Colors -- */
/* CMS: These map event types to their pill/badge colors.
 * To change a tag color globally, update the value here. */
export const eventTypeColors: Record<string, string> = {
  meeting: "bg-accent-green",
  event: "bg-accent-blue",
  program: "bg-accent-orange",
}

export const EVENT_TYPE_FALLBACK_COLOR = "bg-black-3"

/** Returns true for schemes with dark backgrounds that need light text/overlays. */
export function isDarkScheme(theme: SectionTheme): boolean {
  return theme === "dark" || theme === "brand"
}
