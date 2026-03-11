/**
 * Data Access Layer for CMS user management (ChurchMember + User).
 */

import { prisma } from '@/lib/db'
import type { MemberRole } from '@/lib/generated/prisma/client'

export interface ChurchUser {
  id: string // ChurchMember ID
  userId: string
  email: string
  firstName: string
  lastName: string
  avatarUrl: string | null
  role: MemberRole
  status: string
  emailVerified: boolean
  joinedAt: Date
  invitedAt: Date | null
  linkedPersonId: string | null
  linkedPersonName: string | null
  lastLogin: Date | null // from Account or Session
}

export async function listChurchUsers(churchId: string): Promise<ChurchUser[]> {
  const members = await prisma.churchMember.findMany({
    where: { churchId },
    include: {
      user: {
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          avatarUrl: true,
          emailVerified: true,
          updatedAt: true,
        },
      },
    },
    orderBy: { joinedAt: 'asc' },
  })

  // Find linked Person records for these users
  const userIds = members.map((m) => m.user.id)
  const linkedPersons = await prisma.person.findMany({
    where: {
      churchId,
      userId: { in: userIds },
      deletedAt: null,
    },
    select: { userId: true, id: true, firstName: true, lastName: true },
  })
  const personByUserId = new Map(linkedPersons.map((p) => [p.userId, p]))

  return members.map((m) => {
    const person = personByUserId.get(m.user.id)
    return {
      id: m.id,
      userId: m.user.id,
      email: m.user.email,
      firstName: m.user.firstName,
      lastName: m.user.lastName,
      avatarUrl: m.user.avatarUrl,
      role: m.role,
      status: m.status,
      emailVerified: m.user.emailVerified,
      joinedAt: m.joinedAt,
      invitedAt: m.invitedAt,
      linkedPersonId: person?.id || null,
      linkedPersonName: person ? `${person.firstName} ${person.lastName}` : null,
      lastLogin: m.user.updatedAt, // approximate
    }
  })
}

export async function getChurchUser(churchId: string, memberId: string) {
  return prisma.churchMember.findFirst({
    where: { id: memberId, churchId },
    include: {
      user: {
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          avatarUrl: true,
          emailVerified: true,
        },
      },
    },
  })
}

export async function updateUserRole(
  churchId: string,
  memberId: string,
  newRole: MemberRole,
) {
  return prisma.churchMember.update({
    where: { id: memberId, churchId },
    data: { role: newRole },
  })
}

export async function removeChurchUser(churchId: string, memberId: string) {
  return prisma.churchMember.delete({
    where: { id: memberId, churchId },
  })
}

export async function getChurchOwnerCount(churchId: string): Promise<number> {
  return prisma.churchMember.count({
    where: { churchId, role: 'OWNER' },
  })
}

export async function inviteUser(
  churchId: string,
  email: string,
  role: MemberRole,
): Promise<{ user: { id: string; email: string; firstName: string; lastName: string }; isNewUser: boolean; membershipId: string }> {
  const trimmedEmail = email.trim().toLowerCase()

  // Check if already a member
  const existingMember = await prisma.churchMember.findFirst({
    where: {
      churchId,
      user: { email: trimmedEmail },
    },
  })
  if (existingMember) {
    throw new Error('User is already a member of this church.')
  }

  // Check if user exists
  let user = await prisma.user.findUnique({
    where: { email: trimmedEmail },
    select: { id: true, email: true, firstName: true, lastName: true },
  })
  let isNewUser = false

  if (!user) {
    // Create placeholder user (no password — will set on invite acceptance)
    user = await prisma.user.create({
      data: {
        email: trimmedEmail,
        firstName: '',
        lastName: '',
        emailVerified: false,
      },
      select: { id: true, email: true, firstName: true, lastName: true },
    })
    isNewUser = true
  }

  // Create ChurchMember
  const membership = await prisma.churchMember.create({
    data: {
      churchId,
      userId: user.id,
      role,
      status: 'PENDING',
      invitedAt: new Date(),
    },
  })

  // Auto-link to Person by email (best-effort)
  try {
    const person = await prisma.person.findFirst({
      where: {
        churchId,
        email: trimmedEmail,
        userId: null,
        deletedAt: null,
      },
    })
    if (person) {
      await prisma.person.update({
        where: { id: person.id },
        data: { userId: user.id },
      })
    }
  } catch {
    // Best-effort — skip silently if auto-link fails
  }

  return { user, isNewUser, membershipId: membership.id }
}

export async function linkUserToPerson(
  churchId: string,
  userId: string,
  personId: string,
) {
  // Verify person belongs to this church
  const person = await prisma.person.findFirst({
    where: { id: personId, churchId, deletedAt: null },
  })
  if (!person) throw new Error('Person not found')

  // Verify user is a member of this church
  const member = await prisma.churchMember.findFirst({
    where: { churchId, userId },
  })
  if (!member) throw new Error('User is not a member of this church')

  return prisma.person.update({
    where: { id: personId },
    data: { userId },
  })
}

export async function unlinkUserFromPerson(churchId: string, personId: string) {
  return prisma.person.update({
    where: { id: personId, churchId },
    data: { userId: null },
  })
}

export async function deactivateUser(churchId: string, memberId: string) {
  return prisma.churchMember.update({
    where: { id: memberId, churchId },
    data: { status: 'INACTIVE' },
  })
}

export async function reactivateUser(churchId: string, memberId: string) {
  return prisma.churchMember.update({
    where: { id: memberId, churchId },
    data: { status: 'ACTIVE' },
  })
}
