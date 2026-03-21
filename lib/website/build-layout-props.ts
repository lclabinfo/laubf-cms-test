import { getSiteSettings } from '@/lib/dal/site-settings'
import { getMenuByLocation } from '@/lib/dal/menus'
import { getThemeWithCustomization } from '@/lib/dal/theme'
import type { SiteSettings } from '@/lib/generated/prisma/client'

type MenuWithItems = Awaited<ReturnType<typeof getMenuByLocation>>

/* ── Navbar props (matches WebsiteNavbarProps in website-navbar.tsx) ── */

function mapNavbarProps(siteSettings: SiteSettings | null, headerMenu: MenuWithItems) {
  return {
    menu: headerMenu,
    logoUrl: siteSettings?.logoUrl ?? null,
    logoDarkUrl: siteSettings?.logoDarkUrl ?? null,
    logoAlt: siteSettings?.logoAlt ?? null,
    siteName: siteSettings?.siteName ?? 'Church',
    ctaLabel: siteSettings?.navCtaLabel ?? null,
    ctaHref: siteSettings?.navCtaHref ?? null,
    ctaVisible: siteSettings?.navCtaVisible ?? false,
    memberLoginLabel: 'Member Login' as const,
    memberLoginHref: '/member-login' as const,
    memberLoginVisible: siteSettings?.enableMemberLogin ?? false,
    scrollBehavior: siteSettings?.navScrollBehavior ?? 'transparent-to-solid',
    solidColor: siteSettings?.navSolidColor ?? 'white',
    sticky: siteSettings?.navSticky ?? true,
  }
}

export type NavbarLayoutProps = ReturnType<typeof mapNavbarProps>

/* ── buildNavbarProps — used by builder pages ── */

/**
 * Fetches navbar-related data (siteSettings + header menu) in parallel.
 * Returns navbarProps (ready to spread onto WebsiteNavbar), the raw headerMenu,
 * and siteSettings for reuse by other builders (e.g. footer, metadata).
 */
export async function buildNavbarProps(churchId: string) {
  const [siteSettings, headerMenu] = await Promise.all([
    getSiteSettings(churchId),
    getMenuByLocation(churchId, 'HEADER'),
  ])

  return {
    navbarProps: mapNavbarProps(siteSettings, headerMenu),
    headerMenu,
    siteSettings,
  }
}

/* ── buildFooterProps — used by builder preview page ── */

/**
 * Fetches footer menu data. Accepts an optional pre-fetched siteSettings to
 * avoid a redundant DB call when siteSettings was already loaded by buildNavbarProps.
 */
export async function buildFooterProps(churchId: string, existingSiteSettings?: SiteSettings | null) {
  const [footerMenu, siteSettings] = await Promise.all([
    getMenuByLocation(churchId, 'FOOTER'),
    existingSiteSettings !== undefined
      ? Promise.resolve(existingSiteSettings)
      : getSiteSettings(churchId),
  ])

  return {
    menu: footerMenu,
    siteSettings,
  }
}

/* ── buildLayoutData — single fetch for the entire website layout ── */

/**
 * Fetches all data needed for the website layout shell (navbar, footer, metadata)
 * in a single parallel query. Use this from `app/website/layout.tsx` to avoid
 * redundant DB calls.
 */
export async function buildLayoutData(churchId: string) {
  const [siteSettings, headerMenu, footerMenu] = await Promise.all([
    getSiteSettings(churchId),
    getMenuByLocation(churchId, 'HEADER'),
    getMenuByLocation(churchId, 'FOOTER'),
  ])

  return {
    /** Props spread directly onto <WebsiteNavbar {...navbarProps} /> */
    navbarProps: mapNavbarProps(siteSettings, headerMenu),
    /** Raw header menu with items — used for extractQuickLinks and builder navigation editor */
    headerMenu,
    /** Raw footer menu with items — passed to <WebsiteFooter menu={footerMenu} /> */
    footerMenu,
    /** Full SiteSettings record — used for footer, metadata, etc. */
    siteSettings,
  }
}

/* ── buildThemeTokens — website --ws-* CSS custom properties ── */

/**
 * Builds the `--ws-*` CSS custom property map from a church's ThemeCustomization.
 * Used by the builder preview/editor pages to inject theme tokens into the canvas.
 * (The public website uses ThemeProvider instead, which handles this internally.)
 */
export async function buildThemeTokens(churchId: string) {
  const themeData = await getThemeWithCustomization(churchId)

  const defaultTokens = (themeData?.theme?.defaultTokens ?? {}) as Record<string, string>

  // Convert hex to "r,g,b" string for use in rgba() gradients
  const hexToRgb = (hex: string): string => {
    const h = hex.replace('#', '')
    const n = parseInt(h.length === 3 ? h.split('').map(c => c + c).join('') : h, 16)
    return `${(n >> 16) & 255},${(n >> 8) & 255},${n & 255}`
  }

  const primaryHex = themeData?.primaryColor || defaultTokens['--color-primary'] || '#1a1a2e'
  const websiteThemeTokens: Record<string, string> = {
    '--ws-color-primary': primaryHex,
    '--ws-color-primary-rgb': hexToRgb(primaryHex),
    '--ws-color-secondary': themeData?.secondaryColor || defaultTokens['--color-secondary'] || '#16213e',
    '--ws-color-background': themeData?.backgroundColor || defaultTokens['--color-background'] || '#ffffff',
    '--ws-color-text': themeData?.textColor || defaultTokens['--color-text'] || '#1a1a1a',
    '--ws-color-heading': themeData?.headingColor || defaultTokens['--color-heading'] || '#0a0a0a',
    '--ws-font-size-base': `${themeData?.baseFontSize || 16}px`,
    '--ws-border-radius': themeData?.borderRadius || defaultTokens['--border-radius'] || '0.5rem',
  }
  if (themeData?.bodyFont) {
    websiteThemeTokens['--ws-font-body'] = `"${themeData.bodyFont}", ui-sans-serif, system-ui, sans-serif`
  }
  if (themeData?.headingFont) {
    websiteThemeTokens['--ws-font-heading'] = `"${themeData.headingFont}", ui-serif, Georgia, serif`
  }

  const websiteCustomCss = themeData?.customCss || ''

  return { websiteThemeTokens, websiteCustomCss }
}
