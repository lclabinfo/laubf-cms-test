import { NextResponse } from 'next/server'
import { requireApiAuth } from '@/lib/api/require-auth'
import { getChurchUser, deactivateUser } from '@/lib/dal/users'
import type { MemberRole } from '@/lib/generated/prisma/client'

const ROLE_LEVEL: Record<MemberRole, number> = {
  VIEWER: 0,
  EDITOR: 1,
  ADMIN: 2,
  OWNER: 3,
}

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const authResult = await requireApiAuth('ADMIN')
  if (!authResult.authorized) return authResult.response
  const { id: memberId } = await params

  const target = await getChurchUser(authResult.churchId, memberId)
  if (!target) {
    return NextResponse.json(
      { success: false, error: { code: 'NOT_FOUND', message: 'User not found.' } },
      { status: 404 },
    )
  }

  // Can't deactivate yourself
  if (target.userId === authResult.userId) {
    return NextResponse.json(
      { success: false, error: { code: 'FORBIDDEN', message: 'Cannot deactivate yourself.' } },
      { status: 403 },
    )
  }

  const actorLevel = ROLE_LEVEL[authResult.role]
  const targetLevel = ROLE_LEVEL[target.role]

  // Can't deactivate users at or above your level (unless OWNER)
  if (actorLevel < ROLE_LEVEL.OWNER && targetLevel >= actorLevel) {
    return NextResponse.json(
      { success: false, error: { code: 'FORBIDDEN', message: 'Cannot deactivate a user with a role equal to or above your own.' } },
      { status: 403 },
    )
  }

  const updated = await deactivateUser(authResult.churchId, memberId)
  return NextResponse.json({ success: true, data: updated })
}
