import { NextRequest, NextResponse } from 'next/server'
import { getChurchId } from '@/lib/api/get-church-id'
import { deleteDomain } from '@/lib/dal/domains'

type Params = { params: Promise<{ id: string }> }

export async function DELETE(_request: NextRequest, { params }: Params) {
  try {
    const churchId = await getChurchId()
    const { id } = await params

    await deleteDomain(churchId, id)
    return NextResponse.json({ success: true, data: { deleted: true } })
  } catch (error) {
    console.error('DELETE /api/v1/domains/[id] error:', error)
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to delete domain' } },
      { status: 500 },
    )
  }
}
