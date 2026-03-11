import { prisma } from '@/lib/db'
import { Prisma } from '@/lib/generated/prisma/client'
import { paginationArgs, paginatedResult, type PaginationParams, type PaginatedResult } from './types'

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
type ContactSubmission = Prisma.ContactSubmissionGetPayload<{}>

export type FormSubmissionFilters = {
  isRead?: boolean
  formType?: string
  search?: string
}

export async function listSubmissions(
  churchId: string,
  filters?: FormSubmissionFilters & PaginationParams,
): Promise<PaginatedResult<ContactSubmission>> {
  const { skip, take, page, pageSize } = paginationArgs(filters)

  const where: Prisma.ContactSubmissionWhereInput = {
    churchId,
    ...(filters?.isRead !== undefined && { isRead: filters.isRead }),
    ...(filters?.formType && { formType: filters.formType }),
    ...(filters?.search && {
      OR: [
        { name: { contains: filters.search, mode: 'insensitive' as const } },
        { email: { contains: filters.search, mode: 'insensitive' as const } },
      ],
    }),
  }

  const [data, total] = await Promise.all([
    prisma.contactSubmission.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip,
      take,
    }),
    prisma.contactSubmission.count({ where }),
  ])

  return paginatedResult(data, total, page, pageSize)
}

export async function getSubmission(
  churchId: string,
  id: string,
): Promise<ContactSubmission | null> {
  return prisma.contactSubmission.findFirst({
    where: { id, churchId },
  })
}

export async function markAsRead(churchId: string, id: string) {
  // Verify tenant ownership first
  const existing = await getSubmission(churchId, id)
  if (!existing) throw new Error('Submission not found')

  return prisma.contactSubmission.update({
    where: { id },
    data: { isRead: true, readAt: new Date() },
  })
}

export async function markAsUnread(churchId: string, id: string) {
  const existing = await getSubmission(churchId, id)
  if (!existing) throw new Error('Submission not found')

  return prisma.contactSubmission.update({
    where: { id },
    data: { isRead: false, readAt: null },
  })
}

export async function updateSubmission(
  churchId: string,
  id: string,
  data: { notes?: string; assignedTo?: string | null; isRead?: boolean },
) {
  // Verify tenant ownership first
  const existing = await getSubmission(churchId, id)
  if (!existing) throw new Error('Submission not found')

  const updateData: Prisma.ContactSubmissionUncheckedUpdateInput = {}
  if (data.notes !== undefined) updateData.notes = data.notes
  if (data.assignedTo !== undefined) updateData.assignedTo = data.assignedTo
  if (data.isRead !== undefined) {
    updateData.isRead = data.isRead
    updateData.readAt = data.isRead ? new Date() : null
  }

  return prisma.contactSubmission.update({
    where: { id },
    data: updateData,
  })
}

export async function deleteSubmission(churchId: string, id: string) {
  // Verify tenant ownership first
  const existing = await getSubmission(churchId, id)
  if (!existing) throw new Error('Submission not found')

  return prisma.contactSubmission.delete({
    where: { id },
  })
}

export async function getUnreadCount(churchId: string): Promise<number> {
  return prisma.contactSubmission.count({
    where: { churchId, isRead: false },
  })
}
