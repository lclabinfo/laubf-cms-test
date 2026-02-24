import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db/client"
import { getChurchId } from "@/lib/get-church-id"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await getChurchId()
    const { id } = await params

    const items = await prisma.menuItem.findMany({
      where: { menuId: id, parentId: null },
      orderBy: { sortOrder: "asc" },
      include: {
        children: { orderBy: { sortOrder: "asc" } },
      },
    })

    return NextResponse.json(items)
  } catch (error) {
    console.error("GET /api/v1/menus/[id]/items error:", error)
    return NextResponse.json({ error: "Failed to fetch menu items" }, { status: 500 })
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await getChurchId()
    const { id } = await params
    const body = await request.json()

    const item = await prisma.menuItem.create({
      data: {
        menuId: id,
        label: body.label,
        href: body.href || null,
        description: body.description || null,
        iconName: body.iconName || null,
        openInNewTab: body.openInNewTab || false,
        isExternal: body.isExternal || false,
        parentId: body.parentId || null,
        groupLabel: body.groupLabel || null,
        featuredImage: body.featuredImage || null,
        featuredTitle: body.featuredTitle || null,
        featuredDescription: body.featuredDescription || null,
        featuredHref: body.featuredHref || null,
        sortOrder: body.sortOrder ?? 0,
        isVisible: body.isVisible ?? true,
      },
    })

    return NextResponse.json(item, { status: 201 })
  } catch (error) {
    console.error("POST /api/v1/menus/[id]/items error:", error)
    return NextResponse.json({ error: "Failed to create menu item" }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await getChurchId()
    const body = await request.json()

    if (!Array.isArray(body.items)) {
      return NextResponse.json({ error: "items array required" }, { status: 400 })
    }

    const updates = body.items.map((item: { id: string; sortOrder: number; parentId?: string | null }) =>
      prisma.menuItem.update({
        where: { id: item.id },
        data: {
          sortOrder: item.sortOrder,
          ...(item.parentId !== undefined ? { parentId: item.parentId } : {}),
        },
      })
    )

    await prisma.$transaction(updates)

    const { id } = await params
    const items = await prisma.menuItem.findMany({
      where: { menuId: id, parentId: null },
      orderBy: { sortOrder: "asc" },
      include: {
        children: { orderBy: { sortOrder: "asc" } },
      },
    })

    return NextResponse.json(items)
  } catch (error) {
    console.error("PUT /api/v1/menus/[id]/items error:", error)
    return NextResponse.json({ error: "Failed to reorder menu items" }, { status: 500 })
  }
}
