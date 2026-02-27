import { NextRequest, NextResponse } from 'next/server'
import { getChurchId } from '@/lib/api/get-church-id'
import { getPersonById } from '@/lib/dal/people'
import { getPersonNotes, createPersonNote, type PersonNoteFilters } from '@/lib/dal/person-notes'
import { type NoteType } from '@/lib/generated/prisma/client'

type Params = { params: Promise<{ id: string }> }

export async function GET(request: NextRequest, { params }: Params) {
  try {
    const churchId = await getChurchId()
    const { id } = await params
    const { searchParams } = request.nextUrl

    const person = await getPersonById(churchId, id)
    if (!person) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Person not found' } },
        { status: 404 },
      )
    }

    const filters: PersonNoteFilters & { page?: number; pageSize?: number } = {
      page: searchParams.get('page') ? Number(searchParams.get('page')) : undefined,
      pageSize: searchParams.get('pageSize') ? Number(searchParams.get('pageSize')) : undefined,
      noteType: (searchParams.get('noteType') as NoteType) ?? undefined,
      isPinned: searchParams.get('isPinned') ? searchParams.get('isPinned') === 'true' : undefined,
    }

    const result = await getPersonNotes(id, filters)

    return NextResponse.json({
      success: true,
      data: result.data,
      pagination: {
        total: result.total,
        page: result.page,
        pageSize: result.pageSize,
        totalPages: result.totalPages,
      },
    })
  } catch (error) {
    console.error('GET /api/v1/people/[id]/notes error:', error)
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch notes' } },
      { status: 500 },
    )
  }
}

export async function POST(request: NextRequest, { params }: Params) {
  try {
    const churchId = await getChurchId()
    const { id } = await params
    const body = await request.json()

    const person = await getPersonById(churchId, id)
    if (!person) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Person not found' } },
        { status: 404 },
      )
    }

    if (!body.content) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: 'content is required' } },
        { status: 400 },
      )
    }

    if (!body.authorId) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: 'authorId is required' } },
        { status: 400 },
      )
    }

    const note = await createPersonNote(churchId, id, body.authorId, {
      noteType: body.noteType,
      content: body.content,
      isPinned: body.isPinned,
      isPrivate: body.isPrivate,
    })

    return NextResponse.json({ success: true, data: note }, { status: 201 })
  } catch (error) {
    console.error('POST /api/v1/people/[id]/notes error:', error)
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to create note' } },
      { status: 500 },
    )
  }
}
