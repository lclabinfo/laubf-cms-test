import { NextRequest, NextResponse } from 'next/server'
import { getChurchId } from '@/lib/api/get-church-id'
import { getHouseholdById, addHouseholdMember, removeHouseholdMember } from '@/lib/dal/households'

type Params = { params: Promise<{ id: string }> }

export async function POST(request: NextRequest, { params }: Params) {
  try {
    const churchId = await getChurchId()
    const { id } = await params
    const body = await request.json()

    const household = await getHouseholdById(churchId, id)
    if (!household) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Household not found' } },
        { status: 404 },
      )
    }

    if (!body.personId) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: 'personId is required' } },
        { status: 400 },
      )
    }

    const member = await addHouseholdMember(id, body.personId, body.role)

    return NextResponse.json({ success: true, data: member }, { status: 201 })
  } catch (error) {
    console.error('POST /api/v1/households/[id]/members error:', error)
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to add household member' } },
      { status: 500 },
    )
  }
}

export async function DELETE(request: NextRequest, { params }: Params) {
  try {
    const churchId = await getChurchId()
    const { id } = await params
    const body = await request.json()

    const household = await getHouseholdById(churchId, id)
    if (!household) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Household not found' } },
        { status: 404 },
      )
    }

    if (!body.personId) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: 'personId is required' } },
        { status: 400 },
      )
    }

    await removeHouseholdMember(id, body.personId)

    return NextResponse.json({ success: true, data: { removed: true } })
  } catch (error) {
    console.error('DELETE /api/v1/households/[id]/members error:', error)
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to remove household member' } },
      { status: 500 },
    )
  }
}
