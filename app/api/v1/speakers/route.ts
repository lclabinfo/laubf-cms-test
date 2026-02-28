// DEPRECATED: Use GET /api/v1/people/by-role/speaker instead.
// These routes are retained for backward compatibility with existing integrations and website rendering.
import { NextRequest, NextResponse } from 'next/server'
import { getChurchId } from '@/lib/api/get-church-id'
import { getSpeakers, createSpeaker } from '@/lib/dal/speakers'
import { validateAll, validateTitle, validateSlug, validateLongText, validateEmail, validateUrl } from '@/lib/api/validation'

export async function GET() {
  try {
    const churchId = await getChurchId()
    const data = await getSpeakers(churchId)

    return NextResponse.json({ success: true, data })
  } catch (error) {
    console.error('GET /api/v1/speakers error:', error)
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch speakers' } },
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
      validateLongText(body.bio, 'bio'),
      validateEmail(body.email, 'email'),
      validateUrl(body.photoUrl, 'photoUrl'),
    )
    if (!validation.valid) {
      return NextResponse.json(
        { success: false, error: validation.error },
        { status: 400 },
      )
    }

    const speaker = await createSpeaker(churchId, body)

    return NextResponse.json({ success: true, data: speaker }, { status: 201 })
  } catch (error) {
    console.error('POST /api/v1/speakers error:', error)
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to create speaker' } },
      { status: 500 },
    )
  }
}
