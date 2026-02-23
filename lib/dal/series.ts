import { prisma } from '@/lib/db'
import { Prisma, type Series } from '@/lib/generated/prisma/client'

type SeriesRecord = Series

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

export async function createSeries(
  churchId: string,
  data: Omit<Prisma.SeriesUncheckedCreateInput, 'churchId'>,
) {
  return prisma.series.create({
    data: { ...data, churchId },
  })
}

export async function updateSeries(
  churchId: string,
  id: string,
  data: Prisma.SeriesUncheckedUpdateInput,
) {
  return prisma.series.update({
    where: { id, churchId },
    data,
  })
}

export async function deleteSeries(churchId: string, id: string) {
  return prisma.series.update({
    where: { id, churchId },
    data: { deletedAt: new Date() },
  })
}
