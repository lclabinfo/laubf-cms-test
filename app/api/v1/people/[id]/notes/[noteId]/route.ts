import { NextRequest, NextResponse } from 'next/server'
import { getPersonNoteById, updatePersonNote, deletePersonNote } from '@/lib/dal/person-notes'

type Params = { params: Promise<{ id: string; noteId: string }> }

export async function PUT(request: NextRequest, { params }: Params) {
  try {
    const { noteId } = await params
    const body = await request.json()

    const existing = await getPersonNoteById(noteId)
    if (!existing) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Note not found' } },
        { status: 404 },
      )
    }

    const updated = await updatePersonNote(noteId, body)

    return NextResponse.json({ success: true, data: updated })
  } catch (error) {
    console.error('PUT /api/v1/people/[id]/notes/[noteId] error:', error)
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to update note' } },
      { status: 500 },
    )
  }
}

export async function DELETE(_request: NextRequest, { params }: Params) {
  try {
    const { noteId } = await params

    const existing = await getPersonNoteById(noteId)
    if (!existing) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Note not found' } },
        { status: 404 },
      )
    }

    await deletePersonNote(noteId)

    return NextResponse.json({ success: true, data: { deleted: true } })
  } catch (error) {
    console.error('DELETE /api/v1/people/[id]/notes/[noteId] error:', error)
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to delete note' } },
      { status: 500 },
    )
  }
}
