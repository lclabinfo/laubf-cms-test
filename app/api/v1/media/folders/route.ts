import { NextRequest, NextResponse } from 'next/server'
import { getChurchId } from '@/lib/api/get-church-id'
import { requireApiAuth } from '@/lib/api/require-auth'
import { listFolders, createFolder, getFolderCounts, getMediaCounts } from '@/lib/dal/media'

// ---------------------------------------------------------------------------
// GET /api/v1/media/folders — List folders with item counts
// ---------------------------------------------------------------------------

export async function GET() {
  try {
    const authResult = await requireApiAuth('media.view')
    if (!authResult.authorized) return authResult.response

    const churchId = await getChurchId()
    const [folders, folderCounts, mediaCounts] = await Promise.all([
      listFolders(churchId),
      getFolderCounts(churchId),
      getMediaCounts(churchId),
    ])

    const data = {
      folders: folders.map(f => ({
        id: f.id,
        name: f.name,
        count: folderCounts[f.name] ?? 0,
      })),
      mediaCounts,
    }

    return NextResponse.json({ success: true, data })
  } catch (error) {
    console.error('GET /api/v1/media/folders error:', error)
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to list folders' } },
      { status: 500 },
    )
  }
}

// ---------------------------------------------------------------------------
// POST /api/v1/media/folders — Create a folder
// ---------------------------------------------------------------------------

export async function POST(request: NextRequest) {
  try {
    const authResult = await requireApiAuth('media.manage_folders')
    if (!authResult.authorized) return authResult.response

    const churchId = await getChurchId()
    const body = await request.json()
    const { name } = body as { name?: string }

    if (!name || typeof name !== 'string' || !name.trim()) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: 'name is required' } },
        { status: 400 },
      )
    }

    const folder = await createFolder(churchId, name.trim())
    return NextResponse.json({ success: true, data: { id: folder.id, name: folder.name, count: 0 } }, { status: 201 })
  } catch (error: unknown) {
    // Unique constraint violation (duplicate folder name)
    if (error && typeof error === 'object' && 'code' in error && (error as { code: string }).code === 'P2002') {
      return NextResponse.json(
        { success: false, error: { code: 'DUPLICATE', message: 'A folder with this name already exists' } },
        { status: 409 },
      )
    }
    console.error('POST /api/v1/media/folders error:', error)
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to create folder' } },
      { status: 500 },
    )
  }
}
