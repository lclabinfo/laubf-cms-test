import { NextResponse } from 'next/server'
import crypto from 'crypto'
import { prisma } from '@/lib/db'
import { rateLimit } from '@/lib/rate-limit'
import { createToken, deriveNonce } from '@/lib/auth/tokens'
import { sendEmail } from '@/lib/email/send-email'
import { verificationEmail } from '@/lib/email/templates'

/**
 * POST /api/v1/auth/resend-verification
 * Resend verification email. Rate limited to 1 per minute per email.
 * Generates a new nonce so previous verification links are invalidated.
 */
export async function POST(request: Request) {
  let body: Record<string, unknown>
  try {
    body = await request.json()
  } catch {
    return NextResponse.json(
      { success: false, error: { code: 'BAD_REQUEST', message: 'Invalid request body' } },
      { status: 400 },
    )
  }

  const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : ''
  if (!email) {
    return NextResponse.json(
      { success: false, error: { code: 'VALIDATION', message: 'Email is required.' } },
      { status: 400 },
    )
  }

  // Rate limit: 1 resend per minute per email
  const { success: withinLimit } = rateLimit(`resend-verify:${email}`, 1, 60 * 1000)
  if (!withinLimit) {
    return NextResponse.json(
      { success: false, error: { code: 'RATE_LIMITED', message: 'Please wait before requesting another email.' } },
      { status: 429 },
    )
  }

  // Always return success to prevent email enumeration
  const user = await prisma.user.findUnique({
    where: { email },
    select: { id: true, emailVerified: true, passwordHash: true },
  })

  if (user && !user.emailVerified) {
    // Generate new nonce — invalidates all previous verification tokens
    const newNonce = crypto.randomBytes(16).toString('hex')
    await prisma.user.update({
      where: { id: user.id },
      data: { verificationNonce: newNonce },
    })

    const nonce = deriveNonce(user.passwordHash, false, newNonce)
    const token = await createToken({
      sub: user.id,
      purpose: 'email-verification',
      email,
      nonce,
    })

    const churchSlug = process.env.CHURCH_SLUG || 'church'
    const church = await prisma.church.findFirst({ where: { slug: churchSlug }, select: { name: true } })
    const template = verificationEmail(token, church?.name || 'Church CMS')
    await sendEmail({ to: email, ...template })
  }

  return NextResponse.json({ success: true, message: 'If an account exists, a verification email has been sent.' })
}
