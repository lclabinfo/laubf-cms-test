import { prisma } from '@/lib/db'
import { Prisma, type Ministry } from '@/lib/generated/prisma/client'

type MinistryRecord = Ministry

export async function getMinistries(
  churchId: string,
): Promise<MinistryRecord[]> {
  return prisma.ministry.findMany({
    where: { churchId, deletedAt: null, isActive: true },
    orderBy: { sortOrder: 'asc' },
  })
}

export async function getMinistryBySlug(
  churchId: string,
  slug: string,
): Promise<MinistryRecord | null> {
  return prisma.ministry.findUnique({
    where: { churchId_slug: { churchId, slug } },
  })
}

export async function createMinistry(
  churchId: string,
  data: Omit<Prisma.MinistryUncheckedCreateInput, 'churchId'>,
) {
  return prisma.ministry.create({
    data: { ...data, churchId },
  })
}

export async function updateMinistry(
  churchId: string,
  id: string,
  data: Prisma.MinistryUncheckedUpdateInput,
) {
  return prisma.ministry.update({
    where: { id, churchId },
    data,
  })
}

export async function deleteMinistry(churchId: string, id: string) {
  return prisma.ministry.update({
    where: { id, churchId },
    data: { deletedAt: new Date() },
  })
}
