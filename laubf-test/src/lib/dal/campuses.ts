import { prisma } from '@/lib/db/client'
import { type Campus } from '@/lib/generated/prisma/client'

export type CampusRecord = Campus

export async function getCampuses(churchId: string): Promise<CampusRecord[]> {
  return prisma.campus.findMany({
    where: { churchId, deletedAt: null, isActive: true },
    orderBy: { sortOrder: 'asc' },
  })
}

export async function getCampusBySlug(
  churchId: string,
  slug: string,
): Promise<CampusRecord | null> {
  return prisma.campus.findUnique({
    where: { churchId_slug: { churchId, slug } },
  })
}
