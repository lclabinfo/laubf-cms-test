import { prisma } from '@/lib/db/client'
import { Prisma } from '@/lib/generated/prisma/client'

export type PageWithSections = Prisma.PageGetPayload<{
  include: { sections: true }
}>

export type PageRecord = Prisma.PageGetPayload<Record<string, never>>

export async function getPageBySlug(
  churchId: string,
  slug: string,
): Promise<PageWithSections | null> {
  return prisma.page.findUnique({
    where: { churchId_slug: { churchId, slug } },
    include: {
      sections: { orderBy: { sortOrder: 'asc' } },
    },
  })
}

export async function getPages(churchId: string): Promise<PageRecord[]> {
  return prisma.page.findMany({
    where: { churchId, deletedAt: null },
    orderBy: { sortOrder: 'asc' },
  })
}
