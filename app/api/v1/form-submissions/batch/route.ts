import { NextRequest, NextResponse } from 'next/server'
import { getChurchId } from '@/lib/api/get-church-id'
import { requireApiAuth } from '@/lib/api/require-auth'
import { batchUpdateSubmissions } from '@/lib/dal/form-submissions'

export async function POST(request: NextRequest) {
  try {
    const authResult = await requireApiAuth('submissions.manage')
    if (!authResult.authorized) return authResult.response

    const churchId = await getChurchId()
    const body = await request.json()

    const { ids, action, status } = body as {
      ids: string[]
      action: 'markRead' | 'markUnread' | 'setStatus' | 'delete'
      status?: string
    }

    if (!Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json(
        { success: false, error: { code: 'BAD_REQUEST', message: 'ids must be a non-empty array' } },
        { status: 400 },
      )
    }

    if (!action || !['markRead', 'markUnread', 'setStatus', 'delete'].includes(action)) {
      return NextResponse.json(
        { success: false, error: { code: 'BAD_REQUEST', message: 'Invalid action' } },
        { status: 400 },
      )
    }

    const VALID_STATUSES = ['new', 'reviewed', 'contacted', 'archived']
    if (action === 'setStatus' && (!status || !VALID_STATUSES.includes(status))) {
      return NextResponse.json(
        { success: false, error: { code: 'BAD_REQUEST', message: 'status must be one of: new, reviewed, contacted, archived' } },
        { status: 400 },
      )
    }

    switch (action) {
      case 'markRead':
        await batchUpdateSubmissions(churchId, ids, { isRead: true })
        break
      case 'markUnread':
        await batchUpdateSubmissions(churchId, ids, { isRead: false })
        break
      case 'setStatus':
        await batchUpdateSubmissions(churchId, ids, { status })
        break
      case 'delete':
        await batchUpdateSubmissions(churchId, ids, { delete: true })
        break
    }

    return NextResponse.json({ success: true, data: { action, count: ids.length } })
  } catch (error) {
    console.error('POST /api/v1/form-submissions/batch error:', error)
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to perform batch operation' } },
      { status: 500 },
    )
  }
}
