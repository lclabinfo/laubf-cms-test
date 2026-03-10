import { NextResponse } from 'next/server'
import { requireApiAuth } from '@/lib/api/require-auth'
import { inviteUser } from '@/lib/dal/users'
import { createToken } from '@/lib/auth/tokens'
import { sendEmail } from '@/lib/email/send-email'
import { invitationEmail } from '@/lib/email/templates'
import { prisma } from '@/lib/db'
import type { MemberRole } from '@/lib/generated/prisma/client'

const ROLE_LEVEL: Record<MemberRole, number> = {
  VIEWER: 0,
  EDITOR: 1,
  ADMIN: 2,
  OWNER: 3,
}

export async function POST(request: Request) {
  const authResult = await requireApiAuth('ADMIN')
  if (!authResult.authorized) return authResult.response

  let body: Record<string, unknown>
  try {
    body = await request.json()
  } catch {
    return NextResponse.json(
      { success: false, error: { code: 'BAD_REQUEST', message: 'Invalid request body' } },
      { status: 400 },
    )
  }

  const { email, role } = body as { email?: string; role?: MemberRole }

  if (!email || typeof email !== 'string') {
    return NextResponse.json(
      { success: false, error: { code: 'VALIDATION', message: 'Email is required.' } },
      { status: 400 },
    )
  }

  const validRoles: MemberRole[] = ['VIEWER', 'EDITOR', 'ADMIN', 'OWNER']
  if (!role || !validRoles.includes(role)) {
    return NextResponse.json(
      { success: false, error: { code: 'VALIDATION', message: 'Valid role is required.' } },
      { status: 400 },
    )
  }

  // Enforce promote/demote rules: can't invite at or above own level (unless OWNER)
  const actorLevel = ROLE_LEVEL[authResult.role]
  const targetLevel = ROLE_LEVEL[role]
  if (actorLevel < ROLE_LEVEL.OWNER && targetLevel >= actorLevel) {
    return NextResponse.json(
      { success: false, error: { code: 'FORBIDDEN', message: 'Cannot invite a user with a role equal to or above your own.' } },
      { status: 403 },
    )
  }

  try {
    const result = await inviteUser(authResult.churchId, email, role)

    // Send invitation email
    const inviter = await prisma.user.findUnique({
      where: { id: authResult.userId },
      select: { firstName: true, lastName: true },
    })
    const church = await prisma.church.findUnique({
      where: { id: authResult.churchId },
      select: { name: true },
    })

    const inviterName = [inviter?.firstName, inviter?.lastName].filter(Boolean).join(' ') || 'An admin'
    const churchName = church?.name || 'Church CMS'

    const token = await createToken({
      sub: result.user.id,
      purpose: 'invitation',
      email: email.trim().toLowerCase(),
      role,
      churchId: authResult.churchId,
      inviterId: authResult.userId,
    })

    const template = invitationEmail(token, churchName, inviterName, role)
    await sendEmail({ to: email.trim().toLowerCase(), ...template })

    return NextResponse.json({
      success: true,
      data: {
        membershipId: result.membershipId,
        isNewUser: result.isNewUser,
        email: result.user.email,
      },
    })
  } catch (error) {
    // Only forward known safe error messages; log the rest server-side
    const knownMessages = ['User is already a member of this church.']
    const rawMessage = error instanceof Error ? error.message : ''
    const message = knownMessages.includes(rawMessage) ? rawMessage : 'Failed to invite user.'
    if (!knownMessages.includes(rawMessage)) {
      console.error('[Invite] Error:', error)
    }
    return NextResponse.json(
      { success: false, error: { code: 'INVITE_FAILED', message } },
      { status: 400 },
    )
  }
}
