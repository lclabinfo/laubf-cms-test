import { NextResponse } from 'next/server'
import { getChurchId } from '@/lib/api/get-church-id'
import { getMenus } from '@/lib/dal/menus'

export async function GET() {
  try {
    const churchId = await getChurchId()
    const data = await getMenus(churchId)

    return NextResponse.json({ success: true, data })
  } catch (error) {
    console.error('GET /api/v1/menus error:', error)
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch menus' } },
      { status: 500 },
    )
  }
}
