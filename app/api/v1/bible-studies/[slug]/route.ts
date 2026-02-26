import { NextRequest, NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'
import { getChurchId } from '@/lib/api/get-church-id'
import { getBibleStudyBySlug, updateBibleStudy, deleteBibleStudy } from '@/lib/dal/bible-studies'

type Params = { params: Promise<{ slug: string }> }

export async function GET(_request: NextRequest, { params }: Params) {
  try {
    const churchId = await getChurchId()
    const { slug } = await params

    const study = await getBibleStudyBySlug(churchId, slug)
    if (!study) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Bible study not found' } },
        { status: 404 },
      )
    }

    return NextResponse.json({ success: true, data: study })
  } catch (error) {
    console.error('GET /api/v1/bible-studies/[slug] error:', error)
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch bible study' } },
      { status: 500 },
    )
  }
}

export async function PATCH(request: NextRequest, { params }: Params) {
  try {
    const churchId = await getChurchId()
    const { slug } = await params
    const body = await request.json()

    const existing = await getBibleStudyBySlug(churchId, slug)
    if (!existing) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Bible study not found' } },
        { status: 404 },
      )
    }

    const updated = await updateBibleStudy(churchId, existing.id, body)

    // Revalidate public website pages that display bible studies
    revalidatePath('/website', 'layout')

    return NextResponse.json({ success: true, data: updated })
  } catch (error) {
    console.error('PATCH /api/v1/bible-studies/[slug] error:', error)
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to update bible study' } },
      { status: 500 },
    )
  }
}

export async function DELETE(_request: NextRequest, { params }: Params) {
  try {
    const churchId = await getChurchId()
    const { slug } = await params

    const existing = await getBibleStudyBySlug(churchId, slug)
    if (!existing) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Bible study not found' } },
        { status: 404 },
      )
    }

    await deleteBibleStudy(churchId, existing.id)

    // Revalidate public website pages that display bible studies
    revalidatePath('/website', 'layout')

    return NextResponse.json({ success: true, data: { deleted: true } })
  } catch (error) {
    console.error('DELETE /api/v1/bible-studies/[slug] error:', error)
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to delete bible study' } },
      { status: 500 },
    )
  }
}
