import { NextResponse } from 'next/server'
import { requireApiAuth } from '@/lib/api/require-auth'
import { createToken } from '@/lib/auth/tokens'
import { sendEmail } from '@/lib/email/send-email'
import { invitationEmail } from '@/lib/email/templates'
import { prisma } from '@/lib/db'
import { rateLimit } from '@/lib/rate-limit'

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const authResult = await requireApiAuth('users.invite')
  if (!authResult.authorized) return authResult.response

  const { id: memberId } = await params

  // Rate limit: 5 resends per hour per admin
  const rl = rateLimit(`resend-invite:${authResult.userId}`, 5, 60 * 60 * 1000)
  if (!rl.success) {
    return NextResponse.json(
      { success: false, error: { code: 'RATE_LIMITED', message: 'Too many resend attempts. Please try again later.' } },
      { status: 429 },
    )
  }

  try {
    // Fetch the membership with user info
    const membership = await prisma.churchMember.findFirst({
      where: {
        id: memberId,
        churchId: authResult.churchId,
      },
      include: {
        user: { select: { id: true, email: true, firstName: true, lastName: true } },
        church: { select: { name: true } },
      },
    })

    if (!membership) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Member not found.' } },
        { status: 404 },
      )
    }

    if (membership.status !== 'PENDING') {
      return NextResponse.json(
        { success: false, error: { code: 'INVALID_STATE', message: 'Invitation can only be resent for pending members.' } },
        { status: 400 },
      )
    }

    // Get inviter name
    const inviter = await prisma.user.findUnique({
      where: { id: authResult.userId },
      select: { firstName: true, lastName: true },
    })

    const inviterName = [inviter?.firstName, inviter?.lastName].filter(Boolean).join(' ') || 'An admin'
    const churchName = membership.church.name || 'Church CMS'

    // Create new invitation token (7-day expiry)
    const token = await createToken({
      sub: membership.user.id,
      purpose: 'invitation',
      email: membership.user.email,
      role: membership.role,
      churchId: authResult.churchId,
      inviterId: authResult.userId,
    })

    const template = invitationEmail(token, churchName, inviterName, membership.role)

    await sendEmail({ to: membership.user.email, ...template })

    // Update invitedAt timestamp
    await prisma.churchMember.update({
      where: { id: memberId },
      data: { invitedAt: new Date() },
    })

    return NextResponse.json({
      success: true,
      data: { email: membership.user.email },
    })
  } catch (error) {
    console.error('[ResendInvite] Error:', error)
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL', message: 'Failed to resend invitation.' } },
      { status: 500 },
    )
  }
}
