import { NextResponse } from 'next/server'
import { requireApiAuth } from '@/lib/api/require-auth'
import { restoreAccessRequest } from '@/lib/dal/access-requests'
import { prisma } from '@/lib/db'

/**
 * POST /api/v1/access-requests/[id]/restore
 * Restore an ignored access request back to pending.
 */
export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const authResult = await requireApiAuth('users.approve_requests')
  if (!authResult.authorized) return authResult.response
  const { id } = await params

  const accessRequest = await prisma.accessRequest.findUnique({
    where: { id },
    select: { churchId: true },
  })

  if (!accessRequest || accessRequest.churchId !== authResult.churchId) {
    return NextResponse.json(
      { success: false, error: { code: 'NOT_FOUND', message: 'Access request not found' } },
      { status: 404 },
    )
  }

  try {
    const result = await restoreAccessRequest(id)
    return NextResponse.json({ success: true, data: result })
  } catch {
    return NextResponse.json(
      { success: false, error: { code: 'CONFLICT', message: 'Request not ignored' } },
      { status: 409 },
    )
  }
}
