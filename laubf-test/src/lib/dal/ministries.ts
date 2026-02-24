import { prisma } from '@/lib/db/client'
import { type Ministry } from '@/lib/generated/prisma/client'

export type MinistryRecord = Ministry

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
