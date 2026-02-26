import { NextRequest, NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'
import { getChurchId } from '@/lib/api/get-church-id'
import { getChurch, updateChurch } from '@/lib/dal/church'

export async function GET() {
  try {
    const churchId = await getChurchId()
    const data = await getChurch(churchId)

    return NextResponse.json({ success: true, data })
  } catch (error) {
    console.error('GET /api/v1/church error:', error)
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch church profile' } },
      { status: 500 },
    )
  }
}

// Fields allowed in PATCH body — matches updateChurch DAL signature
const ALLOWED_FIELDS = new Set([
  'name', 'email', 'phone', 'address', 'city', 'state', 'zipCode', 'country',
  'websiteUrl', 'facebookUrl', 'instagramUrl', 'youtubeUrl', 'twitterUrl',
  'timezone', 'settings',
])

export async function PATCH(request: NextRequest) {
  try {
    const churchId = await getChurchId()
    const body = await request.json()

    // Only pass through allowed fields to prevent injection of unexpected columns
    const sanitized: Record<string, unknown> = {}
    for (const key of Object.keys(body)) {
      if (ALLOWED_FIELDS.has(key)) {
        sanitized[key] = body[key]
      }
    }

    if (Object.keys(sanitized).length === 0) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: 'No valid fields provided' } },
        { status: 400 },
      )
    }

    const updated = await updateChurch(churchId, sanitized as Parameters<typeof updateChurch>[1])

    revalidatePath('/website', 'layout')

    return NextResponse.json({ success: true, data: updated })
  } catch (error) {
    console.error('PATCH /api/v1/church error:', error)
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to update church profile' } },
      { status: 500 },
    )
  }
}
