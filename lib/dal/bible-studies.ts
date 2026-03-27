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
  speakerId?: string
  status?: ContentStatus
}

export async function getBibleStudies(
  churchId: string,
  filters?: BibleStudyFilters & PaginationParams,
): Promise<PaginatedResult<BibleStudyListItem>> {
  const { skip, take, page, pageSize } = paginationArgs(filters)
  const status = filters?.status ?? ContentStatus.PUBLISHED

  const where: Prisma.BibleStudyWhereInput = {
    churchId,
    deletedAt: null,
    status,
    ...(filters?.book && { book: filters.book }),
    ...(filters?.seriesId && { seriesId: filters.seriesId }),
    ...(filters?.speakerId && { speakerId: filters.speakerId }),
  }

  const [data, total] = await Promise.all([
    prisma.bibleStudy.findMany({
      where,
      omit: bibleStudyListOmit,
      include: bibleStudyInclude,
      orderBy: { dateFor: 'desc' },
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
