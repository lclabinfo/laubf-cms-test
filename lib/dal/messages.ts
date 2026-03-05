import { prisma } from '@/lib/db'
import { Prisma } from '@/lib/generated/prisma/client'
import { paginationArgs, paginatedResult, type PaginationParams, type PaginatedResult } from './types'

type MessageWithRelations = Prisma.MessageGetPayload<{
  include: { speaker: true; messageSeries: { include: { series: true } }; relatedStudy: true }
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
  relatedStudy: true,
} satisfies Prisma.MessageInclude

const messageDetailInclude = {
  ...messageListInclude,
  relatedStudy: true,
} satisfies Prisma.MessageInclude

export type MessageFilters = {
  speakerId?: string
  seriesId?: string
  search?: string
  /** When true, only return messages with at least one published resource */
  publishedOnly?: boolean
  /** When true, only return messages where video is published */
  videoPublished?: boolean
}

export async function getMessages(
  churchId: string,
  filters?: MessageFilters & PaginationParams,
): Promise<PaginatedResult<MessageWithRelations>> {
  const { skip, take, page, pageSize } = paginationArgs(filters)

  const where: Prisma.MessageWhereInput = {
    churchId,
    deletedAt: null,
    ...(filters?.videoPublished && { hasVideo: true }),
    ...(filters?.publishedOnly && !filters?.videoPublished && { OR: [{ hasVideo: true }, { hasStudy: true }] }),
    ...(filters?.speakerId && { speakerId: filters.speakerId }),
    ...(filters?.seriesId && {
      messageSeries: { some: { seriesId: filters.seriesId } },
    }),
    ...(filters?.search && {
      OR: [
        { title: { contains: filters.search, mode: 'insensitive' as const } },
        { passage: { contains: filters.search, mode: 'insensitive' as const } },
        { speaker: { name: { contains: filters.search, mode: 'insensitive' as const } } },
        { videoDescription: { contains: filters.search, mode: 'insensitive' as const } },
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
  { publishedOnly = true }: { publishedOnly?: boolean } = {},
): Promise<MessageDetail | null> {
  return prisma.message.findFirst({
    where: {
      churchId,
      slug,
      deletedAt: null,
      ...(publishedOnly ? { hasVideo: true } : {}),
    },
    include: messageDetailInclude,
  })
}

export async function getLatestMessage(
  churchId: string,
): Promise<MessageWithRelations | null> {
  return prisma.message.findFirst({
    where: { churchId, deletedAt: null, hasVideo: true },
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
const NON_MESSAGE_FIELDS = [
  'seriesId',
  'description', // removed from schema — strip for safety
] as const

function stripNonMessageFields<T extends Record<string, unknown>>(data: T): Omit<T, 'seriesId' | 'description'> {
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

  // Enforce: hasVideo requires a videoUrl or youtubeId
  if (messageData.hasVideo && !messageData.videoUrl && !messageData.youtubeId) {
    messageData.hasVideo = false
  }

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

  // Enforce: hasVideo requires a videoUrl or youtubeId
  if (messageData.hasVideo && !messageData.videoUrl && !messageData.youtubeId) {
    // Check existing record if video fields not in update payload
    if (messageData.videoUrl === undefined || messageData.youtubeId === undefined) {
      const existing = await prisma.message.findUnique({
        where: { id, churchId },
        select: { videoUrl: true, youtubeId: true },
      })
      if (!existing?.videoUrl && !existing?.youtubeId) {
        messageData.hasVideo = false
      }
    } else {
      messageData.hasVideo = false
    }
  }

  // If slug is being updated, ensure uniqueness; drop empty slugs to avoid constraint violations
  if (messageData.slug && typeof messageData.slug === 'string' && messageData.slug.trim()) {
    messageData.slug = await ensureUniqueSlug(churchId, messageData.slug as string, id)
  } else if (messageData.slug === '') {
    delete (messageData as Record<string, unknown>).slug
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
