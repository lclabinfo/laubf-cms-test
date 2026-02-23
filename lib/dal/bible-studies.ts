import { prisma } from '@/lib/db'
import { ContentStatus, Prisma, type BibleBook } from '@/lib/generated/prisma/client'
import { paginationArgs, paginatedResult, type PaginationParams, type PaginatedResult } from './types'

type BibleStudyWithRelations = Prisma.BibleStudyGetPayload<{
  include: { speaker: true; series: true; attachments: true }
}>

const bibleStudyInclude = {
  speaker: true,
  series: true,
  attachments: { orderBy: { sortOrder: 'asc' as const } },
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
): Promise<PaginatedResult<BibleStudyWithRelations>> {
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
  return prisma.bibleStudy.findUnique({
    where: { churchId_slug: { churchId, slug } },
    include: bibleStudyInclude,
  })
}

export async function createBibleStudy(
  churchId: string,
  data: Omit<Prisma.BibleStudyUncheckedCreateInput, 'churchId'>,
) {
  return prisma.bibleStudy.create({
    data: { ...data, churchId },
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
    include: bibleStudyInclude,
  })
}

export async function deleteBibleStudy(churchId: string, id: string) {
  return prisma.bibleStudy.update({
    where: { id, churchId },
    data: { deletedAt: new Date() },
  })
}
