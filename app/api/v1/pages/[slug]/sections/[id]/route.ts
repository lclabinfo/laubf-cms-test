import { NextRequest, NextResponse } from 'next/server'
import { getChurchId } from '@/lib/api/get-church-id'
import { updatePageSection, deletePageSection } from '@/lib/dal/pages'

type Params = { params: Promise<{ slug: string; id: string }> }

export async function PATCH(request: NextRequest, { params }: Params) {
  try {
    const churchId = await getChurchId()
    const { id } = await params
    const body = await request.json()

    const updated = await updatePageSection(churchId, id, body)
    return NextResponse.json({ success: true, data: updated })
  } catch (error) {
    console.error('PATCH /api/v1/pages/[slug]/sections/[id] error:', error)
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to update section' } },
      { status: 500 },
    )
  }
}

export async function DELETE(_request: NextRequest, { params }: Params) {
  try {
    const churchId = await getChurchId()
    const { id } = await params

    await deletePageSection(churchId, id)
    return NextResponse.json({ success: true, data: { deleted: true } })
  } catch (error) {
    console.error('DELETE /api/v1/pages/[slug]/sections/[id] error:', error)
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to delete section' } },
      { status: 500 },
    )
  }
}
