import { NextRequest, NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'
import { getChurchId } from '@/lib/api/get-church-id'
import { getSpeakerBySlug, updateSpeaker, deleteSpeaker } from '@/lib/dal/speakers'

type Params = { params: Promise<{ slug: string }> }

export async function GET(_request: NextRequest, { params }: Params) {
  try {
    const churchId = await getChurchId()
    const { slug } = await params

    const speaker = await getSpeakerBySlug(churchId, slug)
    if (!speaker) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Speaker not found' } },
        { status: 404 },
      )
    }

    return NextResponse.json({ success: true, data: speaker })
  } catch (error) {
    console.error('GET /api/v1/speakers/[slug] error:', error)
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch speaker' } },
      { status: 500 },
    )
  }
}

export async function PATCH(request: NextRequest, { params }: Params) {
  try {
    const churchId = await getChurchId()
    const { slug } = await params
    const body = await request.json()

    const existing = await getSpeakerBySlug(churchId, slug)
    if (!existing) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Speaker not found' } },
        { status: 404 },
      )
    }

    const updated = await updateSpeaker(churchId, existing.id, body)

    revalidatePath('/website', 'layout')

    return NextResponse.json({ success: true, data: updated })
  } catch (error) {
    console.error('PATCH /api/v1/speakers/[slug] error:', error)
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to update speaker' } },
      { status: 500 },
    )
  }
}

export async function DELETE(_request: NextRequest, { params }: Params) {
  try {
    const churchId = await getChurchId()
    const { slug } = await params

    const existing = await getSpeakerBySlug(churchId, slug)
    if (!existing) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Speaker not found' } },
        { status: 404 },
      )
    }

    await deleteSpeaker(churchId, existing.id)

    revalidatePath('/website', 'layout')

    return NextResponse.json({ success: true, data: { deleted: true } })
  } catch (error) {
    console.error('DELETE /api/v1/speakers/[slug] error:', error)
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to delete speaker' } },
      { status: 500 },
    )
  }
}
