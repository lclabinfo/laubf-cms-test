import { NextRequest, NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'
import { getChurchId } from '@/lib/api/get-church-id'
import { getEventBySlug, updateEvent, deleteEvent } from '@/lib/dal/events'

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

    return NextResponse.json({ success: true, data: event })
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

    const updated = await updateEvent(churchId, existing.id, body)

    // Revalidate public website pages that display events
    revalidatePath('/(website)', 'layout')

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

    // Revalidate public website pages that display events
    revalidatePath('/(website)', 'layout')

    return NextResponse.json({ success: true, data: { deleted: true } })
  } catch (error) {
    console.error('DELETE /api/v1/events/[slug] error:', error)
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to delete event' } },
      { status: 500 },
    )
  }
}
