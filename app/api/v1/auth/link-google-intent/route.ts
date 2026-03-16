import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { auth } from '@/lib/auth'
import { rateLimit } from '@/lib/rate-limit'

/**
 * Sets a short-lived httpOnly cookie signaling that the current user
 * wants to link their Google account. The signIn callback checks this
 * cookie and only allows linking when the Google email matches.
 */
export async function POST() {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json(
      { success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
      { status: 401 },
    )
  }

  const rl = rateLimit(`google-link:${session.user.id}`, 5, 60 * 60 * 1000)
  if (!rl.success) {
    return NextResponse.json(
      { success: false, error: { code: 'RATE_LIMITED', message: 'Too many attempts. Please try again later.' } },
      { status: 429 },
    )
  }

  const cookieStore = await cookies()
  cookieStore.set('google-link-intent', session.user.id, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 5 * 60, // 5 minutes
    path: '/',
  })

  return NextResponse.json({ success: true })
}
