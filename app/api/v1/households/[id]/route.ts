import { NextRequest, NextResponse } from 'next/server'
import { getChurchId } from '@/lib/api/get-church-id'
import { getHouseholdById, updateHousehold, deleteHousehold } from '@/lib/dal/households'

type Params = { params: Promise<{ id: string }> }

export async function GET(_request: NextRequest, { params }: Params) {
  try {
    const churchId = await getChurchId()
    const { id } = await params

    const household = await getHouseholdById(churchId, id)
    if (!household) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Household not found' } },
        { status: 404 },
      )
    }

    return NextResponse.json({ success: true, data: household })
  } catch (error) {
    console.error('GET /api/v1/households/[id] error:', error)
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch household' } },
      { status: 500 },
    )
  }
}

export async function PUT(request: NextRequest, { params }: Params) {
  try {
    const churchId = await getChurchId()
    const { id } = await params
    const body = await request.json()

    const existing = await getHouseholdById(churchId, id)
    if (!existing) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Household not found' } },
        { status: 404 },
      )
    }

    const updated = await updateHousehold(churchId, id, body)

    return NextResponse.json({ success: true, data: updated })
  } catch (error) {
    console.error('PUT /api/v1/households/[id] error:', error)
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to update household' } },
      { status: 500 },
    )
  }
}

export async function DELETE(_request: NextRequest, { params }: Params) {
  try {
    const churchId = await getChurchId()
    const { id } = await params

    const existing = await getHouseholdById(churchId, id)
    if (!existing) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Household not found' } },
        { status: 404 },
      )
    }

    await deleteHousehold(churchId, id)

    return NextResponse.json({ success: true, data: { deleted: true } })
  } catch (error) {
    console.error('DELETE /api/v1/households/[id] error:', error)
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to delete household' } },
      { status: 500 },
    )
  }
}
