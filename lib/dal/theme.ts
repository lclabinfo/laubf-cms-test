import { prisma } from '@/lib/db'
import { Prisma } from '@/lib/generated/prisma/client'

export type ThemeWithCustomization = Prisma.ThemeCustomizationGetPayload<{
  include: { theme: true }
}>

export async function getThemeWithCustomization(
  churchId: string,
): Promise<ThemeWithCustomization | null> {
  return prisma.themeCustomization.findUnique({
    where: { churchId },
    include: { theme: true },
  })
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
