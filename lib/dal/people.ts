import { prisma } from '@/lib/db'
import { Prisma, type MembershipStatus } from '@/lib/generated/prisma/client'
import { paginationArgs, paginatedResult, type PaginationParams, type PaginatedResult } from './types'

type PersonWithRelations = Prisma.PersonGetPayload<{
  include: {
    householdMemberships: { include: { household: true } }
    groupMemberships: { include: { group: true } }
    personTags: true
    roleAssignments: { include: { role: true } }
  }
}>

type PersonDetail = Prisma.PersonGetPayload<{
  include: {
    householdMemberships: { include: { household: true } }
    groupMemberships: { include: { group: true } }
    personTags: true
    roleAssignments: { include: { role: true } }
    communicationPreferences: true
    customFieldValues: { include: { fieldDefinition: true } }
  }
}>

const personListInclude = {
  householdMemberships: {
    include: { household: true },
  },
  groupMemberships: {
    include: { group: true },
  },
  personTags: true,
  roleAssignments: {
    include: { role: true },
  },
} satisfies Prisma.PersonInclude

const personDetailInclude = {
  ...personListInclude,
  communicationPreferences: true,
  customFieldValues: {
    include: { fieldDefinition: true },
  },
} satisfies Prisma.PersonInclude

export type PersonFilters = {
  search?: string
  membershipStatus?: MembershipStatus | null
  tagName?: string
  groupId?: string
  householdId?: string
}

export async function getPeople(
  churchId: string,
  filters?: PersonFilters & PaginationParams,
): Promise<PaginatedResult<PersonWithRelations>> {
  const { skip, take, page, pageSize } = paginationArgs(filters)

  const where: Prisma.PersonWhereInput = {
    churchId,
    deletedAt: null,
    ...(filters?.membershipStatus && { membershipStatus: filters.membershipStatus }),
    ...(filters?.tagName && {
      personTags: { some: { tagName: filters.tagName } },
    }),
    ...(filters?.groupId && {
      groupMemberships: { some: { groupId: filters.groupId } },
    }),
    ...(filters?.householdId && {
      householdMemberships: { some: { householdId: filters.householdId } },
    }),
    ...(filters?.search && {
      OR: [
        { firstName: { contains: filters.search, mode: 'insensitive' as const } },
        { lastName: { contains: filters.search, mode: 'insensitive' as const } },
        { preferredName: { contains: filters.search, mode: 'insensitive' as const } },
        { email: { contains: filters.search, mode: 'insensitive' as const } },
        { phone: { contains: filters.search, mode: 'insensitive' as const } },
      ],
    }),
  }

  const [data, total] = await Promise.all([
    prisma.person.findMany({
      where,
      include: personListInclude,
      orderBy: [{ lastName: 'asc' }, { firstName: 'asc' }],
      skip,
      take,
    }),
    prisma.person.count({ where }),
  ])

  return paginatedResult(data, total, page, pageSize)
}

export async function getPersonById(
  churchId: string,
  id: string,
): Promise<PersonDetail | null> {
  return prisma.person.findFirst({
    where: { id, churchId, deletedAt: null },
    include: personDetailInclude,
  })
}

export async function getPersonBySlug(
  churchId: string,
  slug: string,
): Promise<PersonDetail | null> {
  return prisma.person.findUnique({
    where: { churchId_slug: { churchId, slug } },
    include: personDetailInclude,
  })
}

export async function ensureUniquePersonSlug(
  churchId: string,
  baseSlug: string,
  excludeId?: string,
): Promise<string> {
  let slug = baseSlug
  let counter = 1
  while (true) {
    const existing = await prisma.person.findUnique({
      where: { churchId_slug: { churchId, slug } },
      select: { id: true },
    })
    if (!existing || (excludeId && existing.id === excludeId)) {
      return slug
    }
    counter++
    slug = `${baseSlug}-${counter}`
  }
}

export async function createPerson(
  churchId: string,
  data: Omit<Prisma.PersonUncheckedCreateInput, 'churchId'>,
) {
  if (data.slug) {
    data.slug = await ensureUniquePersonSlug(churchId, data.slug)
  }

  return prisma.person.create({
    data: { ...data, churchId },
    include: personDetailInclude,
  })
}

export async function updatePerson(
  churchId: string,
  id: string,
  data: Prisma.PersonUncheckedUpdateInput,
) {
  if (data.slug && typeof data.slug === 'string') {
    data.slug = await ensureUniquePersonSlug(churchId, data.slug, id)
  }

  return prisma.person.update({
    where: { id, churchId },
    data,
    include: personDetailInclude,
  })
}

export async function deletePerson(churchId: string, id: string) {
  return prisma.person.update({
    where: { id, churchId },
    data: { deletedAt: new Date() },
  })
}

export async function importPeople(
  churchId: string,
  rows: Omit<Prisma.PersonUncheckedCreateInput, 'churchId'>[],
) {
  const results: { created: number; errors: { row: number; error: string }[] } = {
    created: 0,
    errors: [],
  }

  for (let i = 0; i < rows.length; i++) {
    try {
      const row = rows[i]
      if (row.slug) {
        row.slug = await ensureUniquePersonSlug(churchId, row.slug)
      }
      await prisma.person.create({
        data: { ...row, churchId },
      })
      results.created++
    } catch (error) {
      results.errors.push({
        row: i + 1,
        error: error instanceof Error ? error.message : 'Unknown error',
      })
    }
  }

  return results
}
