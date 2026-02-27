import { NextRequest, NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'
import { getChurchId } from '@/lib/api/get-church-id'
import { getEvents, createEvent, type EventFilters } from '@/lib/dal/events'
import { getMinistryBySlug } from '@/lib/dal/ministries'
import { getCampusBySlug } from '@/lib/dal/campuses'
import { ContentStatus, type EventType } from '@/lib/generated/prisma/client'
import { validateAll, validateTitle, validateSlug, validateLongText, validateUrl, validateEnum, CONTENT_STATUS_VALUES, EVENT_TYPE_VALUES } from '@/lib/api/validation'
import { requireApiAuth } from '@/lib/api/require-auth'

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

    const response = NextResponse.json({
      success: true,
      data: result.data,
      pagination: {
        total: result.total,
        page: result.page,
        pageSize: result.pageSize,
        totalPages: result.totalPages,
      },
    })
    response.headers.set('Cache-Control', 'public, s-maxage=60, stale-while-revalidate=300')
    return response
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
    const authResult = await requireApiAuth('EDITOR')
    if (!authResult.authorized) return authResult.response

    const churchId = await getChurchId()
    const body = await request.json()

    if (!body.title || !body.slug || !body.dateStart) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: 'title, slug, and dateStart are required' } },
        { status: 400 },
      )
    }

    const validation = validateAll(
      validateTitle(body.title),
      validateSlug(body.slug),
      validateLongText(body.description, 'description'),
      validateLongText(body.shortDescription, 'shortDescription'),
      validateUrl(body.meetingUrl, 'meetingUrl'),
      validateUrl(body.registrationUrl, 'registrationUrl'),
      validateUrl(body.coverImage, 'coverImage'),
      validateEnum(body.status, CONTENT_STATUS_VALUES, 'status'),
      validateEnum(body.type, EVENT_TYPE_VALUES, 'type'),
    )
    if (!validation.valid) {
      return NextResponse.json(
        { success: false, error: validation.error },
        { status: 400 },
      )
    }

    // Resolve ministry slug to UUID if provided
    let ministryId: string | null = null
    if (body.ministrySlug) {
      const ministry = await getMinistryBySlug(churchId, body.ministrySlug)
      if (ministry) ministryId = ministry.id
    } else if (body.ministryId) {
      ministryId = body.ministryId
    }

    // Resolve campus slug to UUID if provided
    let campusId: string | null = null
    if (body.campusSlug) {
      const campus = await getCampusBySlug(churchId, body.campusSlug)
      if (campus) campusId = campus.id
    } else if (body.campusId) {
      campusId = body.campusId
    }

    // Build sanitized data with only valid Event model fields
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const data: Record<string, any> = {
      slug: body.slug,
      title: body.title,
      type: body.type ?? 'EVENT',
      dateStart: new Date(body.dateStart),
      status: body.status ?? 'DRAFT',
    }

    // Optional fields — only include if present in body
    if (body.dateEnd != null) data.dateEnd = new Date(body.dateEnd)
    if (body.startTime !== undefined) data.startTime = body.startTime
    if (body.endTime !== undefined) data.endTime = body.endTime
    if (body.allDay !== undefined) data.allDay = body.allDay
    if (body.locationType !== undefined) data.locationType = body.locationType
    if (body.location !== undefined) data.location = body.location
    if (body.address !== undefined) data.address = body.address
    if (body.meetingUrl !== undefined) data.meetingUrl = body.meetingUrl
    if (body.shortDescription !== undefined) data.shortDescription = body.shortDescription
    if (body.description !== undefined) data.description = body.description
    if (body.welcomeMessage !== undefined) data.welcomeMessage = body.welcomeMessage
    if (body.coverImage !== undefined) data.coverImage = body.coverImage
    if (body.imageAlt !== undefined) data.imageAlt = body.imageAlt
    if (body.contacts !== undefined) data.contacts = Array.isArray(body.contacts) ? body.contacts : []
    if (body.registrationUrl !== undefined) data.registrationUrl = body.registrationUrl
    if (body.isFeatured !== undefined) data.isFeatured = body.isFeatured
    if (body.isPinned !== undefined) data.isPinned = body.isPinned
    if (body.isRecurring !== undefined) data.isRecurring = body.isRecurring
    if (body.recurrence !== undefined) data.recurrence = body.recurrence
    if (body.recurrenceDays !== undefined) data.recurrenceDays = Array.isArray(body.recurrenceDays) ? body.recurrenceDays : []
    if (body.recurrenceEndType !== undefined) data.recurrenceEndType = body.recurrenceEndType
    if (body.recurrenceEndDate != null) data.recurrenceEndDate = new Date(body.recurrenceEndDate)
    if (body.recurrenceEndAfter !== undefined) data.recurrenceEndAfter = body.recurrenceEndAfter
    if (body.customRecurrence !== undefined) data.customRecurrence = body.customRecurrence
    if (body.recurrenceSchedule !== undefined) data.recurrenceSchedule = body.recurrenceSchedule
    if (body.badge !== undefined) data.badge = body.badge
    if (body.capacity !== undefined) data.capacity = body.capacity
    if (body.links !== undefined) data.links = body.links

    // Set resolved ministry/campus IDs
    if (ministryId) data.ministryId = ministryId
    if (campusId) data.campusId = campusId

    // Set publishedAt if status is PUBLISHED
    if (data.status === 'PUBLISHED') {
      data.publishedAt = new Date()
    }

    // Extract tags before creating (tags are stored via ContentTag join table, not on Event model)
    const tagNames: string[] | undefined = Array.isArray(body.tags) ? body.tags : undefined

    const event = await createEvent(churchId, data as Parameters<typeof createEvent>[1], tagNames)

    // Revalidate public website pages that display events
    revalidatePath('/website')
    revalidatePath('/website/events')

    return NextResponse.json({ success: true, data: event }, { status: 201 })
  } catch (error) {
    console.error('POST /api/v1/events error:', error)
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to create event' } },
      { status: 500 },
    )
  }
}
