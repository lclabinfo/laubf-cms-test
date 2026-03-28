import { NextRequest, NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'
import { getChurchId } from '@/lib/api/get-church-id'
import { updateMenuItem, deleteMenuItem } from '@/lib/dal/menus'
import { requireApiAuth } from '@/lib/api/require-auth'
import { invalidateLayout } from '@/lib/cache/invalidation'

type Params = { params: Promise<{ id: string; itemId: string }> }

export async function PATCH(request: NextRequest, { params }: Params) {
  try {
    const authResult = await requireApiAuth('website.navigation.edit')
    if (!authResult.authorized) return authResult.response

    const churchId = await getChurchId()
    const { itemId } = await params
    const body = await request.json()

    // Allowlist updatable fields to prevent mass-assignment
    const allowedFields = [
      'label', 'href', 'description', 'iconName', 'openInNewTab',
      'isExternal', 'parentId', 'groupLabel', 'featuredImage',
      'featuredTitle', 'featuredDescription', 'featuredHref',
      'sortOrder', 'isVisible', 'scheduleMeta',
    ] as const
    const sanitized: Record<string, unknown> = {}
    for (const key of allowedFields) {
      if (key in body) sanitized[key] = body[key]
    }

    const updated = await updateMenuItem(churchId, itemId, sanitized)

    // Revalidate website layout (menus affect navbar/footer)
    revalidatePath('/website', 'layout')
    invalidateLayout(churchId)

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
    const authResult = await requireApiAuth('website.navigation.edit')
    if (!authResult.authorized) return authResult.response

    const churchId = await getChurchId()
    const { itemId } = await params

    await deleteMenuItem(churchId, itemId)

    // Revalidate website layout (menus affect navbar/footer)
    revalidatePath('/website', 'layout')
    invalidateLayout(churchId)

    return NextResponse.json({ success: true, data: { deleted: true } })
  } catch (error) {
    console.error('DELETE /api/v1/menus/[id]/items/[itemId] error:', error)
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to delete menu item' } },
      { status: 500 },
    )
  }
}
