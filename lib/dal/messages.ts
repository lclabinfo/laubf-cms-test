import { prisma } from '@/lib/db'
import { Prisma } from '@/lib/generated/prisma/client'
import { paginationArgs, paginatedResult, type PaginationParams, type PaginatedResult } from './types'

/** Omit heavy text/JSON fields from list queries — these are only needed on detail/edit views */
const messageListOmit = {
  rawTranscript: true as const,
  liveTranscript: true as const,
  transcriptSegments: true as const,
  studySections: true as const,
}

/** Override global omit to include all fields in detail/write queries */
const messageDetailOmit = {
  rawTranscript: false as const,
  liveTranscript: false as const,
  transcriptSegments: false as const,
  studySections: false as const,
}

// All views only use speaker name fields — avoid loading full Person record
const speakerSelect = {
  select: {
    id: true,
    firstName: true,
    lastName: true,
    preferredName: true,
  },
} as const

// Lightweight include for list views — no relatedStudy to avoid loading heavy text columns
const messageListInclude = {
  speaker: speakerSelect,
  messageSeries: {
    include: { series: true },
    orderBy: { sortOrder: 'asc' as const },
  },
  relatedStudy: {
    select: {
      _count: { select: { attachments: true } },
    },
  },
} satisfies Prisma.MessageInclude

type MessageWithRelations = Prisma.MessageGetPayload<{
  omit: typeof messageListOmit
  include: typeof messageListInclude
}>

const messageDetailInclude = {
  speaker: speakerSelect,
  messageSeries: {
    include: { series: true },
    orderBy: { sortOrder: 'asc' as const },
  },
  relatedStudy: {
    // Override global omit: the CMS study tab needs questions & answers
    // to synthesize studySections for legacy migrated entries.
    omit: {
      questions: false,
      answers: false,
    },
    include: {
      attachments: { orderBy: { sortOrder: 'asc' as const } },
    },
  },
} satisfies Prisma.MessageInclude

type MessageDetail = Prisma.MessageGetPayload<{
  include: typeof messageDetailInclude
}>

export type MessageFilters = {
  speakerId?: string
  seriesId?: string
  search?: string
  /** When true, only return messages with at least one published resource */
  publishedOnly?: boolean
  /** When true, only return messages where video is published */
  videoPublished?: boolean
  /** ISO date string (YYYY-MM-DD) — filter messages on or after this date */
  dateFrom?: string
  /** ISO date string (YYYY-MM-DD) — filter messages on or before this date */
  dateTo?: string
  /** Column to sort by (default: dateFor) */
  sortBy?: 'dateFor' | 'title' | 'speaker'
  /** Sort direction (default: desc) */
  sortDir?: 'asc' | 'desc'
  /** Filter by archive status: 'all' (default), 'active', 'archived' */
  archiveFilter?: 'all' | 'active' | 'archived'
}

export type MessageFilterMeta = {
  years: number[]
  series: { name: string; count: number }[]
  speakers: { name: string; count: number }[]
}

/**
 * Lightweight query to get all available filter options for video messages.
 * Returns years, series (with counts), and speakers (with counts) so the client
 * can render complete filter dropdowns on first render.
 */
export async function getMessageFilterMeta(churchId: string): Promise<MessageFilterMeta> {
  const where: Prisma.MessageWhereInput = {
    churchId,
    deletedAt: null,
    hasVideo: true,
  }

  const [yearRows, seriesRows, speakerRows] = await Promise.all([
    // Distinct years
    prisma.message.findMany({
      where,
      select: { dateFor: true },
      distinct: ['dateFor'],
    }).then((rows) => {
      const years = new Set<number>()
      for (const r of rows) {
        if (r.dateFor) years.add(new Date(r.dateFor).getFullYear())
      }
      return Array.from(years).sort((a, b) => b - a)
    }),
    // Series with counts
    prisma.message.findMany({
      where: { ...where, messageSeries: { some: {} } },
      select: { messageSeries: { include: { series: { select: { name: true } } } } },
    }).then((rows) => {
      const seriesMap = new Map<string, number>()
      for (const m of rows) {
        for (const ms of m.messageSeries) {
          const name = ms.series.name
          seriesMap.set(name, (seriesMap.get(name) ?? 0) + 1)
        }
      }
      return Array.from(seriesMap.entries())
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count)
    }),
    // Speakers with counts
    prisma.message.groupBy({
      by: ['speakerId'],
      where: { ...where, speakerId: { not: null } },
      _count: { _all: true },
    }).then(async (groups) => {
      if (groups.length === 0) return [] as { name: string; count: number }[]
      const speakerIds = groups.map((g) => g.speakerId!).filter(Boolean)
      const speakers = await prisma.person.findMany({
        where: { id: { in: speakerIds } },
        select: { id: true, firstName: true, lastName: true, preferredName: true },
      })
      const nameMap = new Map(speakers.map((s) => [
        s.id,
        s.preferredName ? `${s.preferredName} ${s.lastName}` : `${s.firstName} ${s.lastName}`,
      ]))
      return groups
        .map((g) => ({ name: nameMap.get(g.speakerId!) || '', count: g._count._all }))
        .filter((s) => s.name)
        .sort((a, b) => b.count - a.count)
    }),
  ])

  return { years: yearRows, series: seriesRows, speakers: speakerRows }
}

export async function getMessages(
  churchId: string,
  filters?: MessageFilters & PaginationParams,
): Promise<PaginatedResult<MessageWithRelations>> {
  const { skip, take, page, pageSize } = paginationArgs(filters)

  const archiveFilter = filters?.archiveFilter ?? 'all'
  const where: Prisma.MessageWhereInput = {
    churchId,
    deletedAt: null,
    ...(archiveFilter === 'active' && { archivedAt: null }),
    ...(archiveFilter === 'archived' && { archivedAt: { not: null } }),
    ...(filters?.videoPublished && { hasVideo: true }),
    ...(filters?.publishedOnly && !filters?.videoPublished && { OR: [{ hasVideo: true }, { hasStudy: true }] }),
    ...(filters?.speakerId && { speakerId: filters.speakerId }),
    ...(filters?.seriesId && {
      messageSeries: { some: { seriesId: filters.seriesId } },
    }),
    ...(filters?.search && {
      OR: [
        { title: { contains: filters.search, mode: 'insensitive' as const } },
        { videoTitle: { contains: filters.search, mode: 'insensitive' as const } },
        { passage: { contains: filters.search, mode: 'insensitive' as const } },
        { speaker: { firstName: { contains: filters.search, mode: 'insensitive' as const } } },
        { speaker: { lastName: { contains: filters.search, mode: 'insensitive' as const } } },
        { speaker: { preferredName: { contains: filters.search, mode: 'insensitive' as const } } },
        { videoDescription: { contains: filters.search, mode: 'insensitive' as const } },
      ],
    }),
    ...(filters?.dateFrom && { dateFor: { gte: new Date(filters.dateFrom + 'T00:00:00') } }),
    ...(filters?.dateTo && {
      dateFor: {
        ...(filters?.dateFrom ? { gte: new Date(filters.dateFrom + 'T00:00:00') } : {}),
        lte: new Date(filters.dateTo + 'T23:59:59'),
      },
    }),
  }

  // Build orderBy from sort params
  const sortBy = filters?.sortBy ?? 'dateFor'
  const sortDir = filters?.sortDir ?? 'desc'
  const orderBy: Prisma.MessageOrderByWithRelationInput =
    sortBy === 'speaker'
      ? { speaker: { lastName: sortDir } }
      : { [sortBy]: sortDir }

  const [data, total] = await Promise.all([
    prisma.message.findMany({
      where,
      omit: messageListOmit,
      include: messageListInclude,
      orderBy,
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
    omit: messageDetailOmit,
    include: messageDetailInclude,
  })
}

export async function getMessageById(
  churchId: string,
  id: string,
): Promise<MessageDetail | null> {
  return prisma.message.findFirst({
    where: { id, churchId, deletedAt: null },
    omit: messageDetailOmit,
    include: messageDetailInclude,
  })
}

export async function getLatestMessage(
  churchId: string,
): Promise<MessageWithRelations | null> {
  const today = new Date()
  today.setHours(23, 59, 59, 999)

  // Prefer the most recent message with a video (for spotlight player)
  const withVideo = await prisma.message.findFirst({
    where: {
      churchId,
      deletedAt: null,
      archivedAt: null,
      hasVideo: true,
      dateFor: { lte: today },
    },
    omit: messageListOmit,
    include: messageListInclude,
    orderBy: { dateFor: 'desc' },
  })

  if (withVideo) return withVideo

  // Fall back to any message with study material
  return prisma.message.findFirst({
    where: {
      churchId,
      deletedAt: null,
      archivedAt: null,
      hasStudy: true,
      dateFor: { lte: today },
    },
    omit: messageListOmit,
    include: messageListInclude,
    orderBy: { dateFor: 'desc' },
  })
}

export async function getLatestPublishedDates(churchId: string): Promise<{
  latestVideo: Date | null
  latestStudy: Date | null
}> {
  const [latestVideo, latestStudy] = await Promise.all([
    prisma.message.findFirst({
      where: { churchId, deletedAt: null, hasVideo: true },
      orderBy: { dateFor: 'desc' },
      select: { dateFor: true },
    }),
    prisma.message.findFirst({
      where: { churchId, deletedAt: null, hasStudy: true },
      orderBy: { dateFor: 'desc' },
      select: { dateFor: true },
    }),
  ])
  return {
    latestVideo: latestVideo?.dateFor ?? null,
    latestStudy: latestStudy?.dateFor ?? null,
  }
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
  'attachments', // attachments now live in BibleStudyAttachment table, not JSON column
] as const

function stripNonMessageFields<T extends Record<string, unknown>>(data: T): Omit<T, 'seriesId' | 'description' | 'attachments'> {
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
    omit: messageDetailOmit,
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
      omit: messageDetailOmit,
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
    omit: messageDetailOmit,
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
      omit: messageDetailOmit,
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

export async function archiveMessage(churchId: string, id: string) {
  return prisma.message.update({
    where: { id, churchId },
    data: {
      archivedAt: new Date(),
      hasVideo: false,
      hasStudy: false,
    },
    omit: messageDetailOmit,
    include: messageDetailInclude,
  })
}

export async function unarchiveMessage(churchId: string, id: string) {
  return prisma.message.update({
    where: { id, churchId },
    data: { archivedAt: null },
    omit: messageDetailOmit,
    include: messageDetailInclude,
  })
}

export async function bulkDeleteMessages(churchId: string, ids: string[]) {
  return prisma.message.updateMany({
    where: { id: { in: ids }, churchId, deletedAt: null },
    data: { deletedAt: new Date() },
  })
}

export async function bulkArchiveMessages(churchId: string, ids: string[]) {
  return prisma.message.updateMany({
    where: { id: { in: ids }, churchId, deletedAt: null },
    data: {
      archivedAt: new Date(),
      hasVideo: false,
      hasStudy: false,
    },
  })
}

export async function bulkUnarchiveMessages(churchId: string, ids: string[]) {
  return prisma.message.updateMany({
    where: { id: { in: ids }, churchId, deletedAt: null },
    data: { archivedAt: null },
  })
}
