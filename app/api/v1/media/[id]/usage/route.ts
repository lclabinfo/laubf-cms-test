import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { getChurchId } from '@/lib/api/get-church-id'
import { prisma } from '@/lib/db'

// ---------------------------------------------------------------------------
// GET /api/v1/media/[id]/usage — Find where a media asset is used
// ---------------------------------------------------------------------------

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
        { status: 401 },
      )
    }

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

    // Find events that use this image as cover
    const events = await prisma.event.findMany({
      where: {
        churchId,
        coverImage: asset.url,
      },
      select: { id: true, title: true, slug: true },
      take: 20,
    })

    const usages = events.map((e) => ({
      type: 'event' as const,
      id: e.id,
      title: e.title,
      slug: e.slug,
    }))

    return NextResponse.json({ success: true, data: usages })
  } catch (error) {
    console.error('GET /api/v1/media/[id]/usage error:', error)
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to get media usage' } },
      { status: 500 },
    )
  }
}
