import { NextRequest, NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'
import { updateMenuItem, deleteMenuItem } from '@/lib/dal/menus'

type Params = { params: Promise<{ id: string; itemId: string }> }

export async function PATCH(request: NextRequest, { params }: Params) {
  try {
    const { itemId } = await params
    const body = await request.json()

    const updated = await updateMenuItem(itemId, body)

    // Revalidate website layout (menus affect navbar/footer)
    revalidatePath('/website', 'layout')

    return NextResponse.json({ success: true, data: updated })
  } catch (error) {
    console.error('PATCH /api/v1/menus/[id]/items/[itemId] error:', error)
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to update menu item' } },
      { status: 500 },
    )
  }
}

export async function DELETE(_request: NextRequest, { params }: Params) {
  try {
    const { itemId } = await params

    await deleteMenuItem(itemId)

    // Revalidate website layout (menus affect navbar/footer)
    revalidatePath('/website', 'layout')

    return NextResponse.json({ success: true, data: { deleted: true } })
  } catch (error) {
    console.error('DELETE /api/v1/menus/[id]/items/[itemId] error:', error)
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to delete menu item' } },
      { status: 500 },
    )
  }
}
