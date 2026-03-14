import { NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/db'
import { requireApiAuth } from '@/lib/api/require-auth'
import { rateLimit } from '@/lib/rate-limit'

const MAX_PASSWORD_LENGTH = 128

export async function PATCH(request: Request) {
  const authResult = await requireApiAuth()
  if (!authResult.authorized) return authResult.response

  // Rate limit: 5 attempts per hour per user
  const rl = rateLimit(`password-change:${authResult.userId}`, 5, 60 * 60 * 1000)
  if (!rl.success) {
    return NextResponse.json(
      { success: false, error: { code: 'RATE_LIMITED', message: 'Too many attempts. Please try again later.' } },
      { status: 429 },
    )
  }

  let body: Record<string, unknown>
  try {
    body = await request.json()
  } catch {
    return NextResponse.json(
      { success: false, error: { code: 'BAD_REQUEST', message: 'Invalid request body' } },
      { status: 400 },
    )
  }

  const { currentPassword, newPassword } = body as {
    currentPassword?: string
    newPassword?: string
  }

  if (!newPassword || typeof newPassword !== 'string') {
    return NextResponse.json(
      { success: false, error: { code: 'VALIDATION', message: 'New password is required.' } },
      { status: 400 },
    )
  }

  if (newPassword.length < 8 || newPassword.length > MAX_PASSWORD_LENGTH || !/[a-z]/.test(newPassword) || !/[A-Z]/.test(newPassword) || !/[0-9]/.test(newPassword)) {
    return NextResponse.json(
      { success: false, error: { code: 'VALIDATION', message: 'Password must be 8-128 characters with uppercase, lowercase, and a number.' } },
      { status: 400 },
    )
  }

  const user = await prisma.user.findUnique({
    where: { id: authResult.userId },
    select: { passwordHash: true },
  })

  if (!user) {
    return NextResponse.json(
      { success: false, error: { code: 'NOT_FOUND', message: 'User not found' } },
      { status: 404 },
    )
  }

  // If user already has a password, require currentPassword
  if (user.passwordHash) {
    if (!currentPassword || typeof currentPassword !== 'string') {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION', message: 'Current password is required.' } },
        { status: 400 },
      )
    }

    if (currentPassword.length > MAX_PASSWORD_LENGTH) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION', message: 'Invalid current password.' } },
        { status: 400 },
      )
    }

    const isValid = await bcrypt.compare(currentPassword, user.passwordHash)
    if (!isValid) {
      return NextResponse.json(
        { success: false, error: { code: 'INVALID_PASSWORD', message: 'Current password is incorrect.' } },
        { status: 400 },
      )
    }
  }

  // Hash and save new password, then bump sessionVersion to invalidate existing sessions
  const passwordHash = await bcrypt.hash(newPassword, 12)

  const membership = await prisma.churchMember.findFirst({
    where: { userId: authResult.userId },
    select: { churchId: true },
  })

  await prisma.$transaction([
    prisma.user.update({
      where: { id: authResult.userId },
      data: { passwordHash },
    }),
    // Bump sessionVersion so existing JWTs are forced to refresh
    ...(membership
      ? [prisma.church.update({
          where: { id: membership.churchId },
          data: { sessionVersion: { increment: 1 } },
        })]
      : []),
  ])

  return NextResponse.json({ success: true, message: 'Password updated successfully.' })
}
