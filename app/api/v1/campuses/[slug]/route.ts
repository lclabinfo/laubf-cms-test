import { NextRequest, NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'
import { getChurchId } from '@/lib/api/get-church-id'
import { getCampusBySlug, updateCampus, deleteCampus } from '@/lib/dal/campuses'

type Params = { params: Promise<{ slug: string }> }

export async function GET(_request: NextRequest, { params }: Params) {
  try {
    const churchId = await getChurchId()
    const { slug } = await params

    const campus = await getCampusBySlug(churchId, slug)
    if (!campus) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Campus not found' } },
        { status: 404 },
      )
    }

    return NextResponse.json({ success: true, data: campus })
  } catch (error) {
    console.error('GET /api/v1/campuses/[slug] error:', error)
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch campus' } },
      { status: 500 },
    )
  }
}

export async function PATCH(request: NextRequest, { params }: Params) {
  try {
    const churchId = await getChurchId()
    const { slug } = await params
    const body = await request.json()

    const existing = await getCampusBySlug(churchId, slug)
    if (!existing) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Campus not found' } },
        { status: 404 },
      )
    }

    const updated = await updateCampus(churchId, existing.id, body)

    revalidatePath('/website', 'layout')

    return NextResponse.json({ success: true, data: updated })
  } catch (error) {
    console.error('PATCH /api/v1/campuses/[slug] error:', error)
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to update campus' } },
      { status: 500 },
    )
  }
}

export async function DELETE(_request: NextRequest, { params }: Params) {
  try {
    const churchId = await getChurchId()
    const { slug } = await params

    const existing = await getCampusBySlug(churchId, slug)
    if (!existing) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Campus not found' } },
        { status: 404 },
      )
    }

    await deleteCampus(churchId, existing.id)

    revalidatePath('/website', 'layout')

    return NextResponse.json({ success: true, data: { deleted: true } })
  } catch (error) {
    console.error('DELETE /api/v1/campuses/[slug] error:', error)
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to delete campus' } },
      { status: 500 },
    )
  }
}
