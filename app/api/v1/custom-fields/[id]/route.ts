import { NextRequest, NextResponse } from 'next/server'
import { getChurchId } from '@/lib/api/get-church-id'
import { getCustomFieldDefinitionById, updateCustomFieldDefinition, deleteCustomFieldDefinition } from '@/lib/dal/custom-fields'

type Params = { params: Promise<{ id: string }> }

export async function PUT(request: NextRequest, { params }: Params) {
  try {
    const churchId = await getChurchId()
    const { id } = await params
    const body = await request.json()

    const existing = await getCustomFieldDefinitionById(churchId, id)
    if (!existing) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Custom field not found' } },
        { status: 404 },
      )
    }

    const updated = await updateCustomFieldDefinition(churchId, id, body)

    return NextResponse.json({ success: true, data: updated })
  } catch (error) {
    console.error('PUT /api/v1/custom-fields/[id] error:', error)
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to update custom field' } },
      { status: 500 },
    )
  }
}

export async function DELETE(_request: NextRequest, { params }: Params) {
  try {
    const churchId = await getChurchId()
    const { id } = await params

    const existing = await getCustomFieldDefinitionById(churchId, id)
    if (!existing) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Custom field not found' } },
        { status: 404 },
      )
    }

    await deleteCustomFieldDefinition(churchId, id)

    return NextResponse.json({ success: true, data: { deleted: true } })
  } catch (error) {
    console.error('DELETE /api/v1/custom-fields/[id] error:', error)
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to delete custom field' } },
      { status: 500 },
    )
  }
}
