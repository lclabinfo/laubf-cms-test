import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getChurchId } from '@/lib/api/get-church-id'
import { requireApiAuth } from '@/lib/api/require-auth'
import { getSubmission, updateSubmission, deleteSubmission, addActivityLog } from '@/lib/dal/form-submissions'

type Params = { params: Promise<{ id: string }> }

export async function GET(_request: NextRequest, { params }: Params) {
  try {
    const authResult = await requireApiAuth('submissions.view')
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
    const authResult = await requireApiAuth('submissions.manage')
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

    // Look up user name for activity log
    const user = await prisma.user.findUnique({
      where: { id: authResult.userId },
      select: { firstName: true, lastName: true },
    })
    const userName = user ? [user.firstName, user.lastName].filter(Boolean).join(' ') : 'Unknown'

    await updateSubmission(churchId, id, {
      ...(body.notes !== undefined && { notes: body.notes }),
      ...(body.isRead !== undefined && { isRead: body.isRead }),
      ...(body.assignedTo !== undefined && { assignedTo: body.assignedTo }),
      ...(body.status !== undefined && { status: body.status }),
    })

    // Auto-add activity log entries for status changes and notes
    if (body.status !== undefined && body.status !== existing.status) {
      await addActivityLog(churchId, id, {
        userId: authResult.userId,
        userName,
        action: 'status_change',
        content: `Changed status from "${existing.status}" to "${body.status}"`,
        createdAt: new Date().toISOString(),
      })
    }
    if (body.notes !== undefined && body.notes !== existing.notes) {
      await addActivityLog(churchId, id, {
        userId: authResult.userId,
        userName,
        action: 'note_added',
        content: body.notes,
        createdAt: new Date().toISOString(),
      })
    }

    // Re-fetch to include the latest activity log
    const final = await getSubmission(churchId, id)
    return NextResponse.json({ success: true, data: final })
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
    const authResult = await requireApiAuth('submissions.manage')
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
