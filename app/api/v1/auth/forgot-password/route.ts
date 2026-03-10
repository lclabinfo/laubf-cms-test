import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { rateLimit } from '@/lib/rate-limit'
import { createToken, deriveNonce } from '@/lib/auth/tokens'
import { sendEmail } from '@/lib/email/send-email'
import { passwordResetEmail } from '@/lib/email/templates'

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
    // Always return success to not reveal whether email exists
    return NextResponse.json({ success: true, message: 'If an account with that email exists, a password reset link has been sent.' })
  }

  try {
    const user = await prisma.user.findUnique({
      where: { email },
      select: { id: true, passwordHash: true, emailVerified: true },
    })
    if (user) {
      const nonce = deriveNonce(user.passwordHash, user.emailVerified)
      const token = await createToken({
        sub: user.id,
        purpose: 'password-reset',
        email,
        nonce,
      })

      const churchSlug = process.env.CHURCH_SLUG || 'church'
      const church = await prisma.church.findFirst({ where: { slug: churchSlug }, select: { name: true } })
      const churchName = church?.name || 'Church CMS'

      const template = passwordResetEmail(token, churchName)
      await sendEmail({ to: email, ...template })
    }
  } catch (error) {
    console.error('[ForgotPassword] Error:', error)
  }

  // Always return success (don't reveal email existence)
  return NextResponse.json({ success: true, message: 'If an account with that email exists, a password reset link has been sent.' })
}
