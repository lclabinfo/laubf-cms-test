import { NextRequest, NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'
import { getChurchId } from '@/lib/api/get-church-id'
import { getPageForAdmin, updatePage, deletePage } from '@/lib/dal/pages'

type Params = { params: Promise<{ slug: string }> }

export async function GET(_request: NextRequest, { params }: Params) {
  try {
    const churchId = await getChurchId()
    const { slug } = await params

    const page = await getPageForAdmin(churchId, slug)
    if (!page) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Page not found' } },
        { status: 404 },
      )
    }

    return NextResponse.json({ success: true, data: page })
  } catch (error) {
    console.error('GET /api/v1/pages/[slug] error:', error)
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch page' } },
      { status: 500 },
    )
  }
}

export async function PATCH(request: NextRequest, { params }: Params) {
  try {
    const churchId = await getChurchId()
    const { slug } = await params
    const body = await request.json()

    const existing = await getPageForAdmin(churchId, slug)
    if (!existing) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Page not found' } },
        { status: 404 },
      )
    }

    const updated = await updatePage(churchId, existing.id, body)

    // Revalidate both the old slug path and new slug path (if slug changed)
    revalidatePath(`/${slug}`)
    if (body.slug && body.slug !== slug) {
      revalidatePath(`/${body.slug}`)
    }
    // If this is the homepage, also revalidate the root
    if (existing.isHomepage || body.isHomepage) {
      revalidatePath('/')
    }

    return NextResponse.json({ success: true, data: updated })
  } catch (error) {
    console.error('PATCH /api/v1/pages/[slug] error:', error)
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to update page' } },
      { status: 500 },
    )
  }
}

export async function DELETE(_request: NextRequest, { params }: Params) {
  try {
    const churchId = await getChurchId()
    const { slug } = await params

    const existing = await getPageForAdmin(churchId, slug)
    if (!existing) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Page not found' } },
        { status: 404 },
      )
    }

    await deletePage(churchId, existing.id)

    // Revalidate the deleted page's path
    revalidatePath(`/${slug}`)
    // If this was the homepage, also revalidate root
    if (existing.isHomepage) {
      revalidatePath('/')
    }

    return NextResponse.json({ success: true, data: { deleted: true } })
  } catch (error) {
    console.error('DELETE /api/v1/pages/[slug] error:', error)
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to delete page' } },
      { status: 500 },
    )
  }
}
