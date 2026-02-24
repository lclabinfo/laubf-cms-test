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

    const page = await prisma.page.findFirst({
      where: { id, churchId, deletedAt: null },
      include: {
        sections: { orderBy: { sortOrder: "asc" } },
        children: { where: { deletedAt: null }, orderBy: { sortOrder: "asc" } },
      },
    })

    if (!page) {
      return NextResponse.json({ error: "Page not found" }, { status: 404 })
    }

    return NextResponse.json(page)
  } catch (error) {
    console.error("GET /api/v1/pages/[id] error:", error)
    return NextResponse.json({ error: "Failed to fetch page" }, { status: 500 })
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

    const existing = await prisma.page.findFirst({
      where: { id, churchId, deletedAt: null },
    })
    if (!existing) {
      return NextResponse.json({ error: "Page not found" }, { status: 404 })
    }

    const page = await prisma.page.update({
      where: { id },
      data: {
        title: body.title ?? existing.title,
        slug: body.slug ?? existing.slug,
        pageType: body.pageType ?? existing.pageType,
        layout: body.layout ?? existing.layout,
        isHomepage: body.isHomepage ?? existing.isHomepage,
        isPublished: body.isPublished ?? existing.isPublished,
        publishedAt: body.isPublished && !existing.isPublished ? new Date() : existing.publishedAt,
        parentId: body.parentId !== undefined ? body.parentId : existing.parentId,
        metaTitle: body.metaTitle !== undefined ? body.metaTitle : existing.metaTitle,
        metaDescription: body.metaDescription !== undefined ? body.metaDescription : existing.metaDescription,
        ogImageUrl: body.ogImageUrl !== undefined ? body.ogImageUrl : existing.ogImageUrl,
        noIndex: body.noIndex ?? existing.noIndex,
        sortOrder: body.sortOrder ?? existing.sortOrder,
      },
    })

    return NextResponse.json(page)
  } catch (error) {
    console.error("PUT /api/v1/pages/[id] error:", error)
    return NextResponse.json({ error: "Failed to update page" }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const churchId = await getChurchId()
    const { id } = await params

    const existing = await prisma.page.findFirst({
      where: { id, churchId, deletedAt: null },
    })
    if (!existing) {
      return NextResponse.json({ error: "Page not found" }, { status: 404 })
    }

    await prisma.page.update({
      where: { id },
      data: { deletedAt: new Date() },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("DELETE /api/v1/pages/[id] error:", error)
    return NextResponse.json({ error: "Failed to delete page" }, { status: 500 })
  }
}
