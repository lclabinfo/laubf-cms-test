import { prisma } from '@/lib/db'
import { ContentStatus, Prisma, type DailyBread } from '@/lib/generated/prisma/client'

type DailyBreadRecord = DailyBread

export async function getTodaysDailyBread(
  churchId: string,
): Promise<DailyBreadRecord | null> {
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  return prisma.dailyBread.findUnique({
    where: { churchId_date: { churchId, date: today } },
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
