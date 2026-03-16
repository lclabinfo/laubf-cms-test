import { NextResponse } from 'next/server'
import crypto from 'crypto'
import { prisma } from '@/lib/db'
import { rateLimit } from '@/lib/rate-limit'
import { createToken, deriveNonce } from '@/lib/auth/tokens'

function hashCode(code: string): string {
  return crypto.createHash('sha256').update(code).digest('hex')
}

export async function POST(request: Request) {
  const ip = request.headers.get('x-forwarded-for') || 'unknown'

  // Rate limit: 10 attempts per 15 min per IP (brute-force protection for 6-digit code)
  const rl = rateLimit(`verify-reset-code:${ip}`, 10, 15 * 60 * 1000)
  if (!rl.success) {
    return NextResponse.json(
      { success: false, error: { code: 'RATE_LIMITED', message: 'Too many attempts. Please request a new code.' } },
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

  const email = (body.email as string)?.trim().toLowerCase()
  const code = (body.code as string)?.trim()

  if (!email || !code) {
    return NextResponse.json(
      { success: false, error: { code: 'VALIDATION', message: 'Email and code are required.' } },
      { status: 400 },
    )
  }

  // Validate code format (must be 6 digits)
  if (!/^\d{6}$/.test(code)) {
    return NextResponse.json(
      { success: false, error: { code: 'INVALID_CODE', message: 'Invalid code format.' } },
      { status: 400 },
    )
  }

  try {
    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        passwordHash: true,
        emailVerified: true,
        resetCodeHash: true,
        resetCodeExpiresAt: true,
      },
    })

    if (!user || !user.resetCodeHash || !user.resetCodeExpiresAt) {
      return NextResponse.json(
        { success: false, error: { code: 'INVALID_CODE', message: 'Invalid or expired code. Please request a new one.' } },
        { status: 400 },
      )
    }

    // Check expiry
    if (new Date() > user.resetCodeExpiresAt) {
      // Clear expired code
      await prisma.user.update({
        where: { id: user.id },
        data: { resetCodeHash: null, resetCodeExpiresAt: null },
      })
      return NextResponse.json(
        { success: false, error: { code: 'CODE_EXPIRED', message: 'This code has expired. Please request a new one.' } },
        { status: 400 },
      )
    }

    // Compare code hash (timing-safe)
    const inputHash = hashCode(code)
    const isValid = crypto.timingSafeEqual(
      Buffer.from(inputHash, 'hex'),
      Buffer.from(user.resetCodeHash, 'hex'),
    )

    if (!isValid) {
      return NextResponse.json(
        { success: false, error: { code: 'INVALID_CODE', message: 'Incorrect code. Please try again.' } },
        { status: 400 },
      )
    }

    // Code is valid — clear it from DB (single-use)
    await prisma.user.update({
      where: { id: user.id },
      data: { resetCodeHash: null, resetCodeExpiresAt: null },
    })

    // Issue a short-lived password-reset JWT token
    const nonce = deriveNonce(user.passwordHash, user.emailVerified)
    const token = await createToken({
      sub: user.id,
      purpose: 'password-reset',
      email,
      nonce,
    })

    return NextResponse.json({ success: true, data: { token } })
  } catch (error) {
    console.error('[VerifyResetCode] Error:', error)
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL', message: 'Something went wrong. Please try again.' } },
      { status: 500 },
    )
  }
}
