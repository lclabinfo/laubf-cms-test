import { prisma } from '@/lib/db'
import { Prisma } from '@/lib/generated/prisma/client'
import { unstable_cache } from 'next/cache'

export type ThemeWithCustomization = Prisma.ThemeCustomizationGetPayload<{
  include: { theme: true }
}>

async function _getThemeWithCustomization(
  churchId: string,
): Promise<ThemeWithCustomization | null> {
  return prisma.themeCustomization.findUnique({
    where: { churchId },
    include: { theme: true },
  })
}

export function getThemeWithCustomization(
  churchId: string,
): Promise<ThemeWithCustomization | null> {
  return unstable_cache(
    () => _getThemeWithCustomization(churchId),
    ['theme', churchId],
    { revalidate: 3600, tags: [`church:${churchId}:theme`] }
  )()
}

export async function updateThemeCustomization(
  churchId: string,
  data: Prisma.ThemeCustomizationUncheckedUpdateInput,
) {
  return prisma.themeCustomization.update({
    where: { churchId },
    data,
    include: { theme: true },
  })
}
