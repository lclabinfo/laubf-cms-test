import { NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/db'
import { verifyToken } from '@/lib/auth/tokens'
import { rateLimit } from '@/lib/rate-limit'

const MAX_PASSWORD_LENGTH = 128
const MAX_NAME_LENGTH = 100

export async function POST(request: Request) {
  const ip = request.headers.get('x-forwarded-for') || 'unknown'
  const rl = rateLimit(`accept-invite:${ip}`, 5, 60 * 60 * 1000)
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

  const { token, firstName, lastName, password } = body as {
    token?: string
    firstName?: string
    lastName?: string
    password?: string
  }

  if (!token) {
    return NextResponse.json(
      { success: false, error: { code: 'VALIDATION', message: 'Invitation token is required.' } },
      { status: 400 },
    )
  }

  if (!firstName || !lastName || firstName.trim().length > MAX_NAME_LENGTH || lastName.trim().length > MAX_NAME_LENGTH) {
    return NextResponse.json(
      { success: false, error: { code: 'VALIDATION', message: 'Name is required (max 100 characters each).' } },
      { status: 400 },
    )
  }

  if (!password || password.length < 8 || password.length > MAX_PASSWORD_LENGTH || !/[a-z]/.test(password) || !/[A-Z]/.test(password) || !/[0-9]/.test(password)) {
    return NextResponse.json(
      { success: false, error: { code: 'VALIDATION', message: 'Password must be 8-128 characters with uppercase, lowercase, and a number.' } },
      { status: 400 },
    )
  }

  const payload = await verifyToken(token, 'invitation')
  if (!payload) {
    return NextResponse.json(
      { success: false, error: { code: 'INVALID_TOKEN', message: 'Invalid or expired invitation. Please ask the admin for a new one.' } },
      { status: 400 },
    )
  }

  try {
    // Verify the ChurchMember record still exists (invitation not revoked)
    const membership = await prisma.churchMember.findFirst({
      where: {
        userId: payload.sub,
        ...(payload.churchId ? { churchId: payload.churchId } : {}),
      },
    })

    if (!membership) {
      return NextResponse.json(
        { success: false, error: { code: 'INVITE_REVOKED', message: 'This invitation has been revoked. Please ask the admin for a new one.' } },
        { status: 400 },
      )
    }

    // Check if user already set up their account (prevent re-use)
    const user = await prisma.user.findUnique({
      where: { id: payload.sub },
      select: { passwordHash: true, firstName: true },
    })

    if (user?.passwordHash && user?.firstName) {
      return NextResponse.json(
        { success: false, error: { code: 'ALREADY_ACCEPTED', message: 'This invitation has already been accepted. Please sign in.' } },
        { status: 400 },
      )
    }

    // Update user with name, password, and verify email
    const passwordHash = await bcrypt.hash(password, 12)
    await prisma.user.update({
      where: { id: payload.sub },
      data: {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        passwordHash,
        emailVerified: true,
      },
    })

    return NextResponse.json({ success: true, message: 'Account set up successfully. You can now sign in.' })
  } catch (error) {
    console.error('[AcceptInvite] Error:', error)
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL', message: 'Something went wrong. Please try again.' } },
      { status: 500 },
    )
  }
}
