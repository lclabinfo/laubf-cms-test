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
    take: 100,
  })
}

export async function createPage(
  churchId: string,
  data: Omit<Prisma.PageUncheckedCreateInput, 'churchId'>,
) {
  // When creating a new homepage, unset any existing homepage first.
  if (data.isHomepage === true) {
    const [, created] = await prisma.$transaction([
      prisma.page.updateMany({
        where: { churchId, isHomepage: true },
        data: { isHomepage: false },
      }),
      prisma.page.create({
        data: { ...data, churchId },
        include: { sections: { orderBy: { sortOrder: 'asc' } } },
      }),
    ])
    return created
  }

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
  // When setting a page as homepage, use a transaction to ensure only one
  // page is the homepage at a time for this church.
  if (data.isHomepage === true) {
    const [, updated] = await prisma.$transaction([
      prisma.page.updateMany({
        where: { churchId, isHomepage: true, id: { not: id } },
        data: { isHomepage: false },
      }),
      prisma.page.update({
        where: { id, churchId },
        data,
        include: { sections: { orderBy: { sortOrder: 'asc' } } },
      }),
    ])
    return updated
  }

  return prisma.page.update({
    where: { id, churchId },
    data,
    include: { sections: { orderBy: { sortOrder: 'asc' } } },
  })
}

export async function deletePage(churchId: string, id: string) {
  // Hard delete — removes the page and all its sections (cascade)
  return prisma.page.delete({
    where: { id, churchId },
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

/**
 * Resolve a page by slug-or-id for admin endpoints.
 * If the value looks like a UUID, tries by ID first, then falls back to slug.
 * Otherwise tries by slug, then falls back to ID.
 * This supports the builder which may pass a page ID for pages with empty slugs (e.g., homepage).
 */
export async function getPageBySlugOrId(
  churchId: string,
  slugOrId: string,
): Promise<PageWithSections | null> {
  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(slugOrId)

  if (isUuid) {
    // Try by ID first, then by slug
    const byId = await getPageById(churchId, slugOrId)
    if (byId) return byId
    return getPageForAdmin(churchId, slugOrId)
  }

  // Try by slug first, then by ID
  const bySlug = await getPageForAdmin(churchId, slugOrId)
  if (bySlug) return bySlug
  return getPageById(churchId, slugOrId)
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
  // Use an interactive transaction so the read + writes are atomic,
  // preventing TOCTOU races when two users reorder simultaneously.
  return prisma.$transaction(async (tx) => {
    const dbSections = await tx.pageSection.findMany({
      where: { pageId, churchId },
      select: { id: true, sortOrder: true },
      orderBy: { sortOrder: 'asc' },
    })
    const dbIdSet = new Set(dbSections.map((s) => s.id))

    // 1. Keep only IDs that still exist in the DB (ignore stale/deleted ones)
    const validClientIds = sectionIds.filter((id) => dbIdSet.has(id))

    // 2. Append any DB sections the client didn't know about (added by another
    //    user), preserving their existing relative order.
    const clientIdSet = new Set(validClientIds)
    const missingIds = dbSections
      .filter((s) => !clientIdSet.has(s.id))
      .map((s) => s.id)

    const finalOrder = [...validClientIds, ...missingIds]

    await Promise.all(
      finalOrder.map((id, index) =>
        tx.pageSection.update({
          where: { id, churchId },
          data: { sortOrder: index },
        }),
      ),
    )
  })
}
