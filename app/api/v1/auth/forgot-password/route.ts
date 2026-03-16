import { NextResponse } from 'next/server'
import crypto from 'crypto'
import { prisma } from '@/lib/db'
import { rateLimit } from '@/lib/rate-limit'
import { sendEmail } from '@/lib/email/send-email'
import { passwordResetCodeEmail } from '@/lib/email/templates'

const RESET_CODE_EXPIRY_MS = 15 * 60 * 1000 // 15 minutes

function generateCode(): string {
  // Generate a 6-digit numeric code (100000-999999)
  return crypto.randomInt(100000, 999999).toString()
}

function hashCode(code: string): string {
  return crypto.createHash('sha256').update(code).digest('hex')
}

export async function POST(request: Request) {
  const ip = request.headers.get('x-forwarded-for') || 'unknown'

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
  if (!email || email.length > 254) {
    return NextResponse.json(
      { success: false, error: { code: 'VALIDATION', message: 'Email is required.' } },
      { status: 400 },
    )
  }

  // Rate limit per IP + truncated email hash to prevent memory bloat
  const emailKey = email.slice(0, 64)
  const rl = rateLimit(`forgot:${ip}:${emailKey}`, 3, 60 * 60 * 1000)
  if (!rl.success) {
    return NextResponse.json(
      { success: false, error: { code: 'RATE_LIMITED', message: 'Too many attempts. Please try again later.' } },
      { status: 429 },
    )
  }

  try {
    const user = await prisma.user.findUnique({
      where: { email },
      select: { id: true, passwordHash: true, emailVerified: true, accounts: { select: { provider: true } } },
    })

    if (!user) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'No account found with this email address.' } },
        { status: 404 },
      )
    }

    // Check if user only has Google (no password)
    const hasGoogle = user.accounts.some((a) => a.provider === 'google')
    const hasPassword = !!user.passwordHash

    if (hasGoogle && !hasPassword) {
      return NextResponse.json(
        { success: false, error: { code: 'GOOGLE_ACCOUNT', message: 'This email is linked to a Google account. Please sign in with Google instead.' } },
        { status: 400 },
      )
    }

    // Generate 6-digit code, hash it, store with expiry
    const code = generateCode()
    const codeHash = hashCode(code)
    const expiresAt = new Date(Date.now() + RESET_CODE_EXPIRY_MS)

    await prisma.user.update({
      where: { id: user.id },
      data: {
        resetCodeHash: codeHash,
        resetCodeExpiresAt: expiresAt,
      },
    })

    // Send code via email
    const churchSlug = process.env.CHURCH_SLUG || 'church'
    const church = await prisma.church.findFirst({ where: { slug: churchSlug }, select: { name: true } })
    const churchName = church?.name || 'Church CMS'

    const template = passwordResetCodeEmail(code, churchName)
    await sendEmail({ to: email, ...template })

    return NextResponse.json({ success: true, message: 'A verification code has been sent to your email.' })
  } catch (error) {
    console.error('[ForgotPassword] Error:', error)
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL', message: 'Something went wrong. Please try again.' } },
      { status: 500 },
    )
  }
}
