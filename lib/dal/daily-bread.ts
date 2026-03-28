import { prisma } from '@/lib/db'
import { ContentStatus, Prisma, type DailyBread } from '@/lib/generated/prisma/client'
import { unstable_cache } from 'next/cache'

type DailyBreadRecord = DailyBread

async function _getTodaysDailyBread(
  churchId: string,
): Promise<DailyBreadRecord | null> {
  // Use UTC midnight to match @db.Date columns (Prisma stores dates as UTC midnight)
  const now = new Date()
  const todayStr = `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, '0')}-${String(now.getUTCDate()).padStart(2, '0')}`
  const today = new Date(todayStr + 'T00:00:00.000Z')

  return prisma.dailyBread.findFirst({
    where: {
      churchId,
      date: today,
      status: ContentStatus.PUBLISHED,
      deletedAt: null,
    },
  })
}

export function getTodaysDailyBread(
  churchId: string,
): Promise<DailyBreadRecord | null> {
  return unstable_cache(
    () => _getTodaysDailyBread(churchId),
    ['daily-bread', churchId],
    { revalidate: 3600, tags: [`church:${churchId}:daily-bread`] }
  )()
}

export async function getDailyBreads(
  churchId: string,
  limit = 30,
): Promise<DailyBreadRecord[]> {
  return prisma.dailyBread.findMany({
    where: {
      churchId,
      deletedAt: null,
      status: ContentStatus.PUBLISHED,
    },
    orderBy: { date: 'desc' },
    take: limit,
  })
}

export async function createDailyBread(
  churchId: string,
  data: Omit<Prisma.DailyBreadUncheckedCreateInput, 'churchId'>,
) {
  return prisma.dailyBread.create({
    data: { ...data, churchId },
  })
}

export async function updateDailyBread(
  churchId: string,
  id: string,
  data: Prisma.DailyBreadUncheckedUpdateInput,
) {
  return prisma.dailyBread.update({
    where: { id, churchId },
    data,
  })
}

export async function deleteDailyBread(churchId: string, id: string) {
  return prisma.dailyBread.update({
    where: { id, churchId },
    data: { deletedAt: new Date() },
  })
}
