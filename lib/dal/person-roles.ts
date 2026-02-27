import { prisma } from '@/lib/db'
import { Prisma } from '@/lib/generated/prisma/client'

type RoleDefinitionWithAssignments = Prisma.PersonRoleDefinitionGetPayload<{
  include: { assignments: { include: { person: true } } }
}>

const roleDetailInclude = {
  assignments: {
    include: { person: true },
  },
} satisfies Prisma.PersonRoleDefinitionInclude

export async function getRoleDefinitions(
  churchId: string,
): Promise<RoleDefinitionWithAssignments[]> {
  return prisma.personRoleDefinition.findMany({
    where: { churchId },
    include: roleDetailInclude,
    orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
  })
}

export async function getRoleDefinitionById(
  churchId: string,
  id: string,
) {
  return prisma.personRoleDefinition.findFirst({
    where: { id, churchId },
    include: roleDetailInclude,
  })
}

export async function getRoleDefinitionBySlug(
  churchId: string,
  slug: string,
) {
  return prisma.personRoleDefinition.findUnique({
    where: { churchId_slug: { churchId, slug } },
    include: roleDetailInclude,
  })
}

export async function createRoleDefinition(
  churchId: string,
  data: Omit<Prisma.PersonRoleDefinitionUncheckedCreateInput, 'churchId'>,
) {
  return prisma.personRoleDefinition.create({
    data: { ...data, churchId },
    include: roleDetailInclude,
  })
}

export async function updateRoleDefinition(
  churchId: string,
  id: string,
  data: Prisma.PersonRoleDefinitionUncheckedUpdateInput,
) {
  const existing = await prisma.personRoleDefinition.findFirst({
    where: { id, churchId },
  })

  if (!existing) {
    throw new Error('Role definition not found')
  }

  // Block name/slug changes on system roles
  if (existing.isSystem) {
    delete data.name
    delete data.slug
    delete data.isSystem
  }

  return prisma.personRoleDefinition.update({
    where: { id, churchId },
    data,
    include: roleDetailInclude,
  })
}

export async function deleteRoleDefinition(
  churchId: string,
  id: string,
) {
  const existing = await prisma.personRoleDefinition.findFirst({
    where: { id, churchId },
  })

  if (!existing) {
    throw new Error('Role definition not found')
  }

  if (existing.isSystem) {
    throw new Error('Cannot delete a system role')
  }

  return prisma.personRoleDefinition.delete({
    where: { id, churchId },
  })
}

export async function assignRole(
  personId: string,
  roleId: string,
  data?: { title?: string; startDate?: Date; endDate?: Date },
) {
  return prisma.personRoleAssignment.create({
    data: {
      personId,
      roleId,
      title: data?.title,
      startDate: data?.startDate,
      endDate: data?.endDate,
    },
    include: { role: true, person: true },
  })
}

export async function removeRole(
  personId: string,
  roleId: string,
) {
  return prisma.personRoleAssignment.delete({
    where: { personId_roleId: { personId, roleId } },
  })
}

export async function getPersonRoles(personId: string) {
  return prisma.personRoleAssignment.findMany({
    where: { personId },
    include: { role: true },
    orderBy: { role: { sortOrder: 'asc' } },
  })
}

export async function getPeopleByRole(
  churchId: string,
  roleSlug: string,
) {
  const role = await prisma.personRoleDefinition.findUnique({
    where: { churchId_slug: { churchId, slug: roleSlug } },
  })

  if (!role) return []

  const assignments = await prisma.personRoleAssignment.findMany({
    where: { roleId: role.id },
    include: {
      person: {
        include: {
          personTags: true,
          roleAssignments: { include: { role: true } },
        },
      },
    },
    orderBy: { person: { lastName: 'asc' } },
  })

  return assignments.map((a) => ({
    ...a.person,
    roleTitle: a.title,
    roleStartDate: a.startDate,
    roleEndDate: a.endDate,
  }))
}
