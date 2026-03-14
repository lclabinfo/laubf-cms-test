import { NextRequest, NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'
import { getChurchId } from '@/lib/api/get-church-id'
import { getEventBySlug, updateEvent, deleteEvent, syncEventLinks } from '@/lib/dal/events'
import { getMinistryBySlug } from '@/lib/dal/ministries'
import { getCampusBySlug } from '@/lib/dal/campuses'
import { requireApiAuth } from '@/lib/api/require-auth'
import { hardDeleteMediaAssetByUrl } from '@/lib/dal/media'
import { validateAll, validateTitle, validateSlug, validateLongText, validateUrl, validateEnum, CONTENT_STATUS_VALUES, EVENT_TYPE_VALUES } from '@/lib/api/validation'

type Params = { params: Promise<{ slug: string }> }

export async function GET(_request: NextRequest, { params }: Params) {
  try {
    const churchId = await getChurchId()
    const { slug } = await params

    const event = await getEventBySlug(churchId, slug)
    if (!event) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Event not found' } },
        { status: 404 },
      )
    }

    const response = NextResponse.json({ success: true, data: event })
    response.headers.set('Cache-Control', 'public, s-maxage=60, stale-while-revalidate=300')
    return response
  } catch (error) {
    console.error('GET /api/v1/events/[slug] error:', error)
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch event' } },
      { status: 500 },
    )
  }
}

export async function PATCH(request: NextRequest, { params }: Params) {
  try {
    const authResult = await requireApiAuth('events.edit_own')
    if (!authResult.authorized) return authResult.response

    const churchId = await getChurchId()
    const { slug } = await params
    const body = await request.json()

    const existing = await getEventBySlug(churchId, slug)
    if (!existing) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Event not found' } },
        { status: 404 },
      )
    }

    // Resolve ministry slug to UUID if provided
    if (body.ministrySlug !== undefined) {
      if (body.ministrySlug) {
        const ministry = await getMinistryBySlug(churchId, body.ministrySlug)
        body.ministryId = ministry ? ministry.id : null
      } else {
        body.ministryId = null
      }
    }

    // Resolve campus slug to UUID if provided
    if (body.campusSlug !== undefined) {
      if (body.campusSlug) {
        const campus = await getCampusBySlug(churchId, body.campusSlug)
        body.campusId = campus ? campus.id : null
      } else {
        body.campusId = null
      }
    }

    // Validate provided fields (only validate fields that are present)
    const checks = [
      body.title !== undefined && validateTitle(body.title),
      body.slug !== undefined && validateSlug(body.slug),
      body.description !== undefined && validateLongText(body.description, 'description'),
      body.shortDescription !== undefined && validateLongText(body.shortDescription, 'shortDescription'),
      body.meetingUrl !== undefined && validateUrl(body.meetingUrl, 'meetingUrl'),
      body.registrationUrl !== undefined && validateUrl(body.registrationUrl, 'registrationUrl'),
      body.coverImage !== undefined && validateUrl(body.coverImage, 'coverImage'),
      body.status !== undefined && validateEnum(body.status, CONTENT_STATUS_VALUES, 'status'),
      body.type !== undefined && validateEnum(body.type, EVENT_TYPE_VALUES, 'type'),
    ].filter((v): v is Exclude<typeof v, false> => v !== false)
    const validation = validateAll(...checks)
    if (!validation.valid) {
      return NextResponse.json(
        { success: false, error: validation.error },
        { status: 400 },
      )
    }

    // Build sanitized update data with only valid Event model fields
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const data: Record<string, any> = {}

    if (body.slug !== undefined) data.slug = body.slug
    if (body.title !== undefined) data.title = body.title
    if (body.type !== undefined) data.type = body.type
    if (body.dateStart !== undefined) data.dateStart = new Date(body.dateStart)
    if (body.dateEnd !== undefined) data.dateEnd = body.dateEnd ? new Date(body.dateEnd) : null
    if (body.startTime !== undefined) data.startTime = body.startTime
    if (body.endTime !== undefined) data.endTime = body.endTime
    if (body.allDay !== undefined) data.allDay = body.allDay
    if (body.locationType !== undefined) data.locationType = body.locationType
    if (body.location !== undefined) data.location = body.location
    if (body.address !== undefined) data.address = body.address
    if (body.locationInstructions !== undefined) data.locationInstructions = body.locationInstructions
    if (body.directionsUrl !== undefined) data.directionsUrl = body.directionsUrl
    if (body.meetingUrl !== undefined) data.meetingUrl = body.meetingUrl
    if (body.shortDescription !== undefined) data.shortDescription = body.shortDescription
    if (body.description !== undefined) data.description = body.description
    if (body.welcomeMessage !== undefined) data.welcomeMessage = body.welcomeMessage
    if (body.coverImage !== undefined) data.coverImage = body.coverImage
    if (body.imageAlt !== undefined) data.imageAlt = body.imageAlt
    if (body.contacts !== undefined) data.contacts = Array.isArray(body.contacts) ? body.contacts : []
    if (body.ministryId !== undefined) data.ministryId = body.ministryId
    if (body.campusId !== undefined) data.campusId = body.campusId
    if (body.registrationUrl !== undefined) data.registrationUrl = body.registrationUrl
    if (body.costType !== undefined) data.costType = body.costType
    if (body.costAmount !== undefined) data.costAmount = body.costAmount
    if (body.registrationRequired !== undefined) data.registrationRequired = body.registrationRequired
    if (body.maxParticipants !== undefined) data.maxParticipants = body.maxParticipants != null ? Number(body.maxParticipants) : null
    if (body.registrationDeadline !== undefined) data.registrationDeadline = body.registrationDeadline ? new Date(body.registrationDeadline) : null
    if (body.isFeatured !== undefined) data.isFeatured = body.isFeatured
    if (body.isPinned !== undefined) data.isPinned = body.isPinned
    if (body.isRecurring !== undefined) data.isRecurring = body.isRecurring
    if (body.recurrence !== undefined) data.recurrence = body.recurrence
    if (body.recurrenceDays !== undefined) data.recurrenceDays = Array.isArray(body.recurrenceDays) ? body.recurrenceDays : []
    if (body.recurrenceEndType !== undefined) data.recurrenceEndType = body.recurrenceEndType
    if (body.recurrenceEndDate !== undefined) data.recurrenceEndDate = body.recurrenceEndDate ? new Date(body.recurrenceEndDate) : null
    if (body.recurrenceEndAfter !== undefined) data.recurrenceEndAfter = body.recurrenceEndAfter
    if (body.customRecurrence !== undefined) data.customRecurrence = body.customRecurrence
    if (body.monthlyRecurrenceType !== undefined) data.monthlyRecurrenceType = body.monthlyRecurrenceType
    if (body.recurrenceSchedule !== undefined) data.recurrenceSchedule = body.recurrenceSchedule
    if (body.badge !== undefined) data.badge = body.badge

    // Handle status change: set publishedAt when transitioning to PUBLISHED
    if (body.status !== undefined) {
      data.status = body.status
      if (body.status === 'PUBLISHED' && existing.status !== 'PUBLISHED') {
        data.publishedAt = new Date()
      }
    }

    let updated = await updateEvent(churchId, existing.id, data)

    // Sync event links via EventLink relation (not the legacy Json blob)
    if (Array.isArray(body.links)) {
      await syncEventLinks(existing.id, body.links)
      // Re-fetch to include synced eventLinks in response
      const refreshed = await getEventBySlug(churchId, updated.slug)
      if (refreshed) updated = refreshed
    }

    // Revalidate public website pages that display events
    revalidatePath('/website')
    revalidatePath('/website/events')

    return NextResponse.json({ success: true, data: updated })
  } catch (error) {
    console.error('PATCH /api/v1/events/[slug] error:', error)
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to update event' } },
      { status: 500 },
    )
  }
}

export async function DELETE(_request: NextRequest, { params }: Params) {
  try {
    const authResult = await requireApiAuth('events.delete')
    if (!authResult.authorized) return authResult.response

    const churchId = await getChurchId()
    const { slug } = await params

    const existing = await getEventBySlug(churchId, slug)
    if (!existing) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Event not found' } },
        { status: 404 },
      )
    }

    await deleteEvent(churchId, existing.id)

    // Clean up cover image from R2 if present (best-effort, don't block response)
    if (existing.coverImage) {
      hardDeleteMediaAssetByUrl(churchId, existing.coverImage).catch((err) => {
        console.warn('Failed to clean up cover image from R2:', err)
      })
    }

    // Revalidate public website pages that display events
    revalidatePath('/website')
    revalidatePath('/website/events')

    return NextResponse.json({ success: true, data: { deleted: true } })
  } catch (error) {
    console.error('DELETE /api/v1/events/[slug] error:', error)
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to delete event' } },
      { status: 500 },
    )
  }
}
