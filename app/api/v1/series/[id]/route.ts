import { NextRequest, NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'
import { getChurchId } from '@/lib/api/get-church-id'
import { getSeriesById, updateSeries, deleteSeries, setSeriesMessages } from '@/lib/dal/series'

type Params = { params: Promise<{ id: string }> }

export async function GET(_request: NextRequest, { params }: Params) {
  try {
    const churchId = await getChurchId()
    const { id } = await params

    const series = await getSeriesById(churchId, id)
    if (!series) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Series not found' } },
        { status: 404 },
      )
    }

    return NextResponse.json({ success: true, data: series })
  } catch (error) {
    console.error('GET /api/v1/series/[id] error:', error)
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch series' } },
      { status: 500 },
    )
  }
}

export async function PATCH(request: NextRequest, { params }: Params) {
  try {
    const churchId = await getChurchId()
    const { id } = await params
    const body = await request.json()

    const existing = await getSeriesById(churchId, id)
    if (!existing) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Series not found' } },
        { status: 404 },
      )
    }

    // Extract messageIds if provided (handled separately via join table)
    const { messageIds, ...seriesData } = body

    const updated = await updateSeries(churchId, existing.id, seriesData)

    // Handle message assignment if messageIds is provided
    if (Array.isArray(messageIds)) {
      await setSeriesMessages(existing.id, messageIds)
    }

    revalidatePath('/website', 'layout')

    return NextResponse.json({ success: true, data: updated })
  } catch (error) {
    console.error('PATCH /api/v1/series/[id] error:', error)
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to update series' } },
      { status: 500 },
    )
  }
}

export async function DELETE(_request: NextRequest, { params }: Params) {
  try {
    const churchId = await getChurchId()
    const { id } = await params

    const existing = await getSeriesById(churchId, id)
    if (!existing) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Series not found' } },
        { status: 404 },
      )
    }

    await deleteSeries(churchId, existing.id)

    revalidatePath('/website', 'layout')

    return NextResponse.json({ success: true, data: { deleted: true } })
  } catch (error) {
    console.error('DELETE /api/v1/series/[id] error:', error)
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to delete series' } },
      { status: 500 },
    )
  }
}
