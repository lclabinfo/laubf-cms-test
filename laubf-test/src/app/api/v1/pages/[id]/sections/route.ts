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

    const sections = await prisma.pageSection.findMany({
      where: { pageId: id, churchId },
      orderBy: { sortOrder: "asc" },
    })

    return NextResponse.json(sections)
  } catch (error) {
    console.error("GET /api/v1/pages/[id]/sections error:", error)
    return NextResponse.json({ error: "Failed to fetch sections" }, { status: 500 })
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const churchId = await getChurchId()
    const { id } = await params
    const body = await request.json()

    const section = await prisma.pageSection.create({
      data: {
        churchId,
        pageId: id,
        sectionType: body.sectionType,
        label: body.label || null,
        sortOrder: body.sortOrder ?? 0,
        visible: body.visible ?? true,
        colorScheme: body.colorScheme || "LIGHT",
        paddingY: body.paddingY || "DEFAULT",
        containerWidth: body.containerWidth || "STANDARD",
        content: body.content || {},
      },
    })

    return NextResponse.json(section, { status: 201 })
  } catch (error) {
    console.error("POST /api/v1/pages/[id]/sections error:", error)
    return NextResponse.json({ error: "Failed to create section" }, { status: 500 })
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

    if (!Array.isArray(body.sections)) {
      return NextResponse.json({ error: "sections array required" }, { status: 400 })
    }

    const updates = body.sections.map((s: { id: string; sortOrder: number }) =>
      prisma.pageSection.update({
        where: { id: s.id },
        data: { sortOrder: s.sortOrder },
      })
    )

    await prisma.$transaction(updates)

    const sections = await prisma.pageSection.findMany({
      where: { pageId: id, churchId },
      orderBy: { sortOrder: "asc" },
    })

    return NextResponse.json(sections)
  } catch (error) {
    console.error("PUT /api/v1/pages/[id]/sections error:", error)
    return NextResponse.json({ error: "Failed to reorder sections" }, { status: 500 })
  }
}
