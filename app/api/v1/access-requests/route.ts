import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { requireApiAuth } from '@/lib/api/require-auth'
import { prisma } from '@/lib/db'
import { rateLimit } from '@/lib/rate-limit'
import { createAccessRequest, listAccessRequests } from '@/lib/dal/access-requests'

/**
 * POST /api/v1/access-requests
 * Submit an access request. User must be authenticated but does NOT need a church membership.
 */
export async function POST(request: Request) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json(
      { success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
      { status: 401 },
    )
  }

  // Rate limit: 3 requests per hour per user
  const { success: withinLimit } = rateLimit(`access-request:${session.user.id}`, 3, 60 * 60 * 1000)
  if (!withinLimit) {
    return NextResponse.json(
      { success: false, error: { code: 'RATE_LIMITED', message: 'Too many requests. Please try again later.' } },
      { status: 429 },
    )
  }

  // Resolve church from CHURCH_SLUG (user has no churchId in session)
  const slug = process.env.CHURCH_SLUG || 'la-ubf'
  const church = await prisma.church.findUnique({ where: { slug }, select: { id: true } })
  if (!church) {
    return NextResponse.json(
      { success: false, error: { code: 'NOT_FOUND', message: 'Church not found' } },
      { status: 404 },
    )
  }

  // Check if user already has membership
  const existing = await prisma.churchMember.findFirst({
    where: { churchId: church.id, userId: session.user.id },
  })
  if (existing) {
    return NextResponse.json(
      { success: false, error: { code: 'CONFLICT', message: 'You already have access to this church.' } },
      { status: 409 },
    )
  }

  // Check if user has an ignored request (can't resubmit while ignored)
  const existingRequest = await prisma.accessRequest.findUnique({
    where: { churchId_userId: { churchId: church.id, userId: session.user.id } },
    select: { status: true },
  })
  if (existingRequest?.status === 'IGNORED') {
    return NextResponse.json(
      { success: false, error: { code: 'CONFLICT', message: 'Your previous request is still under review.' } },
      { status: 409 },
    )
  }

  let body: Record<string, unknown> = {}
  try {
    body = await request.json()
  } catch {
    // No body is fine — message is optional
  }

  const message = typeof body.message === 'string' ? body.message.slice(0, 500) : undefined

  const result = await createAccessRequest(
    church.id,
    session.user.id,
    message,
  )

  return NextResponse.json({ success: true, data: { id: result.id, status: result.status } })
}

/**
 * GET /api/v1/access-requests
 * List access requests (admin only, requires users.approve_requests).
 */
export async function GET(request: Request) {
  const authResult = await requireApiAuth('users.approve_requests')
  if (!authResult.authorized) return authResult.response

  const { searchParams } = new URL(request.url)
  const status = searchParams.get('status') as 'PENDING' | 'APPROVED' | 'DENIED' | 'IGNORED' | null

  const data = await listAccessRequests(
    authResult.churchId,
    status || undefined,
  )

  return NextResponse.json({ success: true, data })
}
