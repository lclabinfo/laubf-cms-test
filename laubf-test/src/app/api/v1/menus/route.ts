import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db/client"
import { getChurchId } from "@/lib/get-church-id"

export async function GET() {
  try {
    const churchId = await getChurchId()

    const menus = await prisma.menu.findMany({
      where: { churchId },
      include: {
        items: {
          where: { parentId: null },
          orderBy: { sortOrder: "asc" },
          include: {
            children: { orderBy: { sortOrder: "asc" } },
          },
        },
      },
      orderBy: { createdAt: "asc" },
    })

    return NextResponse.json(menus)
  } catch (error) {
    console.error("GET /api/v1/menus error:", error)
    return NextResponse.json({ error: "Failed to fetch menus" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const churchId = await getChurchId()
    const body = await request.json()

    const menu = await prisma.menu.create({
      data: {
        churchId,
        name: body.name,
        slug: body.slug,
        location: body.location,
      },
      include: {
        items: true,
      },
    })

    return NextResponse.json(menu, { status: 201 })
  } catch (error) {
    console.error("POST /api/v1/menus error:", error)
    return NextResponse.json({ error: "Failed to create menu" }, { status: 500 })
  }
}
