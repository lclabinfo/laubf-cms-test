import { NextRequest, NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'
import { getChurchId } from '@/lib/api/get-church-id'
import { prisma } from '@/lib/db'
import { requireApiAuth } from '@/lib/api/require-auth'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { action, ids } = body as { action: string; ids: string[] }

    if (!action || !Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json(
        { success: false, error: { code: 'BAD_REQUEST', message: 'action and ids[] are required' } },
        { status: 400 },
      )
    }

    if (ids.length > 1000) {
      return NextResponse.json(
        { success: false, error: { code: 'BAD_REQUEST', message: 'Maximum 1000 IDs per request' } },
        { status: 400 },
      )
    }

    const churchId = await getChurchId()

    switch (action) {
      case 'delete': {
        const authResult = await requireApiAuth('events.delete')
        if (!authResult.authorized) return authResult.response

        const result = await prisma.event.updateMany({
          where: { id: { in: ids }, churchId, deletedAt: null },
          data: { deletedAt: new Date() },
        })
        revalidatePath('/website')
        revalidatePath('/website/events')
        return NextResponse.json({ success: true, data: { affected: result.count } })
      }

      case 'archive': {
        const authResult = await requireApiAuth('events.edit_own')
        if (!authResult.authorized) return authResult.response

        const result = await prisma.event.updateMany({
          where: { id: { in: ids }, churchId },
          data: { status: 'ARCHIVED' },
        })
        revalidatePath('/website')
        revalidatePath('/website/events')
        return NextResponse.json({ success: true, data: { affected: result.count } })
      }

      case 'unarchive': {
        const authResult = await requireApiAuth('events.edit_own')
        if (!authResult.authorized) return authResult.response

        const result = await prisma.event.updateMany({
          where: { id: { in: ids }, churchId },
          data: { status: 'DRAFT' },
        })
        revalidatePath('/website')
        revalidatePath('/website/events')
        return NextResponse.json({ success: true, data: { affected: result.count } })
      }

      case 'publish': {
        const authResult = await requireApiAuth('events.edit_own')
        if (!authResult.authorized) return authResult.response

        // Set status to PUBLISHED and publishedAt only if not already set
        const result = await prisma.event.updateMany({
          where: { id: { in: ids }, churchId },
          data: { status: 'PUBLISHED', publishedAt: new Date() },
        })
        revalidatePath('/website')
        revalidatePath('/website/events')
        return NextResponse.json({ success: true, data: { affected: result.count } })
      }

      case 'unpublish': {
        const authResult = await requireApiAuth('events.edit_own')
        if (!authResult.authorized) return authResult.response

        const result = await prisma.event.updateMany({
          where: { id: { in: ids }, churchId },
          data: { status: 'DRAFT' },
        })
        revalidatePath('/website')
        revalidatePath('/website/events')
        return NextResponse.json({ success: true, data: { affected: result.count } })
      }

      case 'undelete': {
        const authResult = await requireApiAuth('events.delete')
        if (!authResult.authorized) return authResult.response

        const result = await prisma.event.updateMany({
          where: { id: { in: ids }, churchId },
          data: { deletedAt: null },
        })
        revalidatePath('/website')
        revalidatePath('/website/events')
        return NextResponse.json({ success: true, data: { affected: result.count } })
      }

      default:
        return NextResponse.json(
          { success: false, error: { code: 'BAD_REQUEST', message: `Unknown action: ${action}` } },
          { status: 400 },
        )
    }
  } catch (error) {
    console.error('POST /api/v1/events/bulk error:', error)
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Bulk action failed' } },
      { status: 500 },
    )
  }
}
