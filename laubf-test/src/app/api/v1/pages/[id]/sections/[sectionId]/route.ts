import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db/client"
import { getChurchId } from "@/lib/get-church-id"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; sectionId: string }> }
) {
  try {
    const churchId = await getChurchId()
    const { sectionId } = await params

    const section = await prisma.pageSection.findFirst({
      where: { id: sectionId, churchId },
    })

    if (!section) {
      return NextResponse.json({ error: "Section not found" }, { status: 404 })
    }

    return NextResponse.json(section)
  } catch (error) {
    console.error("GET /api/v1/pages/[id]/sections/[sectionId] error:", error)
    return NextResponse.json({ error: "Failed to fetch section" }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; sectionId: string }> }
) {
  try {
    const churchId = await getChurchId()
    const { sectionId } = await params
    const body = await request.json()

    const existing = await prisma.pageSection.findFirst({
      where: { id: sectionId, churchId },
    })
    if (!existing) {
      return NextResponse.json({ error: "Section not found" }, { status: 404 })
    }

    const section = await prisma.pageSection.update({
      where: { id: sectionId },
      data: {
        label: body.label !== undefined ? body.label : existing.label,
        sortOrder: body.sortOrder ?? existing.sortOrder,
        visible: body.visible ?? existing.visible,
        colorScheme: body.colorScheme ?? existing.colorScheme,
        paddingY: body.paddingY ?? existing.paddingY,
        containerWidth: body.containerWidth ?? existing.containerWidth,
        content: body.content ?? existing.content,
      },
    })

    return NextResponse.json(section)
  } catch (error) {
    console.error("PUT /api/v1/pages/[id]/sections/[sectionId] error:", error)
    return NextResponse.json({ error: "Failed to update section" }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; sectionId: string }> }
) {
  try {
    const churchId = await getChurchId()
    const { sectionId } = await params

    const existing = await prisma.pageSection.findFirst({
      where: { id: sectionId, churchId },
    })
    if (!existing) {
      return NextResponse.json({ error: "Section not found" }, { status: 404 })
    }

    await prisma.pageSection.delete({ where: { id: sectionId } })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("DELETE /api/v1/pages/[id]/sections/[sectionId] error:", error)
    return NextResponse.json({ error: "Failed to delete section" }, { status: 500 })
  }
}
