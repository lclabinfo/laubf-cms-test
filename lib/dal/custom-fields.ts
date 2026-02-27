import { prisma } from '@/lib/db'
import { Prisma } from '@/lib/generated/prisma/client'
import { paginationArgs, paginatedResult, type PaginationParams, type PaginatedResult } from './types'

type CustomFieldDefinitionWithValues = Prisma.CustomFieldDefinitionGetPayload<{
  include: { values: true }
}>

export async function getCustomFieldDefinitions(
  churchId: string,
  filters?: PaginationParams & { section?: string },
): Promise<PaginatedResult<CustomFieldDefinitionWithValues>> {
  const { skip, take, page, pageSize } = paginationArgs(filters)

  const where: Prisma.CustomFieldDefinitionWhereInput = {
    churchId,
    ...(filters?.section && { section: filters.section }),
  }

  const [data, total] = await Promise.all([
    prisma.customFieldDefinition.findMany({
      where,
      include: { values: true },
      orderBy: [{ section: 'asc' }, { sortOrder: 'asc' }],
      skip,
      take,
    }),
    prisma.customFieldDefinition.count({ where }),
  ])

  return paginatedResult(data, total, page, pageSize)
}

export async function getCustomFieldDefinitionById(
  churchId: string,
  id: string,
) {
  return prisma.customFieldDefinition.findFirst({
    where: { id, churchId },
    include: { values: true },
  })
}

export async function createCustomFieldDefinition(
  churchId: string,
  data: Omit<Prisma.CustomFieldDefinitionUncheckedCreateInput, 'churchId'>,
) {
  return prisma.customFieldDefinition.create({
    data: { ...data, churchId },
  })
}

export async function updateCustomFieldDefinition(
  churchId: string,
  id: string,
  data: Prisma.CustomFieldDefinitionUncheckedUpdateInput,
) {
  return prisma.customFieldDefinition.update({
    where: { id, churchId },
    data,
  })
}

export async function deleteCustomFieldDefinition(
  churchId: string,
  id: string,
) {
  return prisma.customFieldDefinition.delete({
    where: { id, churchId },
  })
}

export async function getCustomFieldValues(personId: string) {
  return prisma.customFieldValue.findMany({
    where: { personId },
    include: { fieldDefinition: true },
    orderBy: { fieldDefinition: { sortOrder: 'asc' } },
  })
}

export async function setCustomFieldValue(
  personId: string,
  fieldDefinitionId: string,
  value: string,
) {
  return prisma.customFieldValue.upsert({
    where: { personId_fieldDefinitionId: { personId, fieldDefinitionId } },
    update: { value },
    create: { personId, fieldDefinitionId, value },
    include: { fieldDefinition: true },
  })
}

export async function deleteCustomFieldValue(
  personId: string,
  fieldDefinitionId: string,
) {
  return prisma.customFieldValue.delete({
    where: { personId_fieldDefinitionId: { personId, fieldDefinitionId } },
  })
}
