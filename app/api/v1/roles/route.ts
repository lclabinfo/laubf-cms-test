import { NextRequest, NextResponse } from 'next/server'
import { getChurchId } from '@/lib/api/get-church-id'
import { getRoleDefinitions, createRoleDefinition } from '@/lib/dal/person-roles'

export async function GET() {
  try {
    const churchId = await getChurchId()

    const roles = await getRoleDefinitions(churchId)

    return NextResponse.json({ success: true, data: roles })
  } catch (error) {
    console.error('GET /api/v1/roles error:', error)
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch roles' } },
      { status: 500 },
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const churchId = await getChurchId()
    const body = await request.json()

    if (!body.name || !body.slug) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: 'name and slug are required' } },
        { status: 400 },
      )
    }

    const role = await createRoleDefinition(churchId, body)

    return NextResponse.json({ success: true, data: role }, { status: 201 })
  } catch (error) {
    console.error('POST /api/v1/roles error:', error)
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to create role' } },
      { status: 500 },
    )
  }
}
