import { prisma } from '@/lib/db'
import { Prisma, type NoteType } from '@/lib/generated/prisma/client'
import { paginationArgs, paginatedResult, type PaginationParams, type PaginatedResult } from './types'

type PersonNoteWithAuthor = Prisma.PersonNoteGetPayload<{
  include: { author: true }
}>

const noteInclude = {
  author: true,
} satisfies Prisma.PersonNoteInclude

export type PersonNoteFilters = {
  noteType?: NoteType
  isPinned?: boolean
}

export async function getPersonNotes(
  personId: string,
  filters?: PersonNoteFilters & PaginationParams,
): Promise<PaginatedResult<PersonNoteWithAuthor>> {
  const { skip, take, page, pageSize } = paginationArgs(filters)

  const where: Prisma.PersonNoteWhereInput = {
    personId,
    ...(filters?.noteType && { noteType: filters.noteType }),
    ...(filters?.isPinned !== undefined && { isPinned: filters.isPinned }),
  }

  const [data, total] = await Promise.all([
    prisma.personNote.findMany({
      where,
      include: noteInclude,
      orderBy: [{ isPinned: 'desc' }, { createdAt: 'desc' }],
      skip,
      take,
    }),
    prisma.personNote.count({ where }),
  ])

  return paginatedResult(data, total, page, pageSize)
}

export async function getPersonNoteById(
  id: string,
) {
  return prisma.personNote.findUnique({
    where: { id },
    include: noteInclude,
  })
}

export async function createPersonNote(
  churchId: string,
  personId: string,
  authorId: string,
  data: {
    noteType?: NoteType
    content: string
    isPinned?: boolean
    isPrivate?: boolean
  },
) {
  return prisma.personNote.create({
    data: {
      churchId,
      personId,
      authorId,
      noteType: data.noteType ?? 'GENERAL',
      content: data.content,
      isPinned: data.isPinned ?? false,
      isPrivate: data.isPrivate ?? false,
    },
    include: noteInclude,
  })
}

export async function updatePersonNote(
  id: string,
  data: Prisma.PersonNoteUncheckedUpdateInput,
) {
  return prisma.personNote.update({
    where: { id },
    data,
    include: noteInclude,
  })
}

export async function deletePersonNote(id: string) {
  return prisma.personNote.delete({
    where: { id },
  })
}
