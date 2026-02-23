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
  return prisma.event.findUnique({
    where: { churchId_slug: { churchId, slug } },
    include: eventDetailInclude,
  })
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

export async function deleteEvent(churchId: string, id: string) {
  return prisma.event.update({
    where: { id, churchId },
    data: { deletedAt: new Date() },
  })
}
