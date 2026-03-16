/**
 * Legacy speaker endpoints — now backed by Person table.
 * Retained for backward compatibility with website rendering.
 */
import { NextRequest, NextResponse } from 'next/server'
import { getChurchId } from '@/lib/api/get-church-id'
import { prisma } from '@/lib/db'

export async function GET() {
  try {
    const churchId = await getChurchId()
    const people = await prisma.person.findMany({
      where: { churchId, deletedAt: null, messages: { some: {} } },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        preferredName: true,
        title: true,
        bio: true,
        photoUrl: true,
        email: true,
      },
      orderBy: [{ lastName: 'asc' }, { firstName: 'asc' }],
    })

    const data = people.map((p) => ({
      id: p.id,
      name: p.preferredName ? `${p.preferredName} ${p.lastName}` : `${p.firstName} ${p.lastName}`,
      slug: `${p.firstName}-${p.lastName}`.toLowerCase().replace(/[^a-z0-9-]/g, '-'),
      title: p.title,
      bio: p.bio,
      photoUrl: p.photoUrl,
      email: p.email,
    }))

    return NextResponse.json({ success: true, data })
  } catch (error) {
    console.error('GET /api/v1/speakers error:', error)
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch speakers' } },
      { status: 500 },
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const churchId = await getChurchId()
    const body = await request.json()

    if (!body.name || !body.slug) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: 'name and slug are required' } },
        { status: 400 },
      )
    }

    const nameParts = body.name.trim().split(/\s+/)
    const firstName = nameParts[0] || ''
    const lastName = nameParts.slice(1).join(' ') || ''

    const person = await prisma.person.create({
      data: {
        churchId,
        firstName,
        lastName,
        slug: body.slug,
        title: body.title || null,
        bio: body.bio || null,
        photoUrl: body.photoUrl || null,
        email: body.email || null,
        membershipStatus: 'VISITOR',
      },
    })

    return NextResponse.json({
      success: true,
      data: {
        id: person.id,
        name: `${person.firstName} ${person.lastName}`,
        slug: person.slug,
      },
    }, { status: 201 })
  } catch (error) {
    console.error('POST /api/v1/speakers error:', error)
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to create member' } },
      { status: 500 },
    )
  }
}
