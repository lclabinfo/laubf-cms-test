import { ThemeProvider } from '@/components/website/theme/theme-provider'
import { FontLoader } from '@/components/website/font-loader'
import { WebsiteNavbar } from '@/components/website/layout/website-navbar'
import { WebsiteFooter } from '@/components/website/layout/website-footer'
import { getChurchId } from '@/lib/tenant/context'
import { getSiteSettings } from '@/lib/dal/site-settings'
import { getMenuByLocation } from '@/lib/dal/menus'

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

  return (
    <>
      <FontLoader churchId={churchId} />
      <ThemeProvider churchId={churchId}>
        <WebsiteNavbar
          menu={headerMenu}
          logoUrl={siteSettings?.logoUrl ?? null}
          logoAlt={siteSettings?.logoAlt ?? null}
          siteName={siteSettings?.siteName ?? 'Church'}
        />
        <main>{children}</main>
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
