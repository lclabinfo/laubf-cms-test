import { prisma } from '@/lib/db'
import { Prisma } from '@/lib/generated/prisma/client'

type PageWithSections = Prisma.PageGetPayload<{
  include: { sections: true }
}>

type PageRecord = Prisma.PageGetPayload<Record<string, never>>

export async function getPageBySlug(
  churchId: string,
  slug: string,
): Promise<PageWithSections | null> {
  return prisma.page.findFirst({
    where: { churchId, slug, isPublished: true, deletedAt: null },
    include: {
      sections: { orderBy: { sortOrder: 'asc' } },
    },
  })
}

export async function getHomepage(
  churchId: string,
): Promise<PageWithSections | null> {
  return prisma.page.findFirst({
    where: { churchId, isHomepage: true, isPublished: true, deletedAt: null },
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

export async function createPage(
  churchId: string,
  data: Omit<Prisma.PageUncheckedCreateInput, 'churchId'>,
) {
  return prisma.page.create({
    data: { ...data, churchId },
    include: { sections: { orderBy: { sortOrder: 'asc' } } },
  })
}

export async function updatePage(
  churchId: string,
  id: string,
  data: Prisma.PageUncheckedUpdateInput,
) {
  return prisma.page.update({
    where: { id, churchId },
    data,
    include: { sections: { orderBy: { sortOrder: 'asc' } } },
  })
}

export async function deletePage(churchId: string, id: string) {
  return prisma.page.update({
    where: { id, churchId },
    data: { deletedAt: new Date() },
  })
}
