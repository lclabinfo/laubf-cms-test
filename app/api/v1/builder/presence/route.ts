import { NextRequest, NextResponse } from 'next/server'
import { requireApiAuth } from '@/lib/api/require-auth'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'

const STALE_THRESHOLD_MS = 60_000 // 60 seconds

export async function POST(request: NextRequest) {
  try {
    const authResult = await requireApiAuth('website.pages.edit')
    if (!authResult.authorized) return authResult.response

    // requireApiAuth already validated the session; re-read only for the user name
    // (not included in the auth result). Next-Auth caches per-request, so this is cheap.
    const session = await auth()
    const userName = session?.user?.name || authResult.roleName || 'Unknown'

    const { pageId } = await request.json()
    if (!pageId) {
      return NextResponse.json(
        { success: false, error: { code: 'BAD_REQUEST', message: 'pageId is required' } },
        { status: 400 },
      )
    }

    const now = new Date()
    const staleThreshold = new Date(now.getTime() - STALE_THRESHOLD_MS)

    // Upsert presence + clean stale + fetch active editors in a transaction
    const [, , editors] = await prisma.$transaction([
      prisma.builderPresence.upsert({
        where: { pageId_userId: { pageId, userId: authResult.userId } },
        create: {
          pageId,
          userId: authResult.userId,
          userName,
          churchId: authResult.churchId,
        },
        update: {
          userName,
          lastSeen: now,
        },
      }),
      prisma.builderPresence.deleteMany({
        where: { pageId, lastSeen: { lt: staleThreshold } },
      }),
      prisma.builderPresence.findMany({
        where: {
          pageId,
          userId: { not: authResult.userId },
          lastSeen: { gte: staleThreshold },
        },
        select: { userId: true, userName: true, lastSeen: true },
      }),
    ])

    return NextResponse.json({ ok: true, editors })
  } catch (error) {
    console.error('POST /api/v1/builder/presence error:', error)
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to update presence' } },
      { status: 500 },
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const authResult = await requireApiAuth('website.pages.edit')
    if (!authResult.authorized) return authResult.response

    const pageId = request.nextUrl.searchParams.get('pageId')
    if (!pageId) {
      return NextResponse.json(
        { success: false, error: { code: 'BAD_REQUEST', message: 'pageId is required' } },
        { status: 400 },
      )
    }

    const staleThreshold = new Date(Date.now() - STALE_THRESHOLD_MS)

    const editors = await prisma.builderPresence.findMany({
      where: {
        pageId,
        userId: { not: authResult.userId },
        lastSeen: { gte: staleThreshold },
      },
      select: { userId: true, userName: true, lastSeen: true },
    })

    return NextResponse.json({ ok: true, editors })
  } catch (error) {
    console.error('GET /api/v1/builder/presence error:', error)
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch presence' } },
      { status: 500 },
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const authResult = await requireApiAuth('website.pages.edit')
    if (!authResult.authorized) return authResult.response

    const { pageId } = await request.json()
    if (!pageId) {
      return NextResponse.json(
        { success: false, error: { code: 'BAD_REQUEST', message: 'pageId is required' } },
        { status: 400 },
      )
    }

    await prisma.builderPresence.deleteMany({
      where: { pageId, userId: authResult.userId },
    })

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('DELETE /api/v1/builder/presence error:', error)
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to delete presence' } },
      { status: 500 },
    )
  }
}
