import { prisma } from '@/lib/db'
import { ContentStatus, Prisma, type Video, type VideoCategory } from '@/lib/generated/prisma/client'
import { paginationArgs, paginatedResult, type PaginationParams, type PaginatedResult } from './types'

type VideoRecord = Video

export type VideoFilters = {
  category?: VideoCategory
  isShort?: boolean
  status?: ContentStatus
}

export async function getVideos(
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
  }

  const [data, total] = await Promise.all([
    prisma.video.findMany({
      where,
      orderBy: { datePublished: 'desc' },
      skip,
      take,
    }),
    prisma.video.count({ where }),
  ])

  return paginatedResult(data, total, page, pageSize)
}

export async function getVideoBySlug(
  churchId: string,
  slug: string,
): Promise<VideoRecord | null> {
  return prisma.video.findUnique({
    where: { churchId_slug: { churchId, slug } },
  })
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
