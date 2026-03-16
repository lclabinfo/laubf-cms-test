import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'

/**
 * Sets a short-lived httpOnly cookie with the invited email address.
 * The signIn callback checks this cookie and blocks Google OAuth
 * if the Google email doesn't match the invited email.
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

  const email = (body.email as string)?.trim().toLowerCase()
  if (!email) {
    return NextResponse.json(
      { success: false, error: { code: 'VALIDATION', message: 'Email is required.' } },
      { status: 400 },
    )
  }

  const cookieStore = await cookies()
  cookieStore.set('invite-email-guard', email, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 5 * 60, // 5 minutes
    path: '/',
  })

  return NextResponse.json({ success: true })
}
