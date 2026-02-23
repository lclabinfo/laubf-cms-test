import { NextRequest, NextResponse } from 'next/server'
import { getChurchId } from '@/lib/api/get-church-id'
import { getSiteSettings, updateSiteSettings } from '@/lib/dal/site-settings'

export async function GET() {
  try {
    const churchId = await getChurchId()
    const data = await getSiteSettings(churchId)

    return NextResponse.json({ success: true, data })
  } catch (error) {
    console.error('GET /api/v1/site-settings error:', error)
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch site settings' } },
      { status: 500 },
    )
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const churchId = await getChurchId()
    const body = await request.json()

    const updated = await updateSiteSettings(churchId, body)
    return NextResponse.json({ success: true, data: updated })
  } catch (error) {
    console.error('PATCH /api/v1/site-settings error:', error)
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to update site settings' } },
      { status: 500 },
    )
  }
}
