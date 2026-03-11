import { NextResponse } from 'next/server'
import { requireApiAuth } from '@/lib/api/require-auth'
import { prisma } from '@/lib/db'

export async function GET(request: Request) {
  const authResult = await requireApiAuth('users.invite')
  if (!authResult.authorized) return authResult.response

  const { searchParams } = new URL(request.url)
  const q = searchParams.get('q')?.trim() || ''
  if (q.length < 2) {
    return NextResponse.json({ success: true, data: [] })
  }

  // Find people with emails who might be invitable
  const people = await prisma.person.findMany({
    where: {
      churchId: authResult.churchId,
      deletedAt: null,
      email: { not: null },
      OR: [
        { firstName: { contains: q, mode: 'insensitive' } },
        { lastName: { contains: q, mode: 'insensitive' } },
        { email: { contains: q, mode: 'insensitive' } },
      ],
    },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
    },
    take: 10,
  })

  // Filter out people whose email is already linked to a ChurchMember
  const emails = people.map((p) => p.email!).filter(Boolean)
  if (emails.length === 0) {
    return NextResponse.json({ success: true, data: [] })
  }

  const existingMembers = await prisma.churchMember.findMany({
    where: {
      churchId: authResult.churchId,
      user: { email: { in: emails } },
    },
    include: { user: { select: { email: true } } },
  })
  const memberEmails = new Set(existingMembers.map((m) => m.user.email))

  const available = people.filter((p) => p.email && !memberEmails.has(p.email))

  return NextResponse.json({ success: true, data: available })
}
