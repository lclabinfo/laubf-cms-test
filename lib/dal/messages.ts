import { prisma } from '@/lib/db'
import { ContentStatus, Prisma } from '@/lib/generated/prisma/client'
import { paginationArgs, paginatedResult, type PaginationParams, type PaginatedResult } from './types'

type MessageWithRelations = Prisma.MessageGetPayload<{
  include: { speaker: true; messageSeries: { include: { series: true } } }
}>

type MessageDetail = Prisma.MessageGetPayload<{
  include: {
    speaker: true
    messageSeries: { include: { series: true } }
    relatedStudy: true
  }
}>

const messageListInclude = {
  speaker: true,
  messageSeries: {
    include: { series: true },
    orderBy: { sortOrder: 'asc' as const },
  },
} satisfies Prisma.MessageInclude

const messageDetailInclude = {
  ...messageListInclude,
  relatedStudy: true,
} satisfies Prisma.MessageInclude

export type MessageFilters = {
  speakerId?: string
  seriesId?: string
  search?: string
  status?: ContentStatus | null // null = all statuses, undefined = default (PUBLISHED)
}

export async function getMessages(
  churchId: string,
  filters?: MessageFilters & PaginationParams,
): Promise<PaginatedResult<MessageWithRelations>> {
  const { skip, take, page, pageSize } = paginationArgs(filters)
  const status = filters?.status === null ? undefined : (filters?.status ?? ContentStatus.PUBLISHED)

  const where: Prisma.MessageWhereInput = {
    churchId,
    deletedAt: null,
    ...(status !== undefined && { status }),
    ...(filters?.speakerId && { speakerId: filters.speakerId }),
    ...(filters?.seriesId && {
      messageSeries: { some: { seriesId: filters.seriesId } },
    }),
    ...(filters?.search && {
      OR: [
        { title: { contains: filters.search, mode: 'insensitive' as const } },
        { passage: { contains: filters.search, mode: 'insensitive' as const } },
        { description: { contains: filters.search, mode: 'insensitive' as const } },
      ],
    }),
  }

  const [data, total] = await Promise.all([
    prisma.message.findMany({
      where,
      include: messageListInclude,
      orderBy: { dateFor: 'desc' },
      skip,
      take,
    }),
    prisma.message.count({ where }),
  ])

  return paginatedResult(data, total, page, pageSize)
}

export async function getMessageBySlug(
  churchId: string,
  slug: string,
): Promise<MessageDetail | null> {
  return prisma.message.findUnique({
    where: { churchId_slug: { churchId, slug } },
    include: messageDetailInclude,
  })
}

export async function getLatestMessage(
  churchId: string,
): Promise<MessageWithRelations | null> {
  return prisma.message.findFirst({
    where: { churchId, deletedAt: null, status: ContentStatus.PUBLISHED },
    include: messageListInclude,
    orderBy: { dateFor: 'desc' },
  })
}

export async function createMessage(
  churchId: string,
  data: Omit<Prisma.MessageUncheckedCreateInput, 'churchId'>,
) {
  return prisma.message.create({
    data: { ...data, churchId },
    include: messageDetailInclude,
  })
}

export async function updateMessage(
  churchId: string,
  id: string,
  data: Prisma.MessageUncheckedUpdateInput,
) {
  return prisma.message.update({
    where: { id, churchId },
    data,
    include: messageDetailInclude,
  })
}

export async function deleteMessage(churchId: string, id: string) {
  return prisma.message.update({
    where: { id, churchId },
    data: { deletedAt: new Date() },
  })
}
