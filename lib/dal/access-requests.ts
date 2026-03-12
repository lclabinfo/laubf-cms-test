/**
 * Data Access Layer for access requests.
 * Users without church membership can request access;
 * admins with 'users.approve_requests' permission can approve/deny.
 */

import { prisma } from '@/lib/db'
import type { AccessRequestStatus } from '@/lib/generated/prisma/client'

export interface AccessRequestRow {
  id: string
  userId: string
  email: string
  firstName: string
  lastName: string
  avatarUrl: string | null
  message: string | null
  status: AccessRequestStatus
  createdAt: Date
  reviewedAt: Date | null
  reviewNote: string | null
}

export async function createAccessRequest(
  churchId: string,
  userId: string,
  message?: string,
) {
  return prisma.accessRequest.upsert({
    where: { churchId_userId: { churchId, userId } },
    create: { churchId, userId, message: message || null },
    update: {
      message: message || null,
      status: 'PENDING',
      reviewedBy: null,
      reviewedAt: null,
      reviewNote: null,
    },
  })
}

export async function getAccessRequestByUser(
  churchId: string,
  userId: string,
) {
  return prisma.accessRequest.findUnique({
    where: { churchId_userId: { churchId, userId } },
    select: {
      id: true,
      status: true,
      message: true,
      reviewNote: true,
      createdAt: true,
      reviewedAt: true,
    },
  })
}

export async function listAccessRequests(
  churchId: string,
  status?: AccessRequestStatus,
): Promise<AccessRequestRow[]> {
  const requests = await prisma.accessRequest.findMany({
    where: { churchId, ...(status ? { status } : {}) },
    include: {
      user: {
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          avatarUrl: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  })

  return requests.map((r) => ({
    id: r.id,
    userId: r.userId,
    email: r.user.email,
    firstName: r.user.firstName,
    lastName: r.user.lastName,
    avatarUrl: r.user.avatarUrl,
    message: r.message,
    status: r.status,
    createdAt: r.createdAt,
    reviewedAt: r.reviewedAt,
    reviewNote: r.reviewNote,
  }))
}

export async function getPendingAccessRequestCount(churchId: string) {
  return prisma.accessRequest.count({
    where: { churchId, status: 'PENDING' },
  })
}

export async function approveAccessRequest(
  requestId: string,
  reviewedBy: string,
  reviewNote?: string,
) {
  // Use interactive transaction to guarantee atomicity and prevent race conditions.
  // The WHERE includes status:'PENDING' so concurrent approvals can't both succeed.
  return prisma.$transaction(async (tx) => {
    const request = await tx.accessRequest.findFirst({
      where: { id: requestId, status: 'PENDING' },
    })
    if (!request) {
      throw new Error('Request not found or already reviewed')
    }

    const updatedRequest = await tx.accessRequest.update({
      where: { id: requestId },
      data: {
        status: 'APPROVED',
        reviewedBy,
        reviewedAt: new Date(),
        reviewNote: reviewNote || null,
      },
    })

    // Guard against duplicate membership (e.g., admin invited while request was pending)
    const existingMember = await tx.churchMember.findFirst({
      where: { churchId: request.churchId, userId: request.userId },
    })
    if (!existingMember) {
      await tx.churchMember.create({
        data: {
          churchId: request.churchId,
          userId: request.userId,
          role: 'VIEWER',
          status: 'ACTIVE',
        },
      })
    }

    return updatedRequest
  })
}

export async function denyAccessRequest(
  requestId: string,
  reviewedBy: string,
  reviewNote?: string,
) {
  // Include status:'PENDING' in WHERE to prevent race conditions
  const result = await prisma.accessRequest.updateMany({
    where: { id: requestId, status: 'PENDING' },
    data: {
      status: 'DENIED',
      reviewedBy,
      reviewedAt: new Date(),
      reviewNote: reviewNote || null,
    },
  })
  if (result.count === 0) {
    throw new Error('Request not found or already reviewed')
  }
  return prisma.accessRequest.findUniqueOrThrow({ where: { id: requestId } })
}
