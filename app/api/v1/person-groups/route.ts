import { NextRequest, NextResponse } from 'next/server'
import { getChurchId } from '@/lib/api/get-church-id'
import { getPersonGroups, createPersonGroup, type PersonGroupFilters } from '@/lib/dal/person-groups'
import { type GroupType, type GroupStatus } from '@/lib/generated/prisma/client'

export async function GET(request: NextRequest) {
  try {
    const churchId = await getChurchId()
    const { searchParams } = request.nextUrl

    const statusParam = searchParams.get('status')
    const filters: PersonGroupFilters & { page?: number; pageSize?: number } = {
      page: searchParams.get('page') ? Number(searchParams.get('page')) : undefined,
      pageSize: searchParams.get('pageSize') ? Number(searchParams.get('pageSize')) : undefined,
      search: searchParams.get('search') ?? undefined,
      groupType: (searchParams.get('groupType') as GroupType) ?? undefined,
      status: searchParams.has('status')
        ? (statusParam ? statusParam as GroupStatus : null)
        : undefined,
      parentGroupId: searchParams.has('parentGroupId')
        ? (searchParams.get('parentGroupId') || null)
        : undefined,
    }

    const result = await getPersonGroups(churchId, filters)

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
    console.error('GET /api/v1/person-groups error:', error)
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch groups' } },
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

    const group = await createPersonGroup(churchId, body)

    return NextResponse.json({ success: true, data: group }, { status: 201 })
  } catch (error) {
    console.error('POST /api/v1/person-groups error:', error)
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to create group' } },
      { status: 500 },
    )
  }
}
