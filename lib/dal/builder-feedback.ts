import { prisma } from '@/lib/db'
import { Prisma } from '@/lib/generated/prisma/client'
import { paginationArgs, paginatedResult, type PaginationParams, type PaginatedResult } from './types'

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
type BuilderFeedback = Prisma.BuilderFeedbackGetPayload<{}>

export type BuilderFeedbackFilters = {
  type?: string
  status?: string
  search?: string
}

export async function listBuilderFeedback(
  churchId: string,
  filters?: BuilderFeedbackFilters & PaginationParams,
): Promise<PaginatedResult<BuilderFeedback>> {
  const { skip, take, page, pageSize } = paginationArgs(filters)

  const where: Prisma.BuilderFeedbackWhereInput = {
    churchId,
    ...(filters?.type && { type: filters.type }),
    ...(filters?.status && { status: filters.status }),
    ...(filters?.search && {
      OR: [
        { title: { contains: filters.search, mode: 'insensitive' as const } },
        { description: { contains: filters.search, mode: 'insensitive' as const } },
        { userName: { contains: filters.search, mode: 'insensitive' as const } },
      ],
    }),
  }

  const [data, total] = await Promise.all([
    prisma.builderFeedback.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip,
      take,
    }),
    prisma.builderFeedback.count({ where }),
  ])

  return paginatedResult(data, total, page, pageSize)
}

export async function getBuilderFeedback(
  churchId: string,
  id: string,
): Promise<BuilderFeedback | null> {
  return prisma.builderFeedback.findFirst({
    where: { id, churchId },
  })
}

export async function createBuilderFeedback(data: {
  churchId: string
  userId: string
  userName: string
  title: string
  description: string
  type: string
  snapshot: Record<string, unknown>
  actionHistory?: unknown[] | null
}) {
  return prisma.builderFeedback.create({
    data: {
      churchId: data.churchId,
      userId: data.userId,
      userName: data.userName,
      title: data.title,
      description: data.description,
      type: data.type,
      snapshot: data.snapshot as Prisma.InputJsonValue,
      actionHistory: (data.actionHistory as Prisma.InputJsonValue) ?? undefined,
    },
  })
}

export async function updateBuilderFeedback(
  churchId: string,
  id: string,
  data: { status?: string; isRead?: boolean; adminNotes?: string | null },
) {
  const existing = await getBuilderFeedback(churchId, id)
  if (!existing) throw new Error('Feedback not found')

  const updateData: Prisma.BuilderFeedbackUncheckedUpdateInput = {}
  if (data.status !== undefined) updateData.status = data.status
  if (data.adminNotes !== undefined) updateData.adminNotes = data.adminNotes
  if (data.isRead !== undefined) {
    updateData.isRead = data.isRead
    updateData.readAt = data.isRead ? new Date() : null
  }

  return prisma.builderFeedback.update({
    where: { id },
    data: updateData,
  })
}

export async function deleteBuilderFeedback(churchId: string, id: string) {
  const existing = await getBuilderFeedback(churchId, id)
  if (!existing) throw new Error('Feedback not found')

  return prisma.builderFeedback.delete({ where: { id } })
}

export async function getBuilderFeedbackCounts(churchId: string) {
  const [total, unread] = await Promise.all([
    prisma.builderFeedback.count({ where: { churchId } }),
    prisma.builderFeedback.count({ where: { churchId, isRead: false } }),
  ])
  return { total, unread }
}
