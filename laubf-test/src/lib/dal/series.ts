import { prisma } from '@/lib/db/client'
import { type Series } from '@/lib/generated/prisma/client'

export type SeriesRecord = Series

export async function getAllSeries(churchId: string): Promise<SeriesRecord[]> {
  return prisma.series.findMany({
    where: { churchId, deletedAt: null, isActive: true },
    orderBy: { sortOrder: 'asc' },
  })
}

export async function getSeriesBySlug(
  churchId: string,
  slug: string,
): Promise<SeriesRecord | null> {
  return prisma.series.findUnique({
    where: { churchId_slug: { churchId, slug } },
  })
}
