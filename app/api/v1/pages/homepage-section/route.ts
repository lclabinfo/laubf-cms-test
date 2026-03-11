import { NextRequest, NextResponse } from 'next/server'
import { getChurchId } from '@/lib/api/get-church-id'
import { getHomepageForAdmin } from '@/lib/dal/pages'
import { requireApiAuth } from '@/lib/api/require-auth'

/**
 * GET /api/v1/pages/homepage-section?sectionType=HIGHLIGHT_CARDS
 * Returns the first PageSection of the given type from the homepage.
 * Used by the Events Settings tab to read/write HIGHLIGHT_CARDS settings
 * without needing to know the page slug or section ID upfront.
 */
export async function GET(request: NextRequest) {
  try {
    const authResult = await requireApiAuth('website.pages.edit')
    if (!authResult.authorized) return authResult.response

    const churchId = await getChurchId()
    const sectionType = request.nextUrl.searchParams.get('sectionType')

    if (!sectionType) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: 'sectionType query parameter is required' } },
        { status: 400 },
      )
    }

    const homepage = await getHomepageForAdmin(churchId)
    if (!homepage) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Homepage not found' } },
        { status: 404 },
      )
    }

    const section = homepage.sections.find(
      (s) => s.sectionType === sectionType,
    )

    if (!section) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: `No ${sectionType} section found on homepage` } },
        { status: 404 },
      )
    }

    return NextResponse.json({
      success: true,
      data: {
        sectionId: section.id,
        pageSlug: homepage.slug,
        pageId: homepage.id,
        content: section.content,
      },
    })
  } catch (error) {
    console.error('GET /api/v1/pages/homepage-section error:', error)
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch section' } },
      { status: 500 },
    )
  }
}
