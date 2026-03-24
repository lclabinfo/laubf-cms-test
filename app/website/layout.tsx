import type { Metadata } from 'next'
import { ThemeProvider } from '@/components/website/theme/theme-provider'
import { FontLoader } from '@/components/website/font-loader'
import { WebsiteNavbar } from '@/components/website/layout/website-navbar'
import { WebsiteFooter } from '@/components/website/layout/website-footer'
import QuickLinksFAB from '@/components/website/layout/quick-links-fab'
import { getChurchId } from '@/lib/tenant/context'
import { buildLayoutData } from '@/lib/website/build-layout-props'
import { getSiteSettings } from '@/lib/dal/site-settings'

/* ── SEO Metadata ── */

export async function generateMetadata(): Promise<Metadata> {
  const churchId = await getChurchId()
  const siteSettings = await getSiteSettings(churchId)

  const siteName = siteSettings?.siteName ?? 'Church'
  const description = siteSettings?.description ?? undefined
  const ogImageUrl = siteSettings?.ogImageUrl ?? undefined
  const rawUrl = process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXT_PUBLIC_WEBSITE_URL
  const metadataBase = rawUrl ? new URL(rawUrl).origin : undefined

  return {
    metadataBase: metadataBase ? new URL(metadataBase) : undefined,
    title: {
      default: siteName,
      template: `%s | ${siteName}`,
    },
    description,
    openGraph: {
      siteName,
      description: description ?? undefined,
      images: ogImageUrl ? [{ url: ogImageUrl, width: 1200, height: 630, alt: siteName }] : undefined,
    },
    twitter: {
      card: 'summary_large_image',
      title: siteName,
      description: description ?? undefined,
      images: ogImageUrl ? [ogImageUrl] : undefined,
    },
    icons: siteSettings?.faviconUrl
      ? { icon: siteSettings.faviconUrl }
      : undefined,
  }
}

/**
 * Build QuickLinks data from the "Quick Links" group within the header menu.
 * These are children of the first top-level item whose groupLabel contains
 * items with groupLabel === "Quick Links".
 */
function extractQuickLinks(headerMenu: Awaited<ReturnType<typeof buildLayoutData>>['headerMenu']) {
  if (!headerMenu) return []

  for (const topItem of headerMenu.items) {
    const quickLinkChildren = topItem.children.filter(
      (c) => c.groupLabel?.toLowerCase() === 'quick links' && c.isVisible,
    )
    if (quickLinkChildren.length > 0) {
      return quickLinkChildren.map((c) => ({
        label: c.label,
        href: c.href || '',
        icon: c.iconName || 'link',
        description: c.description || undefined,
        scheduleMeta: c.scheduleMeta || undefined,
      }))
    }
  }
  return []
}

export default async function WebsiteLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const churchId = await getChurchId()

  const { navbarProps, headerMenu, footerMenu, siteSettings } = await buildLayoutData(churchId)

  const quickLinks = extractQuickLinks(headerMenu)

  return (
    <>
      <FontLoader churchId={churchId} />
      <ThemeProvider churchId={churchId}>
        <WebsiteNavbar {...navbarProps} />
        <main>{children}</main>
        <QuickLinksFAB
          visible={quickLinks.length > 0}
          title="Quick Links"
          links={quickLinks}
        />
        {siteSettings && (
          <WebsiteFooter
            menu={footerMenu}
            siteSettings={siteSettings}
          />
        )}
      </ThemeProvider>
    </>
  )
}
