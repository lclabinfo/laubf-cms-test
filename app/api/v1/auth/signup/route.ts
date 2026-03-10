import { NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/db'
import { rateLimit } from '@/lib/rate-limit'
import { createToken, deriveNonce } from '@/lib/auth/tokens'
import { sendEmail } from '@/lib/email/send-email'
import { verificationEmail } from '@/lib/email/templates'

const MAX_PASSWORD_LENGTH = 128
const MAX_NAME_LENGTH = 100

export async function POST(request: Request) {
  // Rate limit: 5 signups per 15 min per IP
  const ip = request.headers.get('x-forwarded-for') || 'unknown'
  const rl = rateLimit(`signup:${ip}`, 5, 15 * 60 * 1000)
  if (!rl.success) {
    return NextResponse.json(
      { success: false, error: { code: 'RATE_LIMITED', message: 'Too many signup attempts. Please try again later.' } },
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

  const { firstName, lastName, email, password } = body as {
    firstName?: string
    lastName?: string
    email?: string
    password?: string
    website?: string // honeypot
  }

  // Honeypot check
  if (body.website) {
    // Bot detected — return success to not reveal detection
    return NextResponse.json({ success: true, message: 'Check your email to verify your account.' })
  }

  // Validation
  if (!firstName || typeof firstName !== 'string' || firstName.trim().length < 1 || firstName.trim().length > MAX_NAME_LENGTH) {
    return NextResponse.json(
      { success: false, error: { code: 'VALIDATION', message: 'First name is required (max 100 characters).' } },
      { status: 400 },
    )
  }
  if (!lastName || typeof lastName !== 'string' || lastName.trim().length < 1 || lastName.trim().length > MAX_NAME_LENGTH) {
    return NextResponse.json(
      { success: false, error: { code: 'VALIDATION', message: 'Last name is required (max 100 characters).' } },
      { status: 400 },
    )
  }
  if (!email || typeof email !== 'string') {
    return NextResponse.json(
      { success: false, error: { code: 'VALIDATION', message: 'Email is required.' } },
      { status: 400 },
    )
  }

  const trimmedEmail = email.trim().toLowerCase()
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(trimmedEmail) || trimmedEmail.length > 254) {
    return NextResponse.json(
      { success: false, error: { code: 'VALIDATION', message: 'Invalid email format.' } },
      { status: 400 },
    )
  }

  if (!password || typeof password !== 'string' || password.length < 8) {
    return NextResponse.json(
      { success: false, error: { code: 'VALIDATION', message: 'Password must be at least 8 characters.' } },
      { status: 400 },
    )
  }

  if (password.length > MAX_PASSWORD_LENGTH) {
    return NextResponse.json(
      { success: false, error: { code: 'VALIDATION', message: `Password must be at most ${MAX_PASSWORD_LENGTH} characters.` } },
      { status: 400 },
    )
  }

  // Password strength: at least one uppercase, one lowercase, one number
  if (!/[a-z]/.test(password) || !/[A-Z]/.test(password) || !/[0-9]/.test(password)) {
    return NextResponse.json(
      { success: false, error: { code: 'VALIDATION', message: 'Password must contain uppercase, lowercase, and a number.' } },
      { status: 400 },
    )
  }

  try {
    // Check existing user — if exists, resend verification for unverified users
    const existing = await prisma.user.findUnique({ where: { email: trimmedEmail } })
    if (existing) {
      if (!existing.emailVerified) {
        // Allow re-sending verification for unverified users
        const nonce = deriveNonce(existing.passwordHash, existing.emailVerified)
        const token = await createToken({
          sub: existing.id,
          purpose: 'email-verification',
          email: trimmedEmail,
          nonce,
        })
        const churchSlug = process.env.CHURCH_SLUG || 'church'
        const church = await prisma.church.findFirst({ where: { slug: churchSlug }, select: { name: true } })
        const template = verificationEmail(token, church?.name || 'Church CMS')
        await sendEmail({ to: trimmedEmail, ...template })
      }
      // Normalize timing — perform a dummy hash so response time is similar
      await bcrypt.hash('timing-normalization', 12)
      return NextResponse.json({ success: true, message: 'Check your email to verify your account.' })
    }

    // Create user
    const passwordHash = await bcrypt.hash(password, 12)
    const user = await prisma.user.create({
      data: {
        email: trimmedEmail,
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        passwordHash,
        emailVerified: false,
      },
    })

    // Send verification email
    const nonce = deriveNonce(passwordHash, false)
    const token = await createToken({
      sub: user.id,
      purpose: 'email-verification',
      email: trimmedEmail,
      nonce,
    })

    const churchSlug = process.env.CHURCH_SLUG || 'church'
    const church = await prisma.church.findFirst({ where: { slug: churchSlug }, select: { name: true } })
    const churchName = church?.name || 'Church CMS'

    const template = verificationEmail(token, churchName)
    const emailSent = await sendEmail({ to: trimmedEmail, ...template })

    if (!emailSent) {
      // Clean up the user if email failed — prevent orphaned unverifiable accounts
      await prisma.user.delete({ where: { id: user.id } })
      return NextResponse.json(
        { success: false, error: { code: 'EMAIL_FAILED', message: 'Failed to send verification email. Please try again.' } },
        { status: 500 },
      )
    }

    return NextResponse.json({ success: true, message: 'Check your email to verify your account.' })
  } catch (error) {
    // Handle unique constraint race condition
    if (typeof error === 'object' && error !== null && 'code' in error && (error as { code: string }).code === 'P2002') {
      await bcrypt.hash('timing-normalization', 12)
      return NextResponse.json({ success: true, message: 'Check your email to verify your account.' })
    }
    console.error('[Signup] Error:', error)
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL', message: 'Something went wrong. Please try again.' } },
      { status: 500 },
    )
  }
}
