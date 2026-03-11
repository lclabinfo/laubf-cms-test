import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { rateLimit } from '@/lib/rate-limit'

const MAX_NAME_LENGTH = 100
const MAX_PHONE_LENGTH = 20

export async function POST(request: Request) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json(
      { success: false, error: { code: 'UNAUTHORIZED', message: 'You must be signed in.' } },
      { status: 401 },
    )
  }

  const userId = session.user.id
  const churchId = session.churchId

  if (!churchId) {
    return NextResponse.json(
      { success: false, error: { code: 'UNAUTHORIZED', message: 'No church membership found.' } },
      { status: 401 },
    )
  }

  const rl = rateLimit(`complete-onboarding:${userId}`, 10, 60 * 60 * 1000)
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

  const { firstName, lastName, phone } = body as {
    firstName?: string
    lastName?: string
    phone?: string
  }

  // Validate required fields
  if (!firstName || !firstName.trim() || firstName.trim().length > MAX_NAME_LENGTH) {
    return NextResponse.json(
      { success: false, error: { code: 'VALIDATION', message: 'First name is required (max 100 characters).' } },
      { status: 400 },
    )
  }

  if (!lastName || !lastName.trim() || lastName.trim().length > MAX_NAME_LENGTH) {
    return NextResponse.json(
      { success: false, error: { code: 'VALIDATION', message: 'Last name is required (max 100 characters).' } },
      { status: 400 },
    )
  }

  // Validate optional phone
  if (phone !== undefined && phone !== null && typeof phone === 'string' && phone.trim().length > MAX_PHONE_LENGTH) {
    return NextResponse.json(
      { success: false, error: { code: 'VALIDATION', message: 'Phone number must be 20 characters or fewer.' } },
      { status: 400 },
    )
  }

  const trimmedFirstName = firstName.trim()
  const trimmedLastName = lastName.trim()
  const trimmedPhone = typeof phone === 'string' ? phone.trim() || null : null

  try {
    // Atomically activate only if still PENDING (prevents race conditions)
    const activated = await prisma.churchMember.updateMany({
      where: { userId, churchId, status: 'PENDING' },
      data: { status: 'ACTIVE' },
    })

    // If nothing was updated, check if already ACTIVE (idempotent) or invalid state
    if (activated.count === 0) {
      const membership = await prisma.churchMember.findFirst({
        where: { userId, churchId },
        select: { status: true },
      })

      if (!membership) {
        return NextResponse.json(
          { success: false, error: { code: 'NO_MEMBERSHIP', message: 'No church membership found for this account.' } },
          { status: 400 },
        )
      }

      if (membership.status === 'ACTIVE') {
        return NextResponse.json({ success: true, data: { status: 'ACTIVE' } })
      }

      return NextResponse.json(
        { success: false, error: { code: 'INVALID_STATUS', message: 'Account cannot be activated from current status.' } },
        { status: 400 },
      )
    }

    // Update User record with verified name
    await prisma.user.update({
      where: { id: userId },
      data: {
        firstName: trimmedFirstName,
        lastName: trimmedLastName,
      },
    })

    // Sync linked Person record if one exists (phone stored on Person only)
    const person = await prisma.person.findFirst({
      where: { userId, churchId, deletedAt: null },
    })

    if (person) {
      await prisma.person.update({
        where: { id: person.id },
        data: {
          firstName: trimmedFirstName,
          lastName: trimmedLastName,
          ...(trimmedPhone !== null ? { phone: trimmedPhone } : {}),
        },
      })
    }

    return NextResponse.json({ success: true, data: { status: 'ACTIVE' } })
  } catch (error) {
    console.error('[CompleteOnboarding] Error:', error)
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL', message: 'Something went wrong. Please try again.' } },
      { status: 500 },
    )
  }
}
