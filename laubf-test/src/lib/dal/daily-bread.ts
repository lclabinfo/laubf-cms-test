import { prisma } from '@/lib/db/client'
import { ContentStatus, type DailyBread } from '@/lib/generated/prisma/client'

export type DailyBreadRecord = DailyBread

export async function getTodaysDailyBread(
  churchId: string,
): Promise<DailyBreadRecord | null> {
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  return prisma.dailyBread.findUnique({
    where: { churchId_date: { churchId, date: today } },
  })
}

export async function getLatestDailyBread(
  churchId: string,
): Promise<DailyBreadRecord | null> {
  return prisma.dailyBread.findFirst({
    where: {
      churchId,
      deletedAt: null,
      status: ContentStatus.PUBLISHED,
    },
    orderBy: { date: 'desc' },
  })
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
