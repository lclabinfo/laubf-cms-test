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

/**
 * Ensure slug is unique within the church by appending a numeric suffix if needed.
 */
export async function ensureUniqueSlug(churchId: string, baseSlug: string, excludeId?: string): Promise<string> {
  let slug = baseSlug
  let counter = 1
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const existing = await prisma.message.findUnique({
      where: { churchId_slug: { churchId, slug } },
      select: { id: true },
    })
    if (!existing || (excludeId && existing.id === excludeId)) {
      return slug
    }
    counter++
    slug = `${baseSlug}-${counter}`
  }
}

/**
 * Fields that are NOT columns on the Message model and must be stripped
 * before passing data to Prisma create/update.
 */
const NON_MESSAGE_FIELDS = ['seriesId'] as const

function stripNonMessageFields<T extends Record<string, unknown>>(data: T): Omit<T, 'seriesId'> {
  const cleaned = { ...data }
  for (const key of NON_MESSAGE_FIELDS) {
    delete (cleaned as Record<string, unknown>)[key]
  }
  return cleaned
}

export async function createMessage(
  churchId: string,
  data: Record<string, unknown>,
  seriesId?: string | null,
) {
  // Strip non-Message fields before passing to Prisma
  const messageData = stripNonMessageFields(data)

  // Ensure dateFor is provided (required field)
  if (!messageData.dateFor) {
    messageData.dateFor = new Date().toISOString()
  }

  // Ensure slug uniqueness
  if (messageData.slug) {
    messageData.slug = await ensureUniqueSlug(churchId, messageData.slug as string)
  }

  const message = await prisma.message.create({
    data: { ...messageData, churchId } as Prisma.MessageUncheckedCreateInput,
    include: messageDetailInclude,
  })

  // Create MessageSeries join record if seriesId is provided
  if (seriesId) {
    await prisma.messageSeries.create({
      data: {
        messageId: message.id,
        seriesId,
        sortOrder: 0,
      },
    })
    // Re-fetch to include the series relation in the response
    return prisma.message.findUniqueOrThrow({
      where: { id: message.id },
      include: messageDetailInclude,
    })
  }

  return message
}

export async function updateMessage(
  churchId: string,
  id: string,
  data: Record<string, unknown>,
  seriesId?: string | null | undefined,
) {
  // Strip non-Message fields before passing to Prisma
  const messageData = stripNonMessageFields(data)

  // If slug is being updated, ensure uniqueness
  if (messageData.slug) {
    messageData.slug = await ensureUniqueSlug(churchId, messageData.slug as string, id)
  }

  const message = await prisma.message.update({
    where: { id, churchId },
    data: messageData as Prisma.MessageUncheckedUpdateInput,
    include: messageDetailInclude,
  })

  // Handle seriesId updates (undefined = no change, null = remove all, string = set series)
  if (seriesId !== undefined) {
    // Remove existing series associations
    await prisma.messageSeries.deleteMany({
      where: { messageId: id },
    })

    // Add new series association if provided
    if (seriesId) {
      await prisma.messageSeries.create({
        data: {
          messageId: id,
          seriesId,
          sortOrder: 0,
        },
      })
    }

    // Re-fetch to include updated series relation
    return prisma.message.findUniqueOrThrow({
      where: { id: message.id },
      include: messageDetailInclude,
    })
  }

  return message
}

export async function deleteMessage(churchId: string, id: string) {
  return prisma.message.update({
    where: { id, churchId },
    data: { deletedAt: new Date() },
  })
}
