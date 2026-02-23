import { NextRequest, NextResponse } from 'next/server'
import { getChurchId } from '@/lib/api/get-church-id'
import { getMessages, createMessage, type MessageFilters } from '@/lib/dal/messages'
import { ContentStatus } from '@/lib/generated/prisma/client'

export async function GET(request: NextRequest) {
  try {
    const churchId = await getChurchId()
    const { searchParams } = request.nextUrl

    const statusParam = searchParams.get('status')
    const filters: MessageFilters & { page?: number; pageSize?: number } = {
      page: searchParams.get('page') ? Number(searchParams.get('page')) : undefined,
      pageSize: searchParams.get('pageSize') ? Number(searchParams.get('pageSize')) : undefined,
      speakerId: searchParams.get('speakerId') ?? undefined,
      seriesId: searchParams.get('seriesId') ?? undefined,
      search: searchParams.get('search') ?? undefined,
      // Empty string status param = all statuses (null), missing = default (undefined)
      status: searchParams.has('status')
        ? (statusParam ? statusParam as ContentStatus : null)
        : undefined,
    }

    const result = await getMessages(churchId, filters)

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
    console.error('GET /api/v1/messages error:', error)
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch messages' } },
      { status: 500 },
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const churchId = await getChurchId()
    const body = await request.json()

    if (!body.title || !body.slug) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: 'title and slug are required' } },
        { status: 400 },
      )
    }

    const message = await createMessage(churchId, body)

    return NextResponse.json({ success: true, data: message }, { status: 201 })
  } catch (error) {
    console.error('POST /api/v1/messages error:', error)
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to create message' } },
      { status: 500 },
    )
  }
}
