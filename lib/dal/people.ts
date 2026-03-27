import { prisma } from '@/lib/db'
import { Prisma, type MembershipStatus } from '@/lib/generated/prisma/client'
import { paginationArgs, paginatedResult, type PaginationParams, type PaginatedResult } from './types'

const personListInclude = {
  householdMemberships: {
    select: {
      role: true,
      household: { select: { id: true, name: true } },
    },
  },
  roleAssignments: {
    select: {
      role: { select: { id: true, name: true } },
    },
  },
} satisfies Prisma.PersonInclude

type PersonWithRelations = Prisma.PersonGetPayload<{
  include: typeof personListInclude
}>

const personDetailInclude = {
  ...personListInclude,
  communicationPreferences: { take: 50 },
  customFieldValues: {
    include: { fieldDefinition: true },
    take: 50,
  },
} satisfies Prisma.PersonInclude

type PersonDetail = Prisma.PersonGetPayload<{
  include: typeof personDetailInclude
}>

export type PersonFilters = {
  search?: string
  membershipStatus?: MembershipStatus | null
  householdId?: string
}

function buildSearchFilter(search: string): Prisma.PersonWhereInput {
  const trimmed = search.trim()
  if (!trimmed) return {}

  const singleTermConditions: Prisma.PersonWhereInput[] = [
    { firstName: { contains: trimmed, mode: 'insensitive' } },
    { lastName: { contains: trimmed, mode: 'insensitive' } },
    { preferredName: { contains: trimmed, mode: 'insensitive' } },
    { email: { contains: trimmed, mode: 'insensitive' } },
    { phone: { contains: trimmed, mode: 'insensitive' } },
    { mobilePhone: { contains: trimmed, mode: 'insensitive' } },
    { roleAssignments: { some: { role: { name: { contains: trimmed, mode: 'insensitive' } } } } },
  ]

  const words = trimmed.split(/\s+/).filter(Boolean)

  if (words.length > 1) {
    // Multi-word: match all words across firstName + lastName (e.g., "David Lim")
    const crossFieldCondition: Prisma.PersonWhereInput = {
      AND: words.map((word) => ({
        OR: [
          { firstName: { contains: word, mode: 'insensitive' as const } },
          { lastName: { contains: word, mode: 'insensitive' as const } },
          { preferredName: { contains: word, mode: 'insensitive' as const } },
        ],
      })),
    }

    return { OR: [...singleTermConditions, crossFieldCondition] }
  }

  return { OR: singleTermConditions }
}

export async function getPeople(
  churchId: string,
  filters?: PersonFilters & PaginationParams,
): Promise<PaginatedResult<PersonWithRelations>> {
  const { skip, take, page, pageSize } = paginationArgs(filters)

  // When filtering by ARCHIVED status, include soft-deleted records
  const isArchived = filters?.membershipStatus === 'ARCHIVED'
  const where: Prisma.PersonWhereInput = {
    churchId,
    ...(isArchived ? {} : { deletedAt: null }),
    ...(filters?.membershipStatus && { membershipStatus: filters.membershipStatus }),
    ...(filters?.householdId && {
      householdMemberships: { some: { householdId: filters.householdId } },
    }),
    ...(filters?.search && buildSearchFilter(filters.search)),
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
  // Include archived/soft-deleted records so they can be viewed/restored
  return prisma.person.findFirst({
    where: { id, churchId },
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

  // When restoring from ARCHIVED, clear the soft-delete timestamp
  if (data.membershipStatus && data.membershipStatus !== 'ARCHIVED') {
    data.deletedAt = null
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
    data: { deletedAt: new Date(), membershipStatus: 'ARCHIVED' },
  })
}

export async function permanentDeletePerson(churchId: string, id: string) {
  // Delete related records first to avoid FK constraint errors
  await prisma.personRoleAssignment.deleteMany({ where: { person: { id, churchId } } })
  await prisma.communicationPreference.deleteMany({ where: { person: { id, churchId } } })
  await prisma.customFieldValue.deleteMany({ where: { person: { id, churchId } } })
  await prisma.personNote.deleteMany({ where: { personId: id, churchId } })
  await prisma.householdMember.deleteMany({ where: { person: { id, churchId } } })
  return prisma.person.delete({ where: { id, churchId } })
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
