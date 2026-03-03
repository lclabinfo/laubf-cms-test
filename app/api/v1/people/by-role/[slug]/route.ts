import { NextResponse } from 'next/server'
import { getChurchId } from '@/lib/api/get-church-id'
import { getPeopleByRole, getRoleDefinitionBySlug, assignRole } from '@/lib/dal/person-roles'
import { createPerson, getPersonById } from '@/lib/dal/people'

type Params = { params: Promise<{ slug: string }> }

function formatPerson(p: { id: string; firstName: string; lastName: string; preferredName: string | null; photoUrl: string | null; title: string | null; bio: string | null; email: string | null }) {
  return {
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
  }
}

export async function GET(_request: Request, { params }: Params) {
  try {
    const churchId = await getChurchId()
    const { slug } = await params

    const people = await getPeopleByRole(churchId, slug)

    const data = people.map(formatPerson)

    return NextResponse.json({ success: true, data })
  } catch (error) {
    console.error(`GET /api/v1/people/by-role/[slug] error:`, error)
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch people by role' } },
      { status: 500 },
    )
  }
}

/**
 * POST /api/v1/people/by-role/[slug]
 *
 * Two modes:
 * - { personId } — Assign the role to an existing person (idempotent)
 * - { firstName, lastName } — Create a new person + assign the role
 */
export async function POST(request: Request, { params }: Params) {
  try {
    const churchId = await getChurchId()
    const { slug } = await params
    const body = await request.json()

    // Resolve the role definition
    const roleDef = await getRoleDefinitionBySlug(churchId, slug)
    if (!roleDef) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: `Role "${slug}" not found` } },
        { status: 404 },
      )
    }

    let person: { id: string; firstName: string; lastName: string; preferredName: string | null; photoUrl: string | null; title: string | null; bio: string | null; email: string | null }

    if (body.personId) {
      // Mode 1: assign role to existing person
      const existing = await getPersonById(churchId, body.personId)
      if (!existing) {
        return NextResponse.json(
          { success: false, error: { code: 'NOT_FOUND', message: 'Person not found' } },
          { status: 404 },
        )
      }
      person = existing
    } else if (body.firstName && body.lastName) {
      // Mode 2: create new person + assign role
      const baseSlug = `${body.firstName}-${body.lastName}`.toLowerCase().replace(/[^a-z0-9-]/g, '-')
      person = await createPerson(churchId, {
        firstName: body.firstName,
        lastName: body.lastName,
        slug: baseSlug,
        membershipStatus: 'VISITOR',
      })
    } else {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: 'Provide either personId or firstName + lastName' } },
        { status: 400 },
      )
    }

    // Assign role if not already assigned (idempotent)
    const alreadyAssigned = roleDef.assignments.some((a) => a.personId === person.id)
    if (!alreadyAssigned) {
      await assignRole(person.id, roleDef.id)
    }

    return NextResponse.json({ success: true, data: formatPerson(person) }, { status: 201 })
  } catch (error) {
    console.error(`POST /api/v1/people/by-role/[slug] error:`, error)
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to assign role' } },
      { status: 500 },
    )
  }
}
