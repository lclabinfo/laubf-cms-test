import { prisma } from '@/lib/db'
import { Prisma, type SiteSettings } from '@/lib/generated/prisma/client'

type SiteSettingsRecord = SiteSettings

export async function getSiteSettings(
  churchId: string,
): Promise<SiteSettingsRecord | null> {
  return prisma.siteSettings.findUnique({
    where: { churchId },
  })
}

export async function updateSiteSettings(
  churchId: string,
  data: Omit<Prisma.SiteSettingsUncheckedUpdateInput, 'churchId'>,
) {
  return prisma.siteSettings.upsert({
    where: { churchId },
    update: data,
    create: { ...data as Omit<Prisma.SiteSettingsUncheckedCreateInput, 'churchId'>, churchId },
  })
}
