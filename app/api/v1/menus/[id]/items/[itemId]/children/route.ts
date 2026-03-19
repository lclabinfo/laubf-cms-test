import { NextRequest, NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'
import { getChurchId } from '@/lib/api/get-church-id'
import { reorderChildMenuItems } from '@/lib/dal/menus'
import { requireApiAuth } from '@/lib/api/require-auth'

type Params = { params: Promise<{ id: string; itemId: string }> }

export async function PUT(request: NextRequest, { params }: Params) {
  try {
    const authResult = await requireApiAuth('website.navigation.edit')
    if (!authResult.authorized) return authResult.response

    const churchId = await getChurchId()
    const { itemId } = await params
    const body = await request.json()

    if (!body.itemIds || !Array.isArray(body.itemIds)) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: 'itemIds array is required' } },
        { status: 400 },
      )
    }

    await reorderChildMenuItems(churchId, itemId, body.itemIds)

    // Revalidate website layout (menus affect navbar/footer)
    revalidatePath('/website', 'layout')

    return NextResponse.json({ success: true, data: { reordered: true } })
  } catch (error) {
    console.error('PUT /api/v1/menus/[id]/items/[itemId]/children error:', error)
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to reorder child menu items' } },
      { status: 500 },
    )
  }
}
