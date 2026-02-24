import { prisma } from '@/lib/db/client'
import { type SiteSettings } from '@/lib/generated/prisma/client'

export type SiteSettingsRecord = SiteSettings

export async function getSiteSettings(
  churchId: string,
): Promise<SiteSettingsRecord | null> {
  return prisma.siteSettings.findUnique({
    where: { churchId },
  })
}
