import { NextRequest, NextResponse } from 'next/server'
import { fetchBibleText, getBibleApiTranslation, NATIVE_TRANSLATIONS } from '@/lib/bible-api'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl
    const passage = searchParams.get('passage')

    if (!passage) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: 'passage query parameter is required' } },
        { status: 400 },
      )
    }

    const version = (searchParams.get('version') || 'KJV').toUpperCase()

    if (!NATIVE_TRANSLATIONS.has(version)) {
      return NextResponse.json(
        { success: false, error: { code: 'UNSUPPORTED_VERSION', message: `${version} is not available for inline display. Supported: KJV, ASV, WEB, YLT.` } },
        { status: 422 },
      )
    }

    const translation = getBibleApiTranslation(version)
    const result = await fetchBibleText(passage, translation)

    if (!result) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: `Could not fetch Bible text for "${passage}"` } },
        { status: 404 },
      )
    }

    return NextResponse.json({ success: true, data: { ...result, version } })
  } catch (error) {
    console.error('GET /api/v1/bible error:', error)
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch Bible text' } },
      { status: 500 },
    )
  }
}
