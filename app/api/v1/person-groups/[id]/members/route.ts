import { NextRequest, NextResponse } from 'next/server'
import { getChurchId } from '@/lib/api/get-church-id'
import { getPersonGroupById, getGroupMembers, addGroupMember, removeGroupMember } from '@/lib/dal/person-groups'

type Params = { params: Promise<{ id: string }> }

export async function GET(request: NextRequest, { params }: Params) {
  try {
    const churchId = await getChurchId()
    const { id } = await params
    const { searchParams } = request.nextUrl

    const group = await getPersonGroupById(churchId, id)
    if (!group) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Group not found' } },
        { status: 404 },
      )
    }

    const filters = {
      page: searchParams.get('page') ? Number(searchParams.get('page')) : undefined,
      pageSize: searchParams.get('pageSize') ? Number(searchParams.get('pageSize')) : undefined,
    }

    const result = await getGroupMembers(id, filters)

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
    console.error('GET /api/v1/person-groups/[id]/members error:', error)
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch group members' } },
      { status: 500 },
    )
  }
}

export async function POST(request: NextRequest, { params }: Params) {
  try {
    const churchId = await getChurchId()
    const { id } = await params
    const body = await request.json()

    const group = await getPersonGroupById(churchId, id)
    if (!group) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Group not found' } },
        { status: 404 },
      )
    }

    if (!body.personId) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: 'personId is required' } },
        { status: 400 },
      )
    }

    const member = await addGroupMember(id, body.personId, body.role)

    return NextResponse.json({ success: true, data: member }, { status: 201 })
  } catch (error) {
    console.error('POST /api/v1/person-groups/[id]/members error:', error)
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to add group member' } },
      { status: 500 },
    )
  }
}

export async function DELETE(request: NextRequest, { params }: Params) {
  try {
    const churchId = await getChurchId()
    const { id } = await params
    const body = await request.json()

    const group = await getPersonGroupById(churchId, id)
    if (!group) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Group not found' } },
        { status: 404 },
      )
    }

    if (!body.personId) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: 'personId is required' } },
        { status: 400 },
      )
    }

    await removeGroupMember(id, body.personId)

    return NextResponse.json({ success: true, data: { removed: true } })
  } catch (error) {
    console.error('DELETE /api/v1/person-groups/[id]/members error:', error)
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to remove group member' } },
      { status: 500 },
    )
  }
}
