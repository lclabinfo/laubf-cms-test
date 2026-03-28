import { prisma } from '@/lib/db'
import { Prisma, type SiteSettings } from '@/lib/generated/prisma/client'
import { unstable_cache } from 'next/cache'

/** Override global omit to include all fields in detail/write queries */
const siteSettingsDetailOmit = {
  customHeadHtml: false as const,
  customBodyHtml: false as const,
}

type SiteSettingsRecord = SiteSettings

async function _getSiteSettings(
  churchId: string,
): Promise<SiteSettingsRecord | null> {
  return prisma.siteSettings.findUnique({
    where: { churchId },
    omit: siteSettingsDetailOmit,
  })
}

export function getSiteSettings(
  churchId: string,
): Promise<SiteSettingsRecord | null> {
  return unstable_cache(
    () => _getSiteSettings(churchId),
    ['site-settings', churchId],
    { revalidate: 3600, tags: [`church:${churchId}:settings`] }
  )()
}

export async function updateSiteSettings(
  churchId: string,
  data: Omit<Prisma.SiteSettingsUncheckedUpdateInput, 'churchId'>,
) {
  return prisma.siteSettings.upsert({
    where: { churchId },
    update: data,
    create: { ...data as Omit<Prisma.SiteSettingsUncheckedCreateInput, 'churchId'>, churchId },
    omit: siteSettingsDetailOmit,
  })
}

export async function getNavbarSettings(churchId: string) {
  const settings = await getSiteSettings(churchId)
  return {
    scrollBehavior: settings?.navScrollBehavior ?? 'transparent-to-solid',
    solidColor: settings?.navSolidColor ?? 'white',
    sticky: settings?.navSticky ?? true,
    ctaLabel: settings?.navCtaLabel ?? '',
    ctaHref: settings?.navCtaHref ?? '',
    ctaVisible: settings?.navCtaVisible ?? false,
  }
}

export async function updateNavbarSettings(
  churchId: string,
  data: {
    scrollBehavior?: string
    solidColor?: string
    sticky?: boolean
    ctaLabel?: string
    ctaHref?: string
    ctaVisible?: boolean
  },
) {
  // Map from navbar-specific keys to SiteSettings field names
  const updateData: Prisma.SiteSettingsUncheckedUpdateInput = {}
  if (data.scrollBehavior !== undefined) updateData.navScrollBehavior = data.scrollBehavior
  if (data.solidColor !== undefined) updateData.navSolidColor = data.solidColor
  if (data.sticky !== undefined) updateData.navSticky = data.sticky
  if (data.ctaLabel !== undefined) updateData.navCtaLabel = data.ctaLabel
  if (data.ctaHref !== undefined) updateData.navCtaHref = data.ctaHref
  if (data.ctaVisible !== undefined) updateData.navCtaVisible = data.ctaVisible

  return updateSiteSettings(churchId, updateData)
}
