import { prisma } from '@/lib/db'
import { ContentStatus, Prisma, type Video, type VideoCategory } from '@/lib/generated/prisma/client'
import { unstable_cache } from 'next/cache'
import { paginationArgs, paginatedResult, type PaginationParams, type PaginatedResult } from './types'

type VideoRecord = Video

export type VideoFilters = {
  category?: VideoCategory
  isShort?: boolean
  status?: ContentStatus
  search?: string
  dateFrom?: string  // YYYY-MM-DD
  dateTo?: string    // YYYY-MM-DD
  sortBy?: 'datePublished' | 'title'
  sortDir?: 'asc' | 'desc'
}

export type VideoFilterMeta = {
  categories: string[]
}

/**
 * Lightweight query to get all available filter options for published videos.
 */
async function _getVideoFilterMeta(churchId: string): Promise<VideoFilterMeta> {
  const rows = await prisma.video.findMany({
    where: { churchId, deletedAt: null, status: ContentStatus.PUBLISHED, category: { not: undefined } },
    select: { category: true },
    distinct: ['category'],
  })
  return {
    categories: rows.map((r) => String(r.category)).filter(Boolean).sort(),
  }
}

export function getVideoFilterMeta(churchId: string): Promise<VideoFilterMeta> {
  return unstable_cache(
    () => _getVideoFilterMeta(churchId),
    ['video-filter-meta', churchId],
    { revalidate: 3600, tags: [`church:${churchId}:videos`] }
  )()
}

async function _getVideos(
  churchId: string,
  filters?: VideoFilters & PaginationParams,
): Promise<PaginatedResult<VideoRecord>> {
  const { skip, take, page, pageSize } = paginationArgs(filters)
  const status = filters?.status ?? ContentStatus.PUBLISHED

  const where: Prisma.VideoWhereInput = {
    churchId,
    deletedAt: null,
    status,
    ...(filters?.category && { category: filters.category }),
    ...(filters?.isShort !== undefined && { isShort: filters.isShort }),
    ...(filters?.search && {
      OR: [
        { title: { contains: filters.search, mode: 'insensitive' as const } },
        { description: { contains: filters.search, mode: 'insensitive' as const } },
      ],
    }),
    ...((filters?.dateFrom || filters?.dateTo) && {
      datePublished: {
        ...(filters?.dateFrom && { gte: new Date(filters.dateFrom) }),
        ...(filters?.dateTo && { lte: new Date(filters.dateTo + 'T23:59:59') }),
      },
    }),
  }

  const sortBy = filters?.sortBy ?? 'datePublished'
  const sortDir = filters?.sortDir ?? 'desc'
  const orderBy: Prisma.VideoOrderByWithRelationInput = { [sortBy]: sortDir }

  const [data, total] = await Promise.all([
    prisma.video.findMany({
      where,
      orderBy,
      skip,
      take,
    }),
    prisma.video.count({ where }),
  ])

  return paginatedResult(data, total, page, pageSize)
}

export function getVideos(
  churchId: string,
  filters?: VideoFilters & PaginationParams,
): Promise<PaginatedResult<VideoRecord>> {
  return unstable_cache(
    () => _getVideos(churchId, filters),
    ['videos', churchId, JSON.stringify(filters ?? {})],
    { revalidate: 300, tags: [`church:${churchId}:videos`] }
  )()
}

async function _getVideoBySlug(
  churchId: string,
  slug: string,
): Promise<VideoRecord | null> {
  return prisma.video.findFirst({
    where: { churchId, slug, deletedAt: null, status: ContentStatus.PUBLISHED },
  })
}

export function getVideoBySlug(
  churchId: string,
  slug: string,
): Promise<VideoRecord | null> {
  return unstable_cache(
    () => _getVideoBySlug(churchId, slug),
    ['video-by-slug', churchId, slug],
    { revalidate: 3600, tags: [`church:${churchId}:videos`] }
  )()
}

export async function createVideo(
  churchId: string,
  data: Omit<Prisma.VideoUncheckedCreateInput, 'churchId'>,
) {
  return prisma.video.create({
    data: { ...data, churchId },
  })
}

export async function updateVideo(
  churchId: string,
  id: string,
  data: Prisma.VideoUncheckedUpdateInput,
) {
  return prisma.video.update({
    where: { id, churchId },
    data,
  })
}

export async function deleteVideo(churchId: string, id: string) {
  return prisma.video.update({
    where: { id, churchId },
    data: { deletedAt: new Date() },
  })
}
