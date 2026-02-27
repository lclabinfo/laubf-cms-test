import { prisma } from '@/lib/db'
import { Prisma, type GroupType, type GroupStatus, type GroupMemberRole } from '@/lib/generated/prisma/client'
import { paginationArgs, paginatedResult, type PaginationParams, type PaginatedResult } from './types'

type PersonGroupWithRelations = Prisma.PersonGroupGetPayload<{
  include: {
    members: { include: { person: true } }
    children: true
    parent: true
  }
}>

const groupListInclude = {
  members: {
    include: { person: true },
    orderBy: { createdAt: 'asc' as const },
  },
  children: true,
  parent: true,
} satisfies Prisma.PersonGroupInclude

export type PersonGroupFilters = {
  search?: string
  groupType?: GroupType
  status?: GroupStatus | null
  parentGroupId?: string | null
}

export async function getPersonGroups(
  churchId: string,
  filters?: PersonGroupFilters & PaginationParams,
): Promise<PaginatedResult<PersonGroupWithRelations>> {
  const { skip, take, page, pageSize } = paginationArgs(filters)
  const status = filters?.status === null ? undefined : (filters?.status ?? 'ACTIVE')

  const where: Prisma.PersonGroupWhereInput = {
    churchId,
    deletedAt: null,
    ...(status !== undefined && { status }),
    ...(filters?.groupType && { groupType: filters.groupType }),
    ...(filters?.parentGroupId !== undefined && { parentGroupId: filters.parentGroupId }),
    ...(filters?.search && {
      OR: [
        { name: { contains: filters.search, mode: 'insensitive' as const } },
        { description: { contains: filters.search, mode: 'insensitive' as const } },
      ],
    }),
  }

  const [data, total] = await Promise.all([
    prisma.personGroup.findMany({
      where,
      include: groupListInclude,
      orderBy: { name: 'asc' },
      skip,
      take,
    }),
    prisma.personGroup.count({ where }),
  ])

  return paginatedResult(data, total, page, pageSize)
}

export async function getPersonGroupById(
  churchId: string,
  id: string,
): Promise<PersonGroupWithRelations | null> {
  return prisma.personGroup.findFirst({
    where: { id, churchId, deletedAt: null },
    include: groupListInclude,
  })
}

export async function getPersonGroupBySlug(
  churchId: string,
  slug: string,
): Promise<PersonGroupWithRelations | null> {
  return prisma.personGroup.findUnique({
    where: { churchId_slug: { churchId, slug } },
    include: groupListInclude,
  })
}

export async function createPersonGroup(
  churchId: string,
  data: Omit<Prisma.PersonGroupUncheckedCreateInput, 'churchId'>,
) {
  return prisma.personGroup.create({
    data: { ...data, churchId },
    include: groupListInclude,
  })
}

export async function updatePersonGroup(
  churchId: string,
  id: string,
  data: Prisma.PersonGroupUncheckedUpdateInput,
) {
  return prisma.personGroup.update({
    where: { id, churchId },
    data,
    include: groupListInclude,
  })
}

export async function deletePersonGroup(churchId: string, id: string) {
  return prisma.personGroup.update({
    where: { id, churchId },
    data: { deletedAt: new Date() },
  })
}

export async function getGroupMembers(
  groupId: string,
  filters?: PaginationParams,
) {
  const { skip, take, page, pageSize } = paginationArgs(filters)

  const where: Prisma.PersonGroupMemberWhereInput = {
    groupId,
    leftAt: null,
  }

  const [data, total] = await Promise.all([
    prisma.personGroupMember.findMany({
      where,
      include: { person: true },
      orderBy: { joinedAt: 'asc' },
      skip,
      take,
    }),
    prisma.personGroupMember.count({ where }),
  ])

  return paginatedResult(data, total, page, pageSize)
}

export async function addGroupMember(
  groupId: string,
  personId: string,
  role: GroupMemberRole = 'MEMBER',
) {
  return prisma.personGroupMember.create({
    data: { groupId, personId, role },
    include: { person: true, group: true },
  })
}

export async function removeGroupMember(
  groupId: string,
  personId: string,
) {
  return prisma.personGroupMember.update({
    where: { groupId_personId: { groupId, personId } },
    data: { leftAt: new Date() },
  })
}
