import { NextRequest, NextResponse } from 'next/server'
import { getChurchId } from '@/lib/api/get-church-id'
import { getPersonById } from '@/lib/dal/people'
import { getPersonRoles, assignRole, removeRole } from '@/lib/dal/person-roles'

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

    const roles = await getPersonRoles(id)

    return NextResponse.json({ success: true, data: roles })
  } catch (error) {
    console.error('GET /api/v1/people/[id]/roles error:', error)
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch roles' } },
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

    if (!body.roleId) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: 'roleId is required' } },
        { status: 400 },
      )
    }

    const assignment = await assignRole(id, body.roleId, {
      title: body.title,
      startDate: body.startDate ? new Date(body.startDate) : undefined,
      endDate: body.endDate ? new Date(body.endDate) : undefined,
    })

    return NextResponse.json({ success: true, data: assignment }, { status: 201 })
  } catch (error) {
    console.error('POST /api/v1/people/[id]/roles error:', error)
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to assign role' } },
      { status: 500 },
    )
  }
}

export async function DELETE(request: NextRequest, { params }: Params) {
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

    if (!body.roleId) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: 'roleId is required' } },
        { status: 400 },
      )
    }

    await removeRole(id, body.roleId)

    return NextResponse.json({ success: true, data: { removed: true } })
  } catch (error) {
    console.error('DELETE /api/v1/people/[id]/roles error:', error)
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to remove role' } },
      { status: 500 },
    )
  }
}
