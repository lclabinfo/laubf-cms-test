import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { rateLimit } from '@/lib/rate-limit'

/**
 * POST /api/v1/auth/check-auth-method
 * Checks whether an email has a Google-only account (no password).
 * Used by the login page to show helpful guidance after failed credentials.
 */
export async function POST(request: Request) {
  const ip = request.headers.get('x-forwarded-for') || 'unknown'
  const rl = rateLimit(`check-auth:${ip}`, 10, 15 * 60 * 1000)
  if (!rl.success) {
    return NextResponse.json({ success: true, data: { method: null } })
  }

  let body: Record<string, unknown>
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ success: true, data: { method: null } })
  }

  const email = (body.email as string)?.trim().toLowerCase()
  if (!email) {
    return NextResponse.json({ success: true, data: { method: null } })
  }

  try {
    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        passwordHash: true,
        accounts: { select: { provider: true } },
      },
    })

    if (!user) {
      return NextResponse.json({ success: true, data: { method: null } })
    }

    const hasGoogle = user.accounts.some((a) => a.provider === 'google')
    const hasPassword = !!user.passwordHash

    if (hasGoogle && !hasPassword) {
      return NextResponse.json({ success: true, data: { method: 'google' } })
    }

    return NextResponse.json({ success: true, data: { method: null } })
  } catch {
    return NextResponse.json({ success: true, data: { method: null } })
  }
}
