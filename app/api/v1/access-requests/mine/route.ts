import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { getAccessRequestByUser, isAccessRevoked } from '@/lib/dal/access-requests'

/**
 * GET /api/v1/access-requests/mine
 * Get the current user's access request status. No church membership required.
 * If access was previously approved but membership was revoked, returns REVOKED.
 */
export async function GET() {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json(
      { success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
      { status: 401 },
    )
  }

  const slug = process.env.CHURCH_SLUG || 'la-ubf'
  const church = await prisma.church.findUnique({ where: { slug }, select: { id: true } })
  if (!church) {
    return NextResponse.json(
      { success: false, error: { code: 'NOT_FOUND', message: 'Church not found' } },
      { status: 404 },
    )
  }

  const data = await getAccessRequestByUser(church.id, session.user.id)

  // If request was APPROVED but ChurchMember no longer exists, access was revoked
  if (data && data.status === 'APPROVED') {
    const revoked = await isAccessRevoked(church.id, session.user.id)
    if (revoked) {
      return NextResponse.json({
        success: true,
        data: { ...data, status: 'REVOKED' },
      })
    }
  }

  return NextResponse.json({ success: true, data })
}
