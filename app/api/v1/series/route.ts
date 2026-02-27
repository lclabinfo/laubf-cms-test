import { NextRequest, NextResponse } from 'next/server'
import { getChurchId } from '@/lib/api/get-church-id'
import { getAllSeries, createSeries } from '@/lib/dal/series'
import { validateAll, validateTitle, validateSlug, validateLongText, validateUrl } from '@/lib/api/validation'

export async function GET() {
  try {
    const churchId = await getChurchId()
    const data = await getAllSeries(churchId)

    return NextResponse.json({ success: true, data })
  } catch (error) {
    console.error('GET /api/v1/series error:', error)
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch series' } },
      { status: 500 },
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const churchId = await getChurchId()
    const body = await request.json()

    if (!body.name || !body.slug) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: 'name and slug are required' } },
        { status: 400 },
      )
    }

    const validation = validateAll(
      validateTitle(body.name, 'name'),
      validateSlug(body.slug),
      validateLongText(body.description, 'description'),
      validateUrl(body.coverImage, 'coverImage'),
    )
    if (!validation.valid) {
      return NextResponse.json(
        { success: false, error: validation.error },
        { status: 400 },
      )
    }

    const series = await createSeries(churchId, body)

    return NextResponse.json({ success: true, data: series }, { status: 201 })
  } catch (error) {
    console.error('POST /api/v1/series error:', error)
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to create series' } },
      { status: 500 },
    )
  }
}
