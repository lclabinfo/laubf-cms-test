import { NextRequest, NextResponse } from 'next/server'
import { getChurchId } from '@/lib/api/get-church-id'
import { deleteDomain } from '@/lib/dal/domains'
import { requireApiAuth } from '@/lib/api/require-auth'

type Params = { params: Promise<{ id: string }> }

export async function DELETE(_request: NextRequest, { params }: Params) {
  try {
    const authResult = await requireApiAuth('OWNER')
    if (!authResult.authorized) return authResult.response

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
