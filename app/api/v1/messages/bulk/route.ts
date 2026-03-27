import { NextRequest, NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'
import { getChurchId } from '@/lib/api/get-church-id'
import { bulkDeleteMessages, bulkArchiveMessages, bulkUnarchiveMessages } from '@/lib/dal/messages'
import { unlinkMessageStudy } from '@/lib/dal/sync-message-study'
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
        { success: false, error: { code: 'VALIDATION_ERROR', message: 'Maximum 1000 items per bulk operation' } },
        { status: 400 },
      )
    }

    const churchId = await getChurchId()

    switch (action) {
      case 'delete': {
        const authResult = await requireApiAuth('messages.delete')
        if (!authResult.authorized) return authResult.response

        // Unlink bible studies for all messages being deleted
        const messages = await prisma.message.findMany({
          where: { id: { in: ids }, churchId, deletedAt: null },
          select: { id: true, relatedStudyId: true },
        })
        for (const msg of messages) {
          if (msg.relatedStudyId) {
            try {
              await unlinkMessageStudy(msg.id, msg.relatedStudyId)
            } catch (e) {
              console.error('bulk delete: unlink study warning:', e)
            }
          }
        }

        const result = await bulkDeleteMessages(churchId, ids)
        revalidatePath('/website')
        revalidatePath('/website/messages')
        revalidatePath('/website/bible-study')
        return NextResponse.json({ success: true, data: { affected: result.count } })
      }

      case 'archive': {
        const authResult = await requireApiAuth('messages.edit_own')
        if (!authResult.authorized) return authResult.response

        const result = await bulkArchiveMessages(churchId, ids)
        revalidatePath('/website')
        revalidatePath('/website/messages')
        revalidatePath('/website/bible-study')
        return NextResponse.json({ success: true, data: { affected: result.count } })
      }

      case 'unarchive': {
        const authResult = await requireApiAuth('messages.edit_own')
        if (!authResult.authorized) return authResult.response

        const result = await bulkUnarchiveMessages(churchId, ids)
        revalidatePath('/website')
        revalidatePath('/website/messages')
        revalidatePath('/website/bible-study')
        return NextResponse.json({ success: true, data: { affected: result.count } })
      }

      case 'undelete': {
        const authResult = await requireApiAuth('messages.delete')
        if (!authResult.authorized) return authResult.response

        // Restore soft-deleted messages by clearing deletedAt
        const result = await prisma.message.updateMany({
          where: { id: { in: ids }, churchId },
          data: { deletedAt: null },
        })
        revalidatePath('/website')
        revalidatePath('/website/messages')
        revalidatePath('/website/bible-study')
        return NextResponse.json({ success: true, data: { affected: result.count } })
      }

      default:
        return NextResponse.json(
          { success: false, error: { code: 'BAD_REQUEST', message: `Unknown action: ${action}` } },
          { status: 400 },
        )
    }
  } catch (error) {
    console.error('POST /api/v1/messages/bulk error:', error)
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Bulk action failed' } },
      { status: 500 },
    )
  }
}
