import { ThemeProvider } from '@/components/website/theme/theme-provider'
import { FontLoader } from '@/components/website/font-loader'
import { WebsiteNavbar } from '@/components/website/layout/website-navbar'
import { WebsiteFooter } from '@/components/website/layout/website-footer'
import QuickLinksFAB from '@/components/website/layout/quick-links-fab'
import { getChurchId } from '@/lib/tenant/context'
import { getSiteSettings } from '@/lib/dal/site-settings'
import { getMenuByLocation } from '@/lib/dal/menus'

/**
 * Build QuickLinks data from the "Quick Links" group within the header menu.
 * These are children of the first top-level item whose groupLabel contains
 * items with groupLabel === "Quick Links".
 */
function extractQuickLinks(headerMenu: Awaited<ReturnType<typeof getMenuByLocation>>) {
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

  const [siteSettings, headerMenu, footerMenu] = await Promise.all([
    getSiteSettings(churchId),
    getMenuByLocation(churchId, 'HEADER'),
    getMenuByLocation(churchId, 'FOOTER'),
  ])

  const quickLinks = extractQuickLinks(headerMenu)

  return (
    <>
      <FontLoader churchId={churchId} />
      <ThemeProvider churchId={churchId}>
        <WebsiteNavbar
          menu={headerMenu}
          logoUrl={siteSettings?.logoUrl ?? null}
          logoAlt={siteSettings?.logoAlt ?? null}
          siteName={siteSettings?.siteName ?? 'Church'}
          ctaLabel={null}
          ctaHref={null}
          ctaVisible={false}
          memberLoginLabel="Member Login"
          memberLoginHref="/member-login"
          memberLoginVisible={siteSettings?.enableMemberLogin ?? false}
        />
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
