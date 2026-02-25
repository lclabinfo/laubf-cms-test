import { NextRequest, NextResponse } from 'next/server'
import { getChurchId } from '@/lib/api/get-church-id'
import { getMenuWithItems, createMenuItem, reorderMenuItems } from '@/lib/dal/menus'

type Params = { params: Promise<{ id: string }> }

export async function GET(_request: NextRequest, { params }: Params) {
  try {
    const churchId = await getChurchId()
    const { id: menuId } = await params

    const menu = await getMenuWithItems(churchId, menuId)
    if (!menu) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Menu not found' } },
        { status: 404 },
      )
    }

    return NextResponse.json({ success: true, data: menu })
  } catch (error) {
    console.error('GET /api/v1/menus/[id]/items error:', error)
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch menu items' } },
      { status: 500 },
    )
  }
}

export async function POST(request: NextRequest, { params }: Params) {
  try {
    const churchId = await getChurchId()
    const { id: menuId } = await params
    const body = await request.json()

    // Verify the menu exists and belongs to this church
    const menu = await getMenuWithItems(churchId, menuId)
    if (!menu) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Menu not found' } },
        { status: 404 },
      )
    }

    if (!body.label) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: 'label is required' } },
        { status: 400 },
      )
    }

    const item = await createMenuItem(churchId, menuId, body)

    return NextResponse.json({ success: true, data: item }, { status: 201 })
  } catch (error) {
    console.error('POST /api/v1/menus/[id]/items error:', error)
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to create menu item' } },
      { status: 500 },
    )
  }
}

export async function PUT(request: NextRequest, { params }: Params) {
  try {
    const churchId = await getChurchId()
    const { id: menuId } = await params
    const body = await request.json()

    // Verify the menu exists and belongs to this church
    const menu = await getMenuWithItems(churchId, menuId)
    if (!menu) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Menu not found' } },
        { status: 404 },
      )
    }

    if (!body.itemIds || !Array.isArray(body.itemIds)) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: 'itemIds array is required' } },
        { status: 400 },
      )
    }

    await reorderMenuItems(menuId, body.itemIds)

    return NextResponse.json({ success: true, data: { reordered: true } })
  } catch (error) {
    console.error('PUT /api/v1/menus/[id]/items error:', error)
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to reorder menu items' } },
      { status: 500 },
    )
  }
}
