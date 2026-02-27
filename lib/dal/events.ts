import { prisma } from '@/lib/db'
import { ContentStatus, Prisma, type EventType } from '@/lib/generated/prisma/client'
import { paginationArgs, paginatedResult, type PaginationParams, type PaginatedResult } from './types'

type EventWithRelations = Prisma.EventGetPayload<{
  include: { ministry: true; campus: true }
}>

type EventDetail = Prisma.EventGetPayload<{
  include: { ministry: true; campus: true; eventLinks: true }
}>

/** Shape returned when tags are included */
type ContentTagWithTag = { id: string; tag: { id: string; name: string; slug: string; color: string | null } }

const eventListInclude = {
  ministry: true,
  campus: true,
} satisfies Prisma.EventInclude

const eventDetailInclude = {
  ...eventListInclude,
  eventLinks: { orderBy: { sortOrder: 'asc' as const } },
} satisfies Prisma.EventInclude

export type EventFilters = {
  type?: EventType
  ministryId?: string
  campusId?: string
  isFeatured?: boolean
  isRecurring?: boolean
  dateFrom?: Date
  dateTo?: Date
  status?: ContentStatus | null // null = all statuses, undefined = default (PUBLISHED)
}

export async function getEvents(
  churchId: string,
  filters?: EventFilters & PaginationParams,
): Promise<PaginatedResult<EventWithRelations>> {
  const { skip, take, page, pageSize } = paginationArgs(filters)
  const status = filters?.status === null ? undefined : (filters?.status ?? ContentStatus.PUBLISHED)

  const where: Prisma.EventWhereInput = {
    churchId,
    deletedAt: null,
    ...(status !== undefined && { status }),
    ...(filters?.type && { type: filters.type }),
    ...(filters?.ministryId && { ministryId: filters.ministryId }),
    ...(filters?.campusId && { campusId: filters.campusId }),
    ...(filters?.isFeatured !== undefined && { isFeatured: filters.isFeatured }),
    ...(filters?.isRecurring !== undefined && { isRecurring: filters.isRecurring }),
    ...(filters?.dateFrom || filters?.dateTo
      ? {
          dateStart: {
            ...(filters?.dateFrom && { gte: filters.dateFrom }),
            ...(filters?.dateTo && { lte: filters.dateTo }),
          },
        }
      : {}),
  }

  const [data, total] = await Promise.all([
    prisma.event.findMany({
      where,
      include: eventListInclude,
      orderBy: { dateStart: 'asc' },
      skip,
      take,
    }),
    prisma.event.count({ where }),
  ])

  // Enrich each event with its tags from the ContentTag join table
  const eventIds = data.map(e => e.id)
  const allContentTags = eventIds.length > 0
    ? await prisma.contentTag.findMany({
        where: { entityType: 'EVENT', entityId: { in: eventIds } },
        include: { tag: true },
      })
    : []

  const tagsByEventId = new Map<string, ContentTagWithTag[]>()
  for (const ct of allContentTags) {
    const existing = tagsByEventId.get(ct.entityId) ?? []
    existing.push(ct)
    tagsByEventId.set(ct.entityId, existing)
  }

  const enriched = data.map(e => ({
    ...e,
    tags: tagsByEventId.get(e.id) ?? [],
  }))

  return paginatedResult(enriched, total, page, pageSize)
}

export async function getEventBySlug(
  churchId: string,
  slug: string,
): Promise<(EventDetail & { tags: ContentTagWithTag[] }) | null> {
  const event = await prisma.event.findUnique({
    where: { churchId_slug: { churchId, slug } },
    include: eventDetailInclude,
  })
  if (!event) return null

  const tags = await getEventTags(event.id)
  return { ...event, tags }
}

export async function getUpcomingEvents(
  churchId: string,
  limit = 10,
): Promise<EventWithRelations[]> {
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  return prisma.event.findMany({
    where: {
      churchId,
      deletedAt: null,
      status: ContentStatus.PUBLISHED,
      dateStart: { gte: today },
    },
    include: eventListInclude,
    orderBy: { dateStart: 'asc' },
    take: limit,
  })
}

export async function getRecurringEvents(
  churchId: string,
): Promise<EventWithRelations[]> {
  return prisma.event.findMany({
    where: {
      churchId,
      deletedAt: null,
      status: ContentStatus.PUBLISHED,
      isRecurring: true,
    },
    include: eventListInclude,
    orderBy: { dateStart: 'asc' },
  })
}

export async function getFeaturedEvents(
  churchId: string,
  limit = 5,
): Promise<EventWithRelations[]> {
  return prisma.event.findMany({
    where: {
      churchId,
      deletedAt: null,
      status: ContentStatus.PUBLISHED,
      isFeatured: true,
    },
    include: eventListInclude,
    orderBy: { dateStart: 'asc' },
    take: limit,
  })
}

export async function createEvent(
  churchId: string,
  data: Omit<Prisma.EventUncheckedCreateInput, 'churchId'>,
  tagNames?: string[],
) {
  const event = await prisma.event.create({
    data: { ...data, churchId },
    include: eventDetailInclude,
  })

  if (tagNames && tagNames.length > 0) {
    await syncEventTags(churchId, event.id, tagNames)
  }

  const tags = await getEventTags(event.id)
  return { ...event, tags }
}

export async function updateEvent(
  churchId: string,
  id: string,
  data: Prisma.EventUncheckedUpdateInput,
  tagNames?: string[],
) {
  const event = await prisma.event.update({
    where: { id, churchId },
    data,
    include: eventDetailInclude,
  })

  if (tagNames !== undefined) {
    await syncEventTags(churchId, event.id, tagNames)
  }

  const tags = await getEventTags(event.id)
  return { ...event, tags }
}

export async function deleteEvent(churchId: string, id: string) {
  return prisma.event.update({
    where: { id, churchId },
    data: { deletedAt: new Date() },
  })
}

// ── Tag helpers ──

/** Get tags for an event via the ContentTag join table */
export async function getEventTags(eventId: string): Promise<ContentTagWithTag[]> {
  return prisma.contentTag.findMany({
    where: { entityType: 'EVENT', entityId: eventId },
    include: { tag: true },
  })
}

/**
 * Sync tags for an event. Accepts an array of tag name strings (e.g. ["#YAM", "#WORSHIP"]).
 * Creates Tag records if they don't exist, then reconciles ContentTag join records.
 */
export async function syncEventTags(
  churchId: string,
  eventId: string,
  tagNames: string[],
): Promise<void> {
  // Normalize: strip leading # and uppercase, deduplicate
  const normalized = [...new Set(
    tagNames
      .map(t => t.replace(/^#/, '').trim())
      .filter(Boolean)
  )]

  if (normalized.length === 0) {
    // Remove all tags for this event
    await prisma.contentTag.deleteMany({
      where: { entityType: 'EVENT', entityId: eventId },
    })
    return
  }

  // Ensure all Tag records exist (upsert by churchId + slug)
  const tagRecords = await Promise.all(
    normalized.map(async (name) => {
      const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
      return prisma.tag.upsert({
        where: { churchId_slug: { churchId, slug } },
        update: {}, // Tag already exists, no update needed
        create: { churchId, name: name.toUpperCase(), slug },
      })
    })
  )

  const desiredTagIds = new Set(tagRecords.map(t => t.id))

  // Get existing ContentTag join records for this event
  const existing = await prisma.contentTag.findMany({
    where: { entityType: 'EVENT', entityId: eventId },
  })
  const existingTagIds = new Set(existing.map(ct => ct.tagId))

  // Determine adds and removes
  const toAdd = tagRecords.filter(t => !existingTagIds.has(t.id))
  const toRemove = existing.filter(ct => !desiredTagIds.has(ct.tagId))

  // Execute in a transaction
  await prisma.$transaction([
    ...toRemove.map(ct =>
      prisma.contentTag.delete({ where: { id: ct.id } })
    ),
    ...toAdd.map(t =>
      prisma.contentTag.create({
        data: { tagId: t.id, entityType: 'EVENT', entityId: eventId },
      })
    ),
  ])
}
