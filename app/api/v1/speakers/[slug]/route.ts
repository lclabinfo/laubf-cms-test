/**
 * Legacy speaker-by-slug endpoints — now backed by Person table.
 * Retained for backward compatibility with website rendering.
 */
import { NextRequest, NextResponse } from 'next/server'
import { getChurchId } from '@/lib/api/get-church-id'
import { prisma } from '@/lib/db'

type Params = { params: Promise<{ slug: string }> }

export async function GET(_request: NextRequest, { params }: Params) {
  try {
    const churchId = await getChurchId()
    const { slug } = await params

    const person = await prisma.person.findFirst({
      where: { churchId, slug, deletedAt: null },
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
    })

    if (!person) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Speaker not found' } },
        { status: 404 },
      )
    }

    const response = NextResponse.json({
      success: true,
      data: {
        id: person.id,
        name: person.preferredName ? `${person.preferredName} ${person.lastName}` : `${person.firstName} ${person.lastName}`,
        slug,
        title: person.title,
        bio: person.bio,
        photoUrl: person.photoUrl,
        email: person.email,
      },
    })
    response.headers.set('Cache-Control', 'public, s-maxage=60, stale-while-revalidate=300')
    return response
  } catch (error) {
    console.error('GET /api/v1/speakers/[slug] error:', error)
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch speaker' } },
      { status: 500 },
    )
  }
}
