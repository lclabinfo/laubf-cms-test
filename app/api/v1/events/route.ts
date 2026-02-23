import { NextRequest, NextResponse } from 'next/server'
import { getChurchId } from '@/lib/api/get-church-id'
import { getEvents, createEvent, type EventFilters } from '@/lib/dal/events'
import { ContentStatus, type EventType } from '@/lib/generated/prisma/client'

export async function GET(request: NextRequest) {
  try {
    const churchId = await getChurchId()
    const { searchParams } = request.nextUrl

    const statusParam = searchParams.get('status')
    const filters: EventFilters & { page?: number; pageSize?: number } = {
      page: searchParams.get('page') ? Number(searchParams.get('page')) : undefined,
      pageSize: searchParams.get('pageSize') ? Number(searchParams.get('pageSize')) : undefined,
      type: (searchParams.get('type') as EventType) ?? undefined,
      ministryId: searchParams.get('ministryId') ?? undefined,
      campusId: searchParams.get('campusId') ?? undefined,
      isFeatured: searchParams.get('isFeatured') ? searchParams.get('isFeatured') === 'true' : undefined,
      isRecurring: searchParams.get('isRecurring') ? searchParams.get('isRecurring') === 'true' : undefined,
      dateFrom: searchParams.get('dateFrom') ? new Date(searchParams.get('dateFrom')!) : undefined,
      dateTo: searchParams.get('dateTo') ? new Date(searchParams.get('dateTo')!) : undefined,
      // Empty string status param = all statuses (null), missing = default (undefined)
      status: searchParams.has('status')
        ? (statusParam ? statusParam as ContentStatus : null)
        : undefined,
    }

    const result = await getEvents(churchId, filters)

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
    console.error('GET /api/v1/events error:', error)
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch events' } },
      { status: 500 },
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const churchId = await getChurchId()
    const body = await request.json()

    if (!body.title || !body.slug || !body.dateStart) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: 'title, slug, and dateStart are required' } },
        { status: 400 },
      )
    }

    const event = await createEvent(churchId, body)

    return NextResponse.json({ success: true, data: event }, { status: 201 })
  } catch (error) {
    console.error('POST /api/v1/events error:', error)
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to create event' } },
      { status: 500 },
    )
  }
}
