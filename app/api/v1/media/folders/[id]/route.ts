import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { getChurchId } from '@/lib/api/get-church-id'
import { renameFolder, deleteFolder } from '@/lib/dal/media'

// ---------------------------------------------------------------------------
// PATCH /api/v1/media/folders/[id] — Rename a folder
// ---------------------------------------------------------------------------

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
        { status: 401 },
      )
    }

    const churchId = await getChurchId()
    const { id } = await params
    const body = await request.json()
    const { name } = body as { name?: string }

    if (!name || typeof name !== 'string' || !name.trim()) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: 'name is required' } },
        { status: 400 },
      )
    }

    const folder = await renameFolder(churchId, id, name.trim())
    if (!folder) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Folder not found' } },
        { status: 404 },
      )
    }

    return NextResponse.json({ success: true, data: { id: folder.id, name: folder.name } })
  } catch (error: unknown) {
    if (error && typeof error === 'object' && 'code' in error && (error as { code: string }).code === 'P2002') {
      return NextResponse.json(
        { success: false, error: { code: 'DUPLICATE', message: 'A folder with this name already exists' } },
        { status: 409 },
      )
    }
    console.error('PATCH /api/v1/media/folders/[id] error:', error)
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to rename folder' } },
      { status: 500 },
    )
  }
}

// ---------------------------------------------------------------------------
// DELETE /api/v1/media/folders/[id] — Delete a folder (items moved to root)
// ---------------------------------------------------------------------------

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
        { status: 401 },
      )
    }

    const churchId = await getChurchId()
    const { id } = await params

    const deleted = await deleteFolder(churchId, id)
    if (!deleted) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Folder not found' } },
        { status: 404 },
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('DELETE /api/v1/media/folders/[id] error:', error)
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to delete folder' } },
      { status: 500 },
    )
  }
}
