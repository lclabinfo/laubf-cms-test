import { NextResponse } from 'next/server'
import { getChurchId } from '@/lib/api/get-church-id'
import { getPeopleByRole } from '@/lib/dal/person-roles'

type Params = { params: Promise<{ slug: string }> }

export async function GET(_request: Request, { params }: Params) {
  try {
    const churchId = await getChurchId()
    const { slug } = await params

    const people = await getPeopleByRole(churchId, slug)

    // Return a simplified shape for dropdown consumers
    const data = people.map((p) => ({
      id: p.id,
      firstName: p.firstName,
      lastName: p.lastName,
      preferredName: p.preferredName,
      name: p.preferredName
        ? `${p.preferredName} ${p.lastName}`
        : `${p.firstName} ${p.lastName}`,
      photoUrl: p.photoUrl,
      title: p.title,
      bio: p.bio,
      email: p.email,
    }))

    return NextResponse.json({ success: true, data })
  } catch (error) {
    console.error(`GET /api/v1/people/by-role/[slug] error:`, error)
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch people by role' } },
      { status: 500 },
    )
  }
}
