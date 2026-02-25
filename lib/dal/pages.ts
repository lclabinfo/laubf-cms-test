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

// Get page for admin (includes unpublished, includes sections)
export async function getPageForAdmin(
  churchId: string,
  slug: string,
): Promise<PageWithSections | null> {
  return prisma.page.findFirst({
    where: { churchId, slug, deletedAt: null },
    include: {
      sections: { orderBy: { sortOrder: 'asc' } },
    },
  })
}

// Get page by ID for admin (includes unpublished, includes sections)
export async function getPageById(
  churchId: string,
  id: string,
): Promise<PageWithSections | null> {
  return prisma.page.findFirst({
    where: { churchId, id, deletedAt: null },
    include: {
      sections: { orderBy: { sortOrder: 'asc' } },
    },
  })
}

// Get homepage for admin (includes unpublished)
export async function getHomepageForAdmin(
  churchId: string,
): Promise<PageWithSections | null> {
  return prisma.page.findFirst({
    where: { churchId, isHomepage: true, deletedAt: null },
    include: {
      sections: { orderBy: { sortOrder: 'asc' } },
    },
  })
}

// Section CRUD
export async function createPageSection(
  churchId: string,
  pageId: string,
  data: Omit<Prisma.PageSectionUncheckedCreateInput, 'churchId' | 'pageId'>,
) {
  return prisma.pageSection.create({
    data: { ...data, churchId, pageId },
  })
}

export async function updatePageSection(
  churchId: string,
  id: string,
  data: Prisma.PageSectionUncheckedUpdateInput,
) {
  return prisma.pageSection.update({
    where: { id, churchId },
    data,
  })
}

export async function deletePageSection(churchId: string, id: string) {
  return prisma.pageSection.delete({
    where: { id, churchId },
  })
}

export async function reorderPageSections(
  churchId: string,
  pageId: string,
  sectionIds: string[],
) {
  const updates = sectionIds.map((id, index) =>
    prisma.pageSection.update({
      where: { id, churchId },
      data: { sortOrder: index },
    }),
  )
  return prisma.$transaction(updates)
}
