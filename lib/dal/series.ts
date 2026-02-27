import { prisma } from '@/lib/db'
import { Prisma, type Series } from '@/lib/generated/prisma/client'

type SeriesRecord = Series

export async function getAllSeries(churchId: string): Promise<SeriesRecord[]> {
  return prisma.series.findMany({
    where: { churchId, deletedAt: null, isActive: true },
    orderBy: { sortOrder: 'asc' },
  })
}

export async function getSeriesById(
  churchId: string,
  id: string,
): Promise<SeriesRecord | null> {
  return prisma.series.findFirst({
    where: { id, churchId, deletedAt: null },
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

/**
 * Replace all MessageSeries join records for a series with the given message IDs.
 * This is a full replacement — any messages not in the list are removed from the series.
 */
export async function setSeriesMessages(
  seriesId: string,
  messageIds: string[],
) {
  await prisma.$transaction(async (tx) => {
    // Remove all existing associations for this series
    await tx.messageSeries.deleteMany({
      where: { seriesId },
    })

    // Create new associations
    if (messageIds.length > 0) {
      await tx.messageSeries.createMany({
        data: messageIds.map((messageId, index) => ({
          messageId,
          seriesId,
          sortOrder: index,
        })),
      })
    }
  })
}
