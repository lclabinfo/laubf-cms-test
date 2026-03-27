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

/** Override global omit to include all fields in detail/write queries */
const eventDetailOmit = {
  description: false as const,
  locationInstructions: false as const,
  welcomeMessage: false as const,
}

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

export type EventFilterMeta = {
  years: number[]
  ministries: string[]
  campuses: string[]
}

/**
 * Lightweight query to get all available filter options for published events.
 * Returns years, ministries, and campuses so the client can render complete
 * filter dropdowns on first render even when data exceeds the page size.
 */
export async function getEventFilterMeta(churchId: string): Promise<EventFilterMeta> {
  const where: Prisma.EventWhereInput = {
    churchId,
    deletedAt: null,
    status: ContentStatus.PUBLISHED,
  }

  const [yearRows, ministryRows, campusRows] = await Promise.all([
    prisma.event.findMany({
      where,
      select: { dateStart: true },
      distinct: ['dateStart'],
    }).then((rows) => {
      const years = new Set<number>()
      for (const r of rows) {
        if (r.dateStart) years.add(new Date(r.dateStart).getFullYear())
      }
      return Array.from(years).sort((a, b) => b - a)
    }),
    prisma.event.findMany({
      where: { ...where, ministryId: { not: null } },
      select: { ministry: { select: { name: true } } },
      distinct: ['ministryId'],
    }).then((rows) =>
      rows.map((r) => r.ministry!.name).filter(Boolean).sort()
    ),
    prisma.event.findMany({
      where: { ...where, campusId: { not: null } },
      select: { campus: { select: { name: true } } },
      distinct: ['campusId'],
    }).then((rows) =>
      rows.map((r) => r.campus!.name).filter(Boolean).sort()
    ),
  ])

  return { years: yearRows, ministries: ministryRows, campuses: campusRows }
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
    omit: eventDetailOmit,
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
  limit?: number,
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
    take: limit || 50,
  })
}

export async function createEvent(
  churchId: string,
  data: Omit<Prisma.EventUncheckedCreateInput, 'churchId'>,
) {
  return prisma.event.create({
    data: { ...data, churchId },
    omit: eventDetailOmit,
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
    omit: eventDetailOmit,
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
