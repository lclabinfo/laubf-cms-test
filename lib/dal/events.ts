import { prisma } from '@/lib/db'
import { ContentStatus, Prisma, type EventType } from '@/lib/generated/prisma/client'
import { paginationArgs, paginatedResult, type PaginationParams, type PaginatedResult } from './types'

type EventWithRelations = Prisma.EventGetPayload<{
  include: { ministry: true; campus: true }
}>

type EventDetail = Prisma.EventGetPayload<{
  include: { ministry: true; campus: true; eventLinks: true }
}>

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

  return paginatedResult(data, total, page, pageSize)
}

export async function getEventBySlug(
  churchId: string,
  slug: string,
): Promise<EventDetail | null> {
  const event = await prisma.event.findUnique({
    where: { churchId_slug: { churchId, slug } },
    include: eventDetailInclude,
  })
  return event
}

export async function getUpcomingEvents(
  churchId: string,
  limit = 10,
  options?: {
    includeRecurring?: boolean
    /** Include past events that ended within this many days ago. 0 = no past events, -1 = infinite (all past). */
    pastEventsDays?: number
    /** Sort order: 'asc' = upcoming first (default), 'desc' = most recent first */
    sortOrder?: 'asc' | 'desc'
  },
): Promise<EventWithRelations[]> {
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const includeRecurring = options?.includeRecurring ?? true
  const pastEventsDays = options?.pastEventsDays ?? 0
  const sortOrder = options?.sortOrder ?? 'asc'

  // Build date conditions
  const dateConditions: object[] = [{ dateStart: { gte: today } }]

  if (includeRecurring) {
    dateConditions.push({ isRecurring: true })
  }

  if (pastEventsDays !== 0) {
    if (pastEventsDays === -1) {
      // Infinite lookback — include all past events
      dateConditions.push({ dateStart: { lt: today } })
    } else {
      const cutoff = new Date(today)
      cutoff.setDate(cutoff.getDate() - pastEventsDays)
      dateConditions.push({
        dateStart: { lt: today, gte: cutoff },
      })
    }
  }

  return prisma.event.findMany({
    where: {
      churchId,
      deletedAt: null,
      status: ContentStatus.PUBLISHED,
      OR: dateConditions,
    },
    include: eventListInclude,
    orderBy: { dateStart: sortOrder },
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

export async function getHybridFeaturedEvents(
  churchId: string,
  options: {
    maxCount?: number
    autoHidePastFeatured?: boolean
    includeRecurring?: boolean
    pastEventsDays?: number
    sortOrder?: 'asc' | 'desc'
  } = {},
): Promise<(EventWithRelations & { featuredMode: 'manual' | 'auto' })[]> {
  const maxCount = options.maxCount ?? 3
  const autoHidePastFeatured = options.autoHidePastFeatured ?? false
  const includeRecurring = options.includeRecurring ?? false
  const pastEventsDays = options.pastEventsDays ?? 14
  const sortOrder = options.sortOrder ?? 'asc'

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  // Step 1: Fetch all manually featured events (published, not deleted)
  let manualEvents = await prisma.event.findMany({
    where: {
      churchId,
      deletedAt: null,
      status: ContentStatus.PUBLISHED,
      isFeatured: true,
    },
    include: eventListInclude,
    orderBy: { dateStart: sortOrder },
  })

  // Step 2: If autoHidePastFeatured, filter out past events (keep if dateEnd >= today)
  if (autoHidePastFeatured) {
    manualEvents = manualEvents.filter((e) => {
      if (e.dateEnd) {
        return e.dateEnd >= today
      }
      return e.dateStart >= today
    })
  }

  // Step 3: Take up to maxCount manual events
  const selectedManual = manualEvents.slice(0, maxCount)
  const remainingSlots = maxCount - selectedManual.length

  // Step 4: If we need more, auto-fill from upcoming events
  let autoEvents: EventWithRelations[] = []
  if (remainingSlots > 0) {
    const manualIds = new Set(selectedManual.map((e) => e.id))

    // Build date conditions (same logic as getUpcomingEvents)
    const dateConditions: object[] = [{ dateStart: { gte: today } }]

    if (includeRecurring) {
      dateConditions.push({ isRecurring: true })
    }

    if (pastEventsDays > 0) {
      const cutoff = new Date(today)
      cutoff.setDate(cutoff.getDate() - pastEventsDays)
      dateConditions.push({
        dateStart: { lt: today, gte: cutoff },
      })
    }

    const candidates = await prisma.event.findMany({
      where: {
        churchId,
        deletedAt: null,
        status: ContentStatus.PUBLISHED,
        OR: dateConditions,
        ...(!includeRecurring && { isRecurring: false }),
      },
      include: eventListInclude,
      orderBy: { dateStart: sortOrder },
      // Fetch extra to account for filtering out manual IDs
      take: remainingSlots + manualIds.size,
    })

    autoEvents = candidates
      .filter((e) => !manualIds.has(e.id))
      .slice(0, remainingSlots)
  }

  // Step 5: Tag and combine
  const taggedManual = selectedManual.map((e) => ({
    ...e,
    featuredMode: 'manual' as const,
  }))
  const taggedAuto = autoEvents.map((e) => ({
    ...e,
    featuredMode: 'auto' as const,
  }))

  return [...taggedManual, ...taggedAuto]
}

export async function getCurrentFeaturedEventIds(churchId: string): Promise<string[]> {
  const events = await prisma.event.findMany({
    where: {
      churchId,
      deletedAt: null,
      isFeatured: true,
    },
    select: { id: true },
  })
  return events.map((e) => e.id)
}

export async function getManualFeaturedCount(churchId: string): Promise<number> {
  return prisma.event.count({
    where: {
      churchId,
      deletedAt: null,
      isFeatured: true,
    },
  })
}

export async function createEvent(
  churchId: string,
  data: Omit<Prisma.EventUncheckedCreateInput, 'churchId'>,
) {
  return prisma.event.create({
    data: { ...data, churchId },
    include: eventDetailInclude,
  })
}

export async function updateEvent(
  churchId: string,
  id: string,
  data: Prisma.EventUncheckedUpdateInput,
) {
  return prisma.event.update({
    where: { id, churchId },
    data,
    include: eventDetailInclude,
  })
}

/**
 * Returns a map of contact name -> frequency count across all events for a church.
 * Handles JSON {name,label}[] format stored in the contacts JSONB column.
 */
export async function getContactFrequency(
  churchId: string,
): Promise<Record<string, number>> {
  const rows = await prisma.$queryRaw<{ name: string; count: number }[]>`
    SELECT c->>'name' as name, count(*)::int as count
    FROM "Event",
         jsonb_array_elements(contacts) as c
    WHERE "churchId" = ${churchId}::uuid
      AND contacts IS NOT NULL
    GROUP BY c->>'name'
    ORDER BY count DESC
  `
  const result: Record<string, number> = {}
  for (const row of rows) {
    if (row.name) result[row.name] = row.count
  }
  return result
}

export async function deleteEvent(churchId: string, id: string) {
  return prisma.event.update({
    where: { id, churchId },
    data: { deletedAt: new Date() },
  })
}

/**
 * Sync EventLink records for an event. Replaces all existing EventLink records
 * with the provided array. Each item must have at least `label` and `href`.
 */
export async function syncEventLinks(
  eventId: string,
  links: { label: string; href: string; external?: boolean }[],
): Promise<void> {
  await prisma.$transaction([
    prisma.eventLink.deleteMany({ where: { eventId } }),
    ...links
      .filter(l => l.label.trim() && l.href.trim())
      .map((l, i) =>
        prisma.eventLink.create({
          data: {
            eventId,
            label: l.label.trim(),
            href: l.href.trim(),
            external: l.external ?? true,
            sortOrder: i,
          },
        })
      ),
  ])
}
