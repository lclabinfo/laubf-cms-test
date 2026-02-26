import { NextRequest, NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'
import { getChurchId } from '@/lib/api/get-church-id'
import { getPageBySlugOrId, createPageSection, reorderPageSections } from '@/lib/dal/pages'

type Params = { params: Promise<{ slug: string }> }

export async function POST(request: NextRequest, { params }: Params) {
  try {
    const churchId = await getChurchId()
    const { slug } = await params
    const body = await request.json()

    const page = await getPageBySlugOrId(churchId, slug)
    if (!page) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Page not found' } },
        { status: 404 },
      )
    }

    if (!body.sectionType) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: 'sectionType is required' } },
        { status: 400 },
      )
    }

    const section = await createPageSection(churchId, page.id, body)

    // Revalidate the public page so new section appears
    revalidatePath(`/website/${slug}`)
    if (page.isHomepage) {
      revalidatePath('/website')
    }

    return NextResponse.json({ success: true, data: section }, { status: 201 })
  } catch (error) {
    console.error('POST /api/v1/pages/[slug]/sections error:', error)
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to create section' } },
      { status: 500 },
    )
  }
}

export async function PUT(request: NextRequest, { params }: Params) {
  try {
    const churchId = await getChurchId()
    const { slug } = await params
    const body = await request.json()

    const page = await getPageBySlugOrId(churchId, slug)
    if (!page) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Page not found' } },
        { status: 404 },
      )
    }

    if (!body.sectionIds || !Array.isArray(body.sectionIds)) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: 'sectionIds array is required' } },
        { status: 400 },
      )
    }

    await reorderPageSections(churchId, page.id, body.sectionIds)

    // Revalidate the public page so reordered sections render correctly
    revalidatePath(`/website/${slug}`)
    if (page.isHomepage) {
      revalidatePath('/website')
    }

    return NextResponse.json({ success: true, data: { reordered: true } })
  } catch (error) {
    console.error('PUT /api/v1/pages/[slug]/sections error:', error)
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to reorder sections' } },
      { status: 500 },
    )
  }
}
