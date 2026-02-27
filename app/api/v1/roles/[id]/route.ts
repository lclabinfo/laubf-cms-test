import { NextRequest, NextResponse } from 'next/server'
import { getChurchId } from '@/lib/api/get-church-id'
import { getRoleDefinitionById, updateRoleDefinition, deleteRoleDefinition } from '@/lib/dal/person-roles'

type Params = { params: Promise<{ id: string }> }

export async function PUT(request: NextRequest, { params }: Params) {
  try {
    const churchId = await getChurchId()
    const { id } = await params
    const body = await request.json()

    const existing = await getRoleDefinitionById(churchId, id)
    if (!existing) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Role not found' } },
        { status: 404 },
      )
    }

    const updated = await updateRoleDefinition(churchId, id, body)

    return NextResponse.json({ success: true, data: updated })
  } catch (error) {
    console.error('PUT /api/v1/roles/[id] error:', error)
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to update role' } },
      { status: 500 },
    )
  }
}

export async function DELETE(_request: NextRequest, { params }: Params) {
  try {
    const churchId = await getChurchId()
    const { id } = await params

    try {
      await deleteRoleDefinition(churchId, id)
    } catch (error) {
      if (error instanceof Error) {
        if (error.message === 'Role definition not found') {
          return NextResponse.json(
            { success: false, error: { code: 'NOT_FOUND', message: 'Role not found' } },
            { status: 404 },
          )
        }
        if (error.message === 'Cannot delete a system role') {
          return NextResponse.json(
            { success: false, error: { code: 'FORBIDDEN', message: 'Cannot delete a system role' } },
            { status: 403 },
          )
        }
      }
      throw error
    }

    return NextResponse.json({ success: true, data: { deleted: true } })
  } catch (error) {
    console.error('DELETE /api/v1/roles/[id] error:', error)
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to delete role' } },
      { status: 500 },
    )
  }
}
