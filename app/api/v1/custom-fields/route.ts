import { NextRequest, NextResponse } from 'next/server'
import { getChurchId } from '@/lib/api/get-church-id'
import { getCustomFieldDefinitions, createCustomFieldDefinition } from '@/lib/dal/custom-fields'

export async function GET(request: NextRequest) {
  try {
    const churchId = await getChurchId()
    const { searchParams } = request.nextUrl

    const filters = {
      page: searchParams.get('page') ? Number(searchParams.get('page')) : undefined,
      pageSize: searchParams.get('pageSize') ? Number(searchParams.get('pageSize')) : undefined,
      section: searchParams.get('section') ?? undefined,
    }

    const result = await getCustomFieldDefinitions(churchId, filters)

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
    console.error('GET /api/v1/custom-fields error:', error)
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch custom fields' } },
      { status: 500 },
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const churchId = await getChurchId()
    const body = await request.json()

    if (!body.name || !body.slug || !body.fieldType) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: 'name, slug, and fieldType are required' } },
        { status: 400 },
      )
    }

    const field = await createCustomFieldDefinition(churchId, body)

    return NextResponse.json({ success: true, data: field }, { status: 201 })
  } catch (error) {
    console.error('POST /api/v1/custom-fields error:', error)
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to create custom field' } },
      { status: 500 },
    )
  }
}
