import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db/client"
import { getChurchId } from "@/lib/get-church-id"

export async function GET(request: NextRequest) {
  try {
    const churchId = await getChurchId()
    const { searchParams } = new URL(request.url)
    const includeChildren = searchParams.get("includeChildren") === "true"

    const pages = await prisma.page.findMany({
      where: { churchId, deletedAt: null },
      include: {
        sections: { orderBy: { sortOrder: "asc" } },
        ...(includeChildren
          ? { children: { where: { deletedAt: null }, orderBy: { sortOrder: "asc" } } }
          : {}),
      },
      orderBy: { sortOrder: "asc" },
    })

    return NextResponse.json(pages)
  } catch (error) {
    console.error("GET /api/v1/pages error:", error)
    return NextResponse.json({ error: "Failed to fetch pages" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const churchId = await getChurchId()
    const body = await request.json()

    const page = await prisma.page.create({
      data: {
        churchId,
        title: body.title,
        slug: body.slug,
        pageType: body.pageType || "STANDARD",
        layout: body.layout || "DEFAULT",
        isHomepage: body.isHomepage || false,
        isPublished: body.isPublished || false,
        parentId: body.parentId || null,
        metaTitle: body.metaTitle || null,
        metaDescription: body.metaDescription || null,
        sortOrder: body.sortOrder ?? 0,
      },
    })

    return NextResponse.json(page, { status: 201 })
  } catch (error) {
    console.error("POST /api/v1/pages error:", error)
    return NextResponse.json({ error: "Failed to create page" }, { status: 500 })
  }
}
