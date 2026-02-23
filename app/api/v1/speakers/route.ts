import { NextRequest, NextResponse } from 'next/server'
import { getChurchId } from '@/lib/api/get-church-id'
import { getSpeakers, createSpeaker } from '@/lib/dal/speakers'

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
