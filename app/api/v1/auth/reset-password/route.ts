import { NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/db'
import { verifyToken, deriveNonce } from '@/lib/auth/tokens'
import { rateLimit } from '@/lib/rate-limit'

const MAX_PASSWORD_LENGTH = 128

export async function POST(request: Request) {
  const ip = request.headers.get('x-forwarded-for') || 'unknown'
  const rl = rateLimit(`reset-password:${ip}`, 5, 60 * 60 * 1000)
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

  const { token, password } = body as { token?: string; password?: string }

  if (!token || !password) {
    return NextResponse.json(
      { success: false, error: { code: 'VALIDATION', message: 'Token and password are required.' } },
      { status: 400 },
    )
  }

  if (password.length < 8 || password.length > MAX_PASSWORD_LENGTH || !/[a-z]/.test(password) || !/[A-Z]/.test(password) || !/[0-9]/.test(password)) {
    return NextResponse.json(
      { success: false, error: { code: 'VALIDATION', message: 'Password must be 8-128 characters with uppercase, lowercase, and a number.' } },
      { status: 400 },
    )
  }

  const payload = await verifyToken(token, 'password-reset')
  if (!payload) {
    return NextResponse.json(
      { success: false, error: { code: 'INVALID_TOKEN', message: 'Invalid or expired reset link. Please request a new one.' } },
      { status: 400 },
    )
  }

  try {
    // Fetch user to validate nonce (prevents token replay after password change)
    const user = await prisma.user.findUnique({
      where: { id: payload.sub },
      select: { id: true, passwordHash: true, emailVerified: true },
    })

    if (!user) {
      return NextResponse.json(
        { success: false, error: { code: 'INVALID_TOKEN', message: 'Invalid reset link.' } },
        { status: 400 },
      )
    }

    // Validate nonce — if password was already changed, this token is stale
    if (payload.nonce) {
      const expectedNonce = deriveNonce(user.passwordHash, user.emailVerified)
      if (payload.nonce !== expectedNonce) {
        return NextResponse.json(
          { success: false, error: { code: 'INVALID_TOKEN', message: 'This reset link has already been used. Please request a new one.' } },
          { status: 400 },
        )
      }
    }

    const passwordHash = await bcrypt.hash(password, 12)
    await prisma.user.update({
      where: { id: payload.sub },
      data: { passwordHash, emailVerified: true },
    })

    return NextResponse.json({ success: true, message: 'Password has been reset. You can now sign in.' })
  } catch (error) {
    console.error('[ResetPassword] Error:', error)
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL', message: 'Something went wrong. Please try again.' } },
      { status: 500 },
    )
  }
}
