import { NextRequest, NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'
import { getChurchId } from '@/lib/api/get-church-id'
import { getThemeWithCustomization, updateThemeCustomization } from '@/lib/dal/theme'

export async function GET() {
  try {
    const churchId = await getChurchId()
    const data = await getThemeWithCustomization(churchId)

    return NextResponse.json({ success: true, data })
  } catch (error) {
    console.error('GET /api/v1/theme error:', error)
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch theme' } },
      { status: 500 },
    )
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const churchId = await getChurchId()
    const body = await request.json()

    const updated = await updateThemeCustomization(churchId, body)

    // Revalidate entire website (theme affects all pages via ThemeProvider)
    revalidatePath('/website', 'layout')

    return NextResponse.json({ success: true, data: updated })
  } catch (error) {
    console.error('PATCH /api/v1/theme error:', error)
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to update theme' } },
      { status: 500 },
    )
  }
}
