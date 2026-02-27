import { NextRequest, NextResponse } from 'next/server'
import { getChurchId } from '@/lib/api/get-church-id'
import { getPersonById, updatePerson, deletePerson } from '@/lib/dal/people'

type Params = { params: Promise<{ id: string }> }

export async function GET(_request: NextRequest, { params }: Params) {
  try {
    const churchId = await getChurchId()
    const { id } = await params

    const person = await getPersonById(churchId, id)
    if (!person) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Person not found' } },
        { status: 404 },
      )
    }

    return NextResponse.json({ success: true, data: person })
  } catch (error) {
    console.error('GET /api/v1/people/[id] error:', error)
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch person' } },
      { status: 500 },
    )
  }
}

export async function PUT(request: NextRequest, { params }: Params) {
  try {
    const churchId = await getChurchId()
    const { id } = await params
    const body = await request.json()

    const existing = await getPersonById(churchId, id)
    if (!existing) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Person not found' } },
        { status: 404 },
      )
    }

    const updated = await updatePerson(churchId, id, body)

    return NextResponse.json({ success: true, data: updated })
  } catch (error) {
    console.error('PUT /api/v1/people/[id] error:', error)
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to update person' } },
      { status: 500 },
    )
  }
}

export async function DELETE(_request: NextRequest, { params }: Params) {
  try {
    const churchId = await getChurchId()
    const { id } = await params

    const existing = await getPersonById(churchId, id)
    if (!existing) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Person not found' } },
        { status: 404 },
      )
    }

    await deletePerson(churchId, id)

    return NextResponse.json({ success: true, data: { deleted: true } })
  } catch (error) {
    console.error('DELETE /api/v1/people/[id] error:', error)
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to delete person' } },
      { status: 500 },
    )
  }
}
