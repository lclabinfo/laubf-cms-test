import { prisma } from '@/lib/db'
import { ContentStatus, Prisma, type BibleBook } from '@/lib/generated/prisma/client'
import { paginationArgs, paginatedResult, type PaginationParams, type PaginatedResult } from './types'
import { deleteAllStudyAttachments } from '@/lib/upload-attachment'

type BibleStudyWithRelations = Prisma.BibleStudyGetPayload<{
  include: { speaker: true; series: true; attachments: true; relatedMessage: { select: { bibleVersion: true; slug: true; videoUrl: true; youtubeId: true } } }
}>

/** Omit heavy text fields from list queries to avoid loading ~80 MB of TOAST data */
const bibleStudyListOmit = {
  questions: true as const,
  answers: true as const,
  transcript: true as const,
  bibleText: true as const,
  keyVerseText: true as const,
}

/** Override global omit to include all fields in detail/write queries */
const bibleStudyDetailOmit = {
  questions: false as const,
  answers: false as const,
  transcript: false as const,
  bibleText: false as const,
  keyVerseText: false as const,
}

type BibleStudyListItem = Prisma.BibleStudyGetPayload<{
  omit: typeof bibleStudyListOmit
  include: { speaker: true; series: true; attachments: { take: 20 }; relatedMessage: { select: { bibleVersion: true; slug: true; videoUrl: true; youtubeId: true } } }
}>

const bibleStudyInclude = {
  speaker: true,
  series: true,
  attachments: { orderBy: { sortOrder: 'asc' as const }, take: 20 },
  relatedMessage: { select: { bibleVersion: true, slug: true, videoUrl: true, youtubeId: true } },
} satisfies Prisma.BibleStudyInclude

export type BibleStudyFilters = {
  book?: BibleBook
  seriesId?: string
  seriesName?: string
  speakerId?: string
  status?: ContentStatus
  dateFrom?: string  // YYYY-MM-DD
  dateTo?: string    // YYYY-MM-DD
  search?: string
  /** Column to sort by (default: dateFor) */
  sortBy?: 'dateFor' | 'title'
  /** Sort direction (default: desc) */
  sortDir?: 'asc' | 'desc'
}

export type BibleStudyFilterMeta = {
  years: number[]
  series: { id: string; name: string; count: number }[]
  books: { book: string; count: number }[]
}

/**
 * Lightweight query to get all available filter options for published bible studies.
 * Returns years, series (with counts), and books (with counts) so the client
 * can render complete filter dropdowns on first render without waiting for
 * all pages to load.
 */
export async function getBibleStudyFilterMeta(churchId: string): Promise<BibleStudyFilterMeta> {
  const where: Prisma.BibleStudyWhereInput = {
    churchId,
    deletedAt: null,
    status: ContentStatus.PUBLISHED,
  }

  const [yearRows, seriesRows, bookRows] = await Promise.all([
    // Distinct years
    prisma.bibleStudy.findMany({
      where,
      select: { dateFor: true },
      distinct: ['dateFor'],
    }).then((rows) => {
      const years = new Set<number>()
      for (const r of rows) {
        if (r.dateFor) years.add(new Date(r.dateFor).getUTCFullYear())
      }
      return Array.from(years).sort((a, b) => b - a)
    }),
    // Series with counts
    prisma.bibleStudy.groupBy({
      by: ['seriesId'],
      where: { ...where, seriesId: { not: null } },
      _count: { _all: true },
    }).then(async (groups) => {
      if (groups.length === 0) return [] as { id: string; name: string; count: number }[]
      const seriesIds = groups.map((g) => g.seriesId!).filter(Boolean)
      const seriesRecords = await prisma.series.findMany({
        where: { id: { in: seriesIds } },
        select: { id: true, name: true },
      })
      const nameMap = new Map(seriesRecords.map((s) => [s.id, s.name]))
      return groups
        .map((g) => ({ id: g.seriesId!, name: nameMap.get(g.seriesId!) || '', count: g._count._all }))
        .filter((s) => s.name)
        .sort((a, b) => b.count - a.count)
    }),
    // Books with counts
    prisma.bibleStudy.groupBy({
      by: ['book'],
      where: { ...where, book: { not: undefined } },
      _count: { _all: true },
    }).then((groups) =>
      groups
        .map((g) => ({ book: String(g.book!), count: g._count._all }))
        .sort((a, b) => b.count - a.count)
    ),
  ])

  return { years: yearRows, series: seriesRows, books: bookRows }
}

export async function getBibleStudies(
  churchId: string,
  filters?: BibleStudyFilters & PaginationParams,
): Promise<PaginatedResult<BibleStudyListItem>> {
  const { skip, take, page, pageSize } = paginationArgs(filters)
  const status = filters?.status ?? ContentStatus.PUBLISHED

  // Resolve seriesName to seriesId if provided
  let resolvedSeriesId = filters?.seriesId
  if (!resolvedSeriesId && filters?.seriesName) {
    const series = await prisma.series.findFirst({
      where: { churchId, name: filters.seriesName, deletedAt: null },
      select: { id: true },
    })
    if (series) resolvedSeriesId = series.id
    else resolvedSeriesId = 'NO_MATCH' // Force empty results for unknown series name
  }

  const where: Prisma.BibleStudyWhereInput = {
    churchId,
    deletedAt: null,
    status,
    ...(filters?.book && { book: filters.book }),
    ...(resolvedSeriesId && { seriesId: resolvedSeriesId }),
    ...(filters?.speakerId && { speakerId: filters.speakerId }),
    ...((filters?.dateFrom || filters?.dateTo) && {
      dateFor: {
        ...(filters?.dateFrom && { gte: new Date(filters.dateFrom) }),
        ...(filters?.dateTo && { lte: new Date(filters.dateTo) }),
      },
    }),
    ...(filters?.search && {
      OR: [
        { title: { contains: filters.search, mode: 'insensitive' as const } },
        { passage: { contains: filters.search, mode: 'insensitive' as const } },
      ],
    }),
  }

  // Determine sort order
  const sortBy = filters?.sortBy ?? 'dateFor'
  const sortDir = filters?.sortDir ?? 'desc'
  const orderBy: Prisma.BibleStudyOrderByWithRelationInput = { [sortBy]: sortDir }

  const [data, total] = await Promise.all([
    prisma.bibleStudy.findMany({
      where,
      omit: bibleStudyListOmit,
      include: bibleStudyInclude,
      orderBy,
      skip,
      take,
    }),
    prisma.bibleStudy.count({ where }),
  ])

  return paginatedResult(data, total, page, pageSize)
}

export async function getBibleStudyBySlug(
  churchId: string,
  slug: string,
): Promise<BibleStudyWithRelations | null> {
  return prisma.bibleStudy.findFirst({
    where: { churchId, slug, deletedAt: null, status: ContentStatus.PUBLISHED },
    omit: bibleStudyDetailOmit,
    include: bibleStudyInclude,
  })
}

export async function createBibleStudy(
  churchId: string,
  data: Omit<Prisma.BibleStudyUncheckedCreateInput, 'churchId'>,
) {
  return prisma.bibleStudy.create({
    data: { ...data, churchId },
    omit: bibleStudyDetailOmit,
    include: bibleStudyInclude,
  })
}

export async function updateBibleStudy(
  churchId: string,
  id: string,
  data: Prisma.BibleStudyUncheckedUpdateInput,
) {
  return prisma.bibleStudy.update({
    where: { id, churchId },
    data,
    omit: bibleStudyDetailOmit,
    include: bibleStudyInclude,
  })
}

export async function deleteBibleStudy(churchId: string, id: string) {
  // Hard-delete all attachment R2 files + DB records before soft-deleting the study
  try {
    const result = await deleteAllStudyAttachments(id)
    if (result.deleted > 0) {
      console.log(`[deleteBibleStudy] Cleaned up ${result.deleted} attachments (${result.r2Errors} R2 errors)`)
    }
  } catch (err) {
    console.error('[deleteBibleStudy] Attachment cleanup warning:', err)
  }

  return prisma.bibleStudy.update({
    where: { id, churchId },
    data: { deletedAt: new Date() },
  })
}
