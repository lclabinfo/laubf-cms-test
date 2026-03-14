import { NextResponse } from 'next/server'
import { requireApiAuth } from '@/lib/api/require-auth'
import { getCurrentUserProfile, updateCurrentUserProfile, getUserAuthMethods } from '@/lib/dal/users'

export async function GET() {
  const authResult = await requireApiAuth()
  if (!authResult.authorized) return authResult.response

  const [profile, authMethods] = await Promise.all([
    getCurrentUserProfile(authResult.churchId, authResult.userId),
    getUserAuthMethods(authResult.userId),
  ])

  if (!profile) {
    return NextResponse.json(
      { success: false, error: { code: 'NOT_FOUND', message: 'Profile not found' } },
      { status: 404 },
    )
  }

  return NextResponse.json({
    success: true,
    data: {
      ...profile,
      hasPassword: authMethods.hasPassword,
      hasGoogle: authMethods.hasGoogle,
      googleEmail: authMethods.googleEmail,
    },
  })
}

export async function PATCH(request: Request) {
  const authResult = await requireApiAuth()
  if (!authResult.authorized) return authResult.response

  let body: Record<string, unknown>
  try {
    body = await request.json()
  } catch {
    return NextResponse.json(
      { success: false, error: { code: 'BAD_REQUEST', message: 'Invalid request body' } },
      { status: 400 },
    )
  }

  const { firstName, lastName } = body as { firstName?: string; lastName?: string }

  if (firstName !== undefined && typeof firstName !== 'string') {
    return NextResponse.json(
      { success: false, error: { code: 'VALIDATION', message: 'firstName must be a string' } },
      { status: 400 },
    )
  }
  if (lastName !== undefined && typeof lastName !== 'string') {
    return NextResponse.json(
      { success: false, error: { code: 'VALIDATION', message: 'lastName must be a string' } },
      { status: 400 },
    )
  }

  if (firstName === undefined && lastName === undefined) {
    return NextResponse.json(
      { success: false, error: { code: 'VALIDATION', message: 'At least one field to update is required' } },
      { status: 400 },
    )
  }

  const result = await updateCurrentUserProfile(authResult.churchId, authResult.userId, {
    ...(firstName !== undefined && { firstName: firstName.trim() }),
    ...(lastName !== undefined && { lastName: lastName.trim() }),
  })

  return NextResponse.json({ success: true, data: result })
}
