import { NextResponse } from 'next/server'
import { requireApiAuth } from '@/lib/api/require-auth'
import { updateUserRole, removeChurchUser, getChurchOwnerCount, getChurchUser } from '@/lib/dal/users'
import type { MemberRole } from '@/lib/generated/prisma/client'

const ROLE_LEVEL: Record<MemberRole, number> = {
  VIEWER: 0,
  EDITOR: 1,
  ADMIN: 2,
  OWNER: 3,
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const authResult = await requireApiAuth('users.edit_roles')
  if (!authResult.authorized) return authResult.response
  const { id: memberId } = await params

  let body: Record<string, unknown>
  try {
    body = await request.json()
  } catch {
    return NextResponse.json(
      { success: false, error: { code: 'BAD_REQUEST', message: 'Invalid request body' } },
      { status: 400 },
    )
  }

  const { role } = body as { role?: MemberRole }
  const validRoles: MemberRole[] = ['VIEWER', 'EDITOR', 'ADMIN', 'OWNER']
  if (!role || !validRoles.includes(role)) {
    return NextResponse.json(
      { success: false, error: { code: 'VALIDATION', message: 'Valid role is required.' } },
      { status: 400 },
    )
  }

  // Get target member
  const target = await getChurchUser(authResult.churchId, memberId)
  if (!target) {
    return NextResponse.json(
      { success: false, error: { code: 'NOT_FOUND', message: 'User not found.' } },
      { status: 404 },
    )
  }

  // Can't modify yourself
  if (target.userId === authResult.userId) {
    return NextResponse.json(
      { success: false, error: { code: 'FORBIDDEN', message: 'Cannot change your own role.' } },
      { status: 403 },
    )
  }

  const actorLevel = ROLE_LEVEL[authResult.role]
  const targetCurrentLevel = ROLE_LEVEL[target.role]
  const targetNewLevel = ROLE_LEVEL[role]

  // Can't modify users at or above your level (unless OWNER)
  if (actorLevel < ROLE_LEVEL.OWNER && targetCurrentLevel >= actorLevel) {
    return NextResponse.json(
      { success: false, error: { code: 'FORBIDDEN', message: 'Cannot modify a user with a role equal to or above your own.' } },
      { status: 403 },
    )
  }

  // Can't promote above your level (unless OWNER)
  if (actorLevel < ROLE_LEVEL.OWNER && targetNewLevel >= actorLevel) {
    return NextResponse.json(
      { success: false, error: { code: 'FORBIDDEN', message: 'Cannot promote a user to a role equal to or above your own.' } },
      { status: 403 },
    )
  }

  // Protect last OWNER
  if (target.role === 'OWNER' && role !== 'OWNER') {
    const ownerCount = await getChurchOwnerCount(authResult.churchId)
    if (ownerCount <= 1) {
      return NextResponse.json(
        { success: false, error: { code: 'FORBIDDEN', message: 'Cannot demote the last owner.' } },
        { status: 403 },
      )
    }
  }

  const updated = await updateUserRole(authResult.churchId, memberId, role)
  return NextResponse.json({ success: true, data: updated })
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const authResult = await requireApiAuth('users.remove')
  if (!authResult.authorized) return authResult.response
  const { id: memberId } = await params

  const target = await getChurchUser(authResult.churchId, memberId)
  if (!target) {
    return NextResponse.json(
      { success: false, error: { code: 'NOT_FOUND', message: 'User not found.' } },
      { status: 404 },
    )
  }

  // Can't remove yourself
  if (target.userId === authResult.userId) {
    return NextResponse.json(
      { success: false, error: { code: 'FORBIDDEN', message: 'Cannot remove yourself.' } },
      { status: 403 },
    )
  }

  // Can't remove users at or above your level (unless OWNER)
  const actorLevel = ROLE_LEVEL[authResult.role]
  const targetLevel = ROLE_LEVEL[target.role]
  if (actorLevel < ROLE_LEVEL.OWNER && targetLevel >= actorLevel) {
    return NextResponse.json(
      { success: false, error: { code: 'FORBIDDEN', message: 'Cannot remove a user with a role equal to or above your own.' } },
      { status: 403 },
    )
  }

  // Protect last OWNER
  if (target.role === 'OWNER') {
    const ownerCount = await getChurchOwnerCount(authResult.churchId)
    if (ownerCount <= 1) {
      return NextResponse.json(
        { success: false, error: { code: 'FORBIDDEN', message: 'Cannot remove the last owner.' } },
        { status: 403 },
      )
    }
  }

  await removeChurchUser(authResult.churchId, memberId)
  return NextResponse.json({ success: true })
}
