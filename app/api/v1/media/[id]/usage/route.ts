import { NextRequest, NextResponse } from 'next/server'
import { getChurchId } from '@/lib/api/get-church-id'
import { requireApiAuth } from '@/lib/api/require-auth'
import { prisma } from '@/lib/db'

// ---------------------------------------------------------------------------
// GET /api/v1/media/[id]/usage — Find where a media asset is used
// ---------------------------------------------------------------------------

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const authResult = await requireApiAuth('media.view')
    if (!authResult.authorized) return authResult.response

    const churchId = await getChurchId()
    const { id } = await params

    // Get the media asset URL
    const asset = await prisma.mediaAsset.findFirst({
      where: { id, churchId },
      select: { url: true },
    })

    if (!asset) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Media asset not found' } },
        { status: 404 },
      )
    }

    // Find events that use this image as cover (exclude soft-deleted)
    const events = await prisma.event.findMany({
      where: {
        churchId,
        coverImage: asset.url,
        deletedAt: null,
      },
      select: { id: true, title: true, slug: true },
      take: 20,
    })

    const eventUsages = events.map((e) => ({
      type: 'event' as const,
      id: e.id,
      title: e.title,
      slug: e.slug,
    }))

    // Find page sections whose JSONB content contains the URL
    const sectionRows = await prisma.$queryRaw<
      Array<{
        id: string
        label: string | null
        sectionType: string
        pageId: string
        pageTitle: string
        pageSlug: string
      }>
    >`
      SELECT
        ps."id",
        ps."label",
        ps."sectionType",
        p."id"    AS "pageId",
        p."title" AS "pageTitle",
        p."slug"  AS "pageSlug"
      FROM "PageSection" ps
      JOIN "Page" p ON p."id" = ps."pageId"
      WHERE p."churchId" = ${churchId}
        AND ps."content" IS NOT NULL
        AND ps."content"::text LIKE ${'%' + asset.url + '%'}
      LIMIT 20
    `

    const sectionUsages = sectionRows.map((s) => ({
      type: 'page-section' as const,
      id: s.id,
      title: s.pageTitle,
      slug: s.pageSlug,
      pageId: s.pageId,
      sectionLabel: s.label,
      sectionType: s.sectionType,
    }))

    const usages = [...eventUsages, ...sectionUsages]

    return NextResponse.json({ success: true, data: usages })
  } catch (error) {
    console.error('GET /api/v1/media/[id]/usage error:', error)
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to get media usage' } },
      { status: 500 },
    )
  }
}
