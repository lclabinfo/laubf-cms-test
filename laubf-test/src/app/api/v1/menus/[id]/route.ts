import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db/client"
import { getChurchId } from "@/lib/get-church-id"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const churchId = await getChurchId()
    const { id } = await params

    const menu = await prisma.menu.findFirst({
      where: { id, churchId },
      include: {
        items: {
          where: { parentId: null },
          orderBy: { sortOrder: "asc" },
          include: {
            children: { orderBy: { sortOrder: "asc" } },
          },
        },
      },
    })

    if (!menu) {
      return NextResponse.json({ error: "Menu not found" }, { status: 404 })
    }

    return NextResponse.json(menu)
  } catch (error) {
    console.error("GET /api/v1/menus/[id] error:", error)
    return NextResponse.json({ error: "Failed to fetch menu" }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const churchId = await getChurchId()
    const { id } = await params
    const body = await request.json()

    const existing = await prisma.menu.findFirst({ where: { id, churchId } })
    if (!existing) {
      return NextResponse.json({ error: "Menu not found" }, { status: 404 })
    }

    const menu = await prisma.menu.update({
      where: { id },
      data: {
        name: body.name ?? existing.name,
        slug: body.slug ?? existing.slug,
        location: body.location ?? existing.location,
      },
      include: {
        items: {
          where: { parentId: null },
          orderBy: { sortOrder: "asc" },
          include: {
            children: { orderBy: { sortOrder: "asc" } },
          },
        },
      },
    })

    return NextResponse.json(menu)
  } catch (error) {
    console.error("PUT /api/v1/menus/[id] error:", error)
    return NextResponse.json({ error: "Failed to update menu" }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const churchId = await getChurchId()
    const { id } = await params

    const existing = await prisma.menu.findFirst({ where: { id, churchId } })
    if (!existing) {
      return NextResponse.json({ error: "Menu not found" }, { status: 404 })
    }

    await prisma.menu.delete({ where: { id } })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("DELETE /api/v1/menus/[id] error:", error)
    return NextResponse.json({ error: "Failed to delete menu" }, { status: 500 })
  }
}
