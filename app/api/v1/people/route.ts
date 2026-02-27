import { NextRequest, NextResponse } from 'next/server'
import { getChurchId } from '@/lib/api/get-church-id'
import { getPeople, createPerson, type PersonFilters } from '@/lib/dal/people'
import { type MembershipStatus } from '@/lib/generated/prisma/client'

export async function GET(request: NextRequest) {
  try {
    const churchId = await getChurchId()
    const { searchParams } = request.nextUrl

    const filters: PersonFilters & { page?: number; pageSize?: number } = {
      page: searchParams.get('page') ? Number(searchParams.get('page')) : undefined,
      pageSize: searchParams.get('pageSize') ? Number(searchParams.get('pageSize')) : undefined,
      search: searchParams.get('search') ?? undefined,
      membershipStatus: (searchParams.get('membershipStatus') as MembershipStatus) ?? undefined,
      tagName: searchParams.get('tagName') ?? undefined,
      groupId: searchParams.get('groupId') ?? undefined,
      householdId: searchParams.get('householdId') ?? undefined,
    }

    const result = await getPeople(churchId, filters)

    return NextResponse.json({
      success: true,
      data: result.data,
      pagination: {
        total: result.total,
        page: result.page,
        pageSize: result.pageSize,
        totalPages: result.totalPages,
      },
    })
  } catch (error) {
    console.error('GET /api/v1/people error:', error)
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch people' } },
      { status: 500 },
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const churchId = await getChurchId()
    const body = await request.json()

    if (!body.firstName || !body.lastName || !body.slug) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: 'firstName, lastName, and slug are required' } },
        { status: 400 },
      )
    }

    const person = await createPerson(churchId, body)

    return NextResponse.json({ success: true, data: person }, { status: 201 })
  } catch (error) {
    console.error('POST /api/v1/people error:', error)
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to create person' } },
      { status: 500 },
    )
  }
}
