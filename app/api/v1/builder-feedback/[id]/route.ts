import { NextRequest, NextResponse } from 'next/server'
import { getChurchId } from '@/lib/api/get-church-id'
import { requireApiAuth } from '@/lib/api/require-auth'
import {
  getBuilderFeedback,
  updateBuilderFeedback,
  deleteBuilderFeedback,
} from '@/lib/dal/builder-feedback'

type Params = { params: Promise<{ id: string }> }

export async function GET(_request: NextRequest, { params }: Params) {
  try {
    const authResult = await requireApiAuth()
    if (!authResult.authorized) return authResult.response

    if (authResult.rolePriority < 1000) {
      return NextResponse.json(
        { success: false, error: { code: 'FORBIDDEN', message: 'Owner access required' } },
        { status: 403 },
      )
    }

    const churchId = await getChurchId()
    const { id } = await params

    const feedback = await getBuilderFeedback(churchId, id)
    if (!feedback) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Feedback not found' } },
        { status: 404 },
      )
    }

    return NextResponse.json({ success: true, data: feedback })
  } catch (error) {
    console.error('GET /api/v1/builder-feedback/[id] error:', error)
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch feedback' } },
      { status: 500 },
    )
  }
}

export async function PATCH(request: NextRequest, { params }: Params) {
  try {
    const authResult = await requireApiAuth()
    if (!authResult.authorized) return authResult.response

    if (authResult.rolePriority < 1000) {
      return NextResponse.json(
        { success: false, error: { code: 'FORBIDDEN', message: 'Owner access required' } },
        { status: 403 },
      )
    }

    const churchId = await getChurchId()
    const { id } = await params
    const body = await request.json()

    const existing = await getBuilderFeedback(churchId, id)
    if (!existing) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Feedback not found' } },
        { status: 404 },
      )
    }

    // Validate status if provided
    if (body.status !== undefined) {
      const VALID_STATUSES = ['new', 'in_progress', 'resolved', 'wont_fix', 'closed']
      if (!VALID_STATUSES.includes(body.status)) {
        return NextResponse.json(
          { success: false, error: { code: 'BAD_REQUEST', message: 'Invalid status value' } },
          { status: 400 },
        )
      }
    }

    const updated = await updateBuilderFeedback(churchId, id, {
      ...(body.status !== undefined && { status: body.status }),
      ...(body.isRead !== undefined && { isRead: body.isRead }),
      ...(body.adminNotes !== undefined && { adminNotes: body.adminNotes }),
    })

    return NextResponse.json({ success: true, data: updated })
  } catch (error) {
    console.error('PATCH /api/v1/builder-feedback/[id] error:', error)
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to update feedback' } },
      { status: 500 },
    )
  }
}

export async function DELETE(_request: NextRequest, { params }: Params) {
  try {
    const authResult = await requireApiAuth()
    if (!authResult.authorized) return authResult.response

    if (authResult.rolePriority < 1000) {
      return NextResponse.json(
        { success: false, error: { code: 'FORBIDDEN', message: 'Owner access required' } },
        { status: 403 },
      )
    }

    const churchId = await getChurchId()
    const { id } = await params

    const existing = await getBuilderFeedback(churchId, id)
    if (!existing) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Feedback not found' } },
        { status: 404 },
      )
    }

    await deleteBuilderFeedback(churchId, id)

    return NextResponse.json({ success: true, data: { deleted: true } })
  } catch (error) {
    console.error('DELETE /api/v1/builder-feedback/[id] error:', error)
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to delete feedback' } },
      { status: 500 },
    )
  }
}
