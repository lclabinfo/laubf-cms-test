import { prisma } from '@/lib/db'
import { Prisma } from '@/lib/generated/prisma/client'

export async function getChurch(churchId: string) {
  return prisma.church.findUnique({
    where: { id: churchId },
    select: {
      id: true,
      name: true,
      slug: true,
      logoUrl: true,
      faviconUrl: true,
      email: true,
      phone: true,
      address: true,
      city: true,
      state: true,
      zipCode: true,
      country: true,
      websiteUrl: true,
      facebookUrl: true,
      instagramUrl: true,
      youtubeUrl: true,
      twitterUrl: true,
      timezone: true,
      settings: true,
    },
  })
}

/**
 * Returns the church's configured default Bible version from settings JSON.
 * Falls back to "ESV" if no setting exists.
 */
export async function getChurchDefaultBibleVersion(churchId: string): Promise<string> {
  const church = await prisma.church.findUnique({
    where: { id: churchId },
    select: { settings: true },
  })
  const settings = church?.settings
  if (settings && typeof settings === 'object' && !Array.isArray(settings)) {
    const s = settings as Record<string, unknown>
    if (typeof s.defaultBibleVersion === 'string' && s.defaultBibleVersion) {
      return s.defaultBibleVersion
    }
  }
  return 'ESV'
}

export async function updateChurch(
  churchId: string,
  data: {
    name?: string
    email?: string | null
    phone?: string | null
    address?: string | null
    city?: string | null
    state?: string | null
    zipCode?: string | null
    country?: string
    websiteUrl?: string | null
    facebookUrl?: string | null
    instagramUrl?: string | null
    youtubeUrl?: string | null
    twitterUrl?: string | null
    timezone?: string
    settings?: Prisma.InputJsonValue | null
  },
) {
  // Prisma requires DbNull for setting JSON to null
  const prismaData = { ...data }
  if (prismaData.settings === null) {
    (prismaData as Record<string, unknown>).settings = Prisma.DbNull
  } else if (prismaData.settings && typeof prismaData.settings === 'object') {
    // Merge incoming settings with existing settings to avoid overwriting unrelated keys
    const existing = await prisma.church.findUnique({
      where: { id: churchId },
      select: { settings: true },
    })
    const existingSettings = (existing?.settings && typeof existing.settings === 'object' && !Array.isArray(existing.settings))
      ? existing.settings as Record<string, unknown>
      : {}
    prismaData.settings = { ...existingSettings, ...(prismaData.settings as Record<string, unknown>) } as Prisma.InputJsonValue
  }

  return prisma.church.update({
    where: { id: churchId },
    data: prismaData as Prisma.ChurchUncheckedUpdateInput,
    select: {
      id: true,
      name: true,
      slug: true,
      logoUrl: true,
      faviconUrl: true,
      email: true,
      phone: true,
      address: true,
      city: true,
      state: true,
      zipCode: true,
      country: true,
      websiteUrl: true,
      facebookUrl: true,
      instagramUrl: true,
      youtubeUrl: true,
      twitterUrl: true,
      timezone: true,
      settings: true,
    },
  })
}
