import { prisma } from '@/lib/db'
import { Prisma, type HouseholdRole } from '@/lib/generated/prisma/client'
import { paginationArgs, paginatedResult, type PaginationParams, type PaginatedResult } from './types'

type HouseholdWithRelations = Prisma.HouseholdGetPayload<{
  include: {
    primaryContact: true
    members: { include: { person: true } }
  }
}>

const householdInclude = {
  primaryContact: true,
  members: {
    include: { person: true },
    orderBy: { createdAt: 'asc' as const },
  },
} satisfies Prisma.HouseholdInclude

export type HouseholdFilters = {
  search?: string
}

export async function getHouseholds(
  churchId: string,
  filters?: HouseholdFilters & PaginationParams,
): Promise<PaginatedResult<HouseholdWithRelations>> {
  const { skip, take, page, pageSize } = paginationArgs(filters)

  const where: Prisma.HouseholdWhereInput = {
    churchId,
    ...(filters?.search && {
      name: { contains: filters.search, mode: 'insensitive' as const },
    }),
  }

  const [data, total] = await Promise.all([
    prisma.household.findMany({
      where,
      include: householdInclude,
      orderBy: { name: 'asc' },
      skip,
      take,
    }),
    prisma.household.count({ where }),
  ])

  return paginatedResult(data, total, page, pageSize)
}

export async function getHouseholdById(
  churchId: string,
  id: string,
): Promise<HouseholdWithRelations | null> {
  return prisma.household.findFirst({
    where: { id, churchId },
    include: householdInclude,
  })
}

export async function createHousehold(
  churchId: string,
  data: Omit<Prisma.HouseholdUncheckedCreateInput, 'churchId'>,
) {
  return prisma.household.create({
    data: { ...data, churchId },
    include: householdInclude,
  })
}

export async function updateHousehold(
  churchId: string,
  id: string,
  data: Prisma.HouseholdUncheckedUpdateInput,
) {
  return prisma.household.update({
    where: { id, churchId },
    data,
    include: householdInclude,
  })
}

export async function deleteHousehold(churchId: string, id: string) {
  return prisma.household.delete({
    where: { id, churchId },
  })
}

export async function addHouseholdMember(
  householdId: string,
  personId: string,
  role: HouseholdRole = 'OTHER_ADULT',
) {
  return prisma.householdMember.create({
    data: { householdId, personId, role },
    include: { person: true, household: true },
  })
}

export async function removeHouseholdMember(
  householdId: string,
  personId: string,
) {
  return prisma.householdMember.delete({
    where: { householdId_personId: { householdId, personId } },
  })
}
