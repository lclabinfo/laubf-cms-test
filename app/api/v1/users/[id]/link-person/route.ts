import { NextResponse } from 'next/server'
import { requireApiAuth } from '@/lib/api/require-auth'
import { getChurchUser, linkUserToPerson, unlinkUserFromPerson } from '@/lib/dal/users'

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const authResult = await requireApiAuth('ADMIN')
  if (!authResult.authorized) return authResult.response
  const { id: memberId } = await params

  let body: Record<string, unknown>
  try {
    body = await request.json()
  } catch {
    return NextResponse.json(
      { success: false, error: { code: 'BAD_REQUEST', message: 'Invalid request body' } },
      { status: 400 },
    )
  }

  const { personId } = body as { personId?: string }
  if (!personId || typeof personId !== 'string') {
    return NextResponse.json(
      { success: false, error: { code: 'VALIDATION', message: 'personId is required.' } },
      { status: 400 },
    )
  }

  const target = await getChurchUser(authResult.churchId, memberId)
  if (!target) {
    return NextResponse.json(
      { success: false, error: { code: 'NOT_FOUND', message: 'User not found.' } },
      { status: 404 },
    )
  }

  try {
    const linked = await linkUserToPerson(authResult.churchId, target.userId, personId)
    return NextResponse.json({ success: true, data: linked })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to link person'
    return NextResponse.json(
      { success: false, error: { code: 'BAD_REQUEST', message } },
      { status: 400 },
    )
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const authResult = await requireApiAuth('ADMIN')
  if (!authResult.authorized) return authResult.response
  const { id: memberId } = await params

  const target = await getChurchUser(authResult.churchId, memberId)
  if (!target) {
    return NextResponse.json(
      { success: false, error: { code: 'NOT_FOUND', message: 'User not found.' } },
      { status: 404 },
    )
  }

  // Find the linked person for this user to get the personId
  const { prisma } = await import('@/lib/db')
  const linkedPerson = await prisma.person.findFirst({
    where: {
      churchId: authResult.churchId,
      userId: target.userId,
      deletedAt: null,
    },
  })

  if (!linkedPerson) {
    return NextResponse.json(
      { success: false, error: { code: 'NOT_FOUND', message: 'No linked person found for this user.' } },
      { status: 404 },
    )
  }

  await unlinkUserFromPerson(authResult.churchId, linkedPerson.id)
  return NextResponse.json({ success: true })
}
