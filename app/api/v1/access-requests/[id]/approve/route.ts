import { NextResponse } from 'next/server'
import { requireApiAuth } from '@/lib/api/require-auth'
import { approveAccessRequest } from '@/lib/dal/access-requests'
import { prisma } from '@/lib/db'

/**
 * POST /api/v1/access-requests/[id]/approve
 * Approve a pending access request (creates ChurchMember with VIEWER role).
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const authResult = await requireApiAuth('users.approve_requests')
  if (!authResult.authorized) return authResult.response
  const { id } = await params

  // Verify request exists and belongs to this church
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

  let body: Record<string, unknown> = {}
  try {
    body = await request.json()
  } catch {
    // No body is fine
  }

  try {
    const result = await approveAccessRequest(
      id,
      authResult.userId,
      (body.note as string) || undefined,
    )
    return NextResponse.json({ success: true, data: result })
  } catch {
    return NextResponse.json(
      { success: false, error: { code: 'CONFLICT', message: 'Request already reviewed' } },
      { status: 409 },
    )
  }
}
