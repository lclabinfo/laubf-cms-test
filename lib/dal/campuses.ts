import { prisma } from '@/lib/db'
import { Prisma, type Campus } from '@/lib/generated/prisma/client'

type CampusRecord = Campus

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

export async function createCampus(
  churchId: string,
  data: Omit<Prisma.CampusUncheckedCreateInput, 'churchId'>,
) {
  return prisma.campus.create({
    data: { ...data, churchId },
  })
}

export async function updateCampus(
  churchId: string,
  id: string,
  data: Prisma.CampusUncheckedUpdateInput,
) {
  return prisma.campus.update({
    where: { id, churchId },
    data,
  })
}

export async function deleteCampus(churchId: string, id: string) {
  return prisma.campus.update({
    where: { id, churchId },
    data: { deletedAt: new Date() },
  })
}
