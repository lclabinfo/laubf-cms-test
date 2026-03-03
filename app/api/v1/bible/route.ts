import { NextRequest, NextResponse } from 'next/server'
import { fetchBibleText, LOCAL_VERSIONS } from '@/lib/bible-api'

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

    const version = (searchParams.get('version') || 'ESV').toUpperCase()

    if (!LOCAL_VERSIONS.has(version)) {
      const available = Array.from(LOCAL_VERSIONS).join(', ')
      return NextResponse.json(
        { success: false, error: { code: 'UNSUPPORTED_VERSION', message: `${version} is not available for inline display. Supported: ${available}` } },
        { status: 422 },
      )
    }

    const result = await fetchBibleText(passage, version)

    if (!result) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: `Could not find Bible text for "${passage}" in ${version}` } },
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
