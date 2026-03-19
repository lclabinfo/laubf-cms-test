import { NextRequest, NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'
import { getChurchId } from '@/lib/api/get-church-id'
import { getNavbarSettings, updateNavbarSettings } from '@/lib/dal/site-settings'
import { requireApiAuth } from '@/lib/api/require-auth'

export async function GET() {
  try {
    const churchId = await getChurchId()
    const data = await getNavbarSettings(churchId)

    return NextResponse.json({ success: true, data })
  } catch (error) {
    console.error('GET /api/v1/site-settings/navbar error:', error)
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch navbar settings' } },
      { status: 500 },
    )
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const authResult = await requireApiAuth('website.settings.edit')
    if (!authResult.authorized) return authResult.response

    const churchId = await getChurchId()
    const body = await request.json()

    // Validate allowed fields
    const allowedFields = ['scrollBehavior', 'solidColor', 'sticky', 'ctaLabel', 'ctaHref', 'ctaVisible']
    const data: Record<string, unknown> = {}
    for (const key of allowedFields) {
      if (key in body) {
        data[key] = body[key]
      }
    }

    if (Object.keys(data).length === 0) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: 'No valid fields provided' } },
        { status: 400 },
      )
    }

    await updateNavbarSettings(churchId, data as Parameters<typeof updateNavbarSettings>[1])

    // Revalidate website layout (navbar settings affect rendering)
    revalidatePath('/website', 'layout')

    // Return updated settings
    const updated = await getNavbarSettings(churchId)
    return NextResponse.json({ success: true, data: updated })
  } catch (error) {
    console.error('PATCH /api/v1/site-settings/navbar error:', error)
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to update navbar settings' } },
      { status: 500 },
    )
  }
}
