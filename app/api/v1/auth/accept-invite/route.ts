import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/db'
import { auth } from '@/lib/auth'
import { verifyToken } from '@/lib/auth/tokens'
import { getUserAuthMethods } from '@/lib/dal/users'
import { rateLimit } from '@/lib/rate-limit'

const MAX_PASSWORD_LENGTH = 72
const MAX_NAME_LENGTH = 100

/**
 * GET /api/v1/auth/accept-invite?token=...
 * Validates the invitation token and returns user/membership state
 * so the frontend can render the appropriate UI.
 */
export async function GET(request: NextRequest) {
  const ip = request.headers.get('x-forwarded-for') || 'unknown'
  const rl = rateLimit(`accept-invite-get:${ip}`, 10, 60 * 60 * 1000)
  if (!rl.success) {
    return NextResponse.json(
      { success: false, error: { code: 'RATE_LIMITED', message: 'Too many attempts. Please try again later.' } },
      { status: 429 },
    )
  }

  const token = request.nextUrl.searchParams.get('token')
  if (!token) {
    return NextResponse.json(
      { success: false, error: { code: 'VALIDATION', message: 'Token is required.' } },
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

  // Check membership exists and get its status
  const membership = await prisma.churchMember.findFirst({
    where: {
      userId: payload.sub,
      ...(payload.churchId ? { churchId: payload.churchId } : {}),
    },
    include: {
      church: { select: { name: true } },
    },
  })

  if (!membership) {
    return NextResponse.json(
      { success: false, error: { code: 'INVITE_REVOKED', message: 'This invitation has been revoked.' } },
      { status: 400 },
    )
  }

  const user = await prisma.user.findUnique({
    where: { id: payload.sub },
    select: { email: true },
  })

  const authMethods = await getUserAuthMethods(payload.sub)

  return NextResponse.json({
    success: true,
    data: {
      memberStatus: membership.status,
      userEmail: user?.email ?? payload.email,
      churchName: membership.church.name,
      hasGoogle: authMethods.hasGoogle,
      hasPassword: authMethods.hasPassword,
    },
  })
}

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

  const { token, firstName, lastName, password, mode = 'password' } = body as {
    token?: string
    firstName?: string
    lastName?: string
    password?: string
    mode?: 'password' | 'google'
  }

  if (!token) {
    return NextResponse.json(
      { success: false, error: { code: 'VALIDATION', message: 'Invitation token is required.' } },
      { status: 400 },
    )
  }

  // Validate fields based on mode
  if (mode === 'password') {
    if (!firstName?.trim() || !lastName?.trim() || firstName.trim().length > MAX_NAME_LENGTH || lastName.trim().length > MAX_NAME_LENGTH) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION', message: 'Name is required (max 100 characters each).' } },
        { status: 400 },
      )
    }

    if (!password || password.length < 8 || password.length > MAX_PASSWORD_LENGTH || !/[a-z]/.test(password) || !/[A-Z]/.test(password) || !/[0-9]/.test(password)) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION', message: 'Password must be 8-72 characters with uppercase, lowercase, and a number.' } },
        { status: 400 },
      )
    }
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

    // Idempotency: check membership status, not user fields
    if (membership.status !== 'PENDING') {
      return NextResponse.json(
        { success: false, error: { code: 'ALREADY_ACCEPTED', message: 'This invitation has already been accepted. Please sign in.' } },
        { status: 400 },
      )
    }

    if (mode === 'google') {
      // Validate that the current session user matches the token target
      const session = await auth()
      if (!session?.user?.id || session.user.id !== payload.sub) {
        return NextResponse.json(
          { success: false, error: { code: 'UNAUTHORIZED', message: 'Please sign in with Google first, then accept the invitation.' } },
          { status: 401 },
        )
      }

      // Activate membership — user already has name/email from Google
      await prisma.churchMember.update({
        where: { id: membership.id },
        data: { status: 'ACTIVE' },
      })

      return NextResponse.json({ success: true, message: 'Invitation accepted. Welcome!' })
    }

    // mode === 'password' — atomic: set user credentials + activate membership
    const passwordHash = await bcrypt.hash(password!, 12)
    await prisma.$transaction([
      prisma.user.update({
        where: { id: payload.sub },
        data: {
          firstName: firstName!.trim(),
          lastName: lastName!.trim(),
          passwordHash,
          emailVerified: true,
        },
      }),
      prisma.churchMember.update({
        where: { id: membership.id },
        data: { status: 'ACTIVE' },
      }),
    ])

    return NextResponse.json({ success: true, message: 'Account set up successfully. You can now sign in.' })
  } catch (error) {
    console.error('[AcceptInvite] Error:', error)
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL', message: 'Something went wrong. Please try again.' } },
      { status: 500 },
    )
  }
}
