import { NextRequest, NextResponse } from 'next/server'
import { getChurchId } from '@/lib/api/get-church-id'
import { requireApiAuth } from '@/lib/api/require-auth'
import { getSubmission, updateSubmission, deleteSubmission } from '@/lib/dal/form-submissions'

type Params = { params: Promise<{ id: string }> }

export async function GET(_request: NextRequest, { params }: Params) {
  try {
    const authResult = await requireApiAuth('VIEWER')
    if (!authResult.authorized) return authResult.response

    const churchId = await getChurchId()
    const { id } = await params

    const submission = await getSubmission(churchId, id)
    if (!submission) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Submission not found' } },
        { status: 404 },
      )
    }

    return NextResponse.json({ success: true, data: submission })
  } catch (error) {
    console.error('GET /api/v1/form-submissions/[id] error:', error)
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch submission' } },
      { status: 500 },
    )
  }
}

export async function PATCH(request: NextRequest, { params }: Params) {
  try {
    const authResult = await requireApiAuth('EDITOR')
    if (!authResult.authorized) return authResult.response

    const churchId = await getChurchId()
    const { id } = await params
    const body = await request.json()

    const existing = await getSubmission(churchId, id)
    if (!existing) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Submission not found' } },
        { status: 404 },
      )
    }

    const updated = await updateSubmission(churchId, id, {
      ...(body.notes !== undefined && { notes: body.notes }),
      ...(body.isRead !== undefined && { isRead: body.isRead }),
      ...(body.assignedTo !== undefined && { assignedTo: body.assignedTo }),
    })

    return NextResponse.json({ success: true, data: updated })
  } catch (error) {
    console.error('PATCH /api/v1/form-submissions/[id] error:', error)
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to update submission' } },
      { status: 500 },
    )
  }
}

export async function DELETE(_request: NextRequest, { params }: Params) {
  try {
    const authResult = await requireApiAuth('ADMIN')
    if (!authResult.authorized) return authResult.response

    const churchId = await getChurchId()
    const { id } = await params

    const existing = await getSubmission(churchId, id)
    if (!existing) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Submission not found' } },
        { status: 404 },
      )
    }

    await deleteSubmission(churchId, id)

    return NextResponse.json({ success: true, data: { deleted: true } })
  } catch (error) {
    console.error('DELETE /api/v1/form-submissions/[id] error:', error)
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to delete submission' } },
      { status: 500 },
    )
  }
}
