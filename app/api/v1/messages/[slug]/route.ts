import { NextRequest, NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'
import { getChurchId } from '@/lib/api/get-church-id'
import { getMessageBySlug, getMessageById, updateMessage, deleteMessage, archiveMessage, unarchiveMessage } from '@/lib/dal/messages'
import { syncMessageStudy, unlinkMessageStudy } from '@/lib/dal/sync-message-study'
import { requireApiAuth } from '@/lib/api/require-auth'

type Params = { params: Promise<{ slug: string }> }

export async function GET(_request: NextRequest, { params }: Params) {
  try {
    const churchId = await getChurchId()
    const { slug } = await params

    // Support lookup by UUID (for detail pages that navigate by ID)
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(slug)
    const message = isUuid
      ? await getMessageById(churchId, slug)
      : await getMessageBySlug(churchId, slug)
    if (!message) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Message not found' } },
        { status: 404 },
      )
    }

    const response = NextResponse.json({ success: true, data: message })
    response.headers.set('Cache-Control', 'public, s-maxage=60, stale-while-revalidate=300')
    return response
  } catch (error) {
    console.error('GET /api/v1/messages/[slug] error:', error)
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch message' } },
      { status: 500 },
    )
  }
}

export async function PATCH(request: NextRequest, { params }: Params) {
  try {
    const authResult = await requireApiAuth('messages.edit_own')
    if (!authResult.authorized) return authResult.response

    const churchId = await getChurchId()
    const { slug } = await params
    const body = await request.json()

    const existing = await getMessageBySlug(churchId, slug, { publishedOnly: false })
    if (!existing) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Message not found' } },
        { status: 404 },
      )
    }

    // Handle archive/unarchive actions
    if (body.action === 'archive') {
      const result = await archiveMessage(churchId, existing.id)
      revalidatePath('/website')
      revalidatePath('/website/messages')
      revalidatePath('/website/bible-study')
      return NextResponse.json({ success: true, data: result })
    }
    if (body.action === 'unarchive') {
      const result = await unarchiveMessage(churchId, existing.id)
      revalidatePath('/website')
      revalidatePath('/website/messages')
      revalidatePath('/website/bible-study')
      return NextResponse.json({ success: true, data: result })
    }

    // Extract seriesId (not a Message column — handled via MessageSeries join table)
    // Use a sentinel to distinguish "not provided" from "explicitly null"
    const hasSeriesId = 'seriesId' in body
    const { seriesId, ...messageData } = body

    const updated = await updateMessage(
      churchId,
      existing.id,
      messageData,
      hasSeriesId ? (seriesId ?? null) : undefined,
    )

    // Sync study content to BibleStudy table
    try {
      const effectiveHasStudy = 'hasStudy' in body ? body.hasStudy : existing.hasStudy
      const effectiveStudySections = 'studySections' in body
        ? body.studySections
        : (existing.studySections as { id: string; title: string; content: string }[] | null)

      // Resolve the effective rawTranscript (Video tab transcript) for the sync
      const effectiveRawTranscript = 'rawTranscript' in body
        ? body.rawTranscript
        : (updated.rawTranscript ?? null)

      const hasStudySections = effectiveStudySections && effectiveStudySections.length > 0
      const hasRawTranscript = effectiveRawTranscript && effectiveRawTranscript.trim()

      // Sync when there's study content OR a transcript from the Video tab
      if (effectiveHasStudy && (hasStudySections || hasRawTranscript)) {
        // Resolve the series ID for the linked BibleStudy
        const effectiveSeriesId = hasSeriesId
          ? (seriesId ?? null)
          : ((existing.messageSeries ?? []).length > 0
            ? existing.messageSeries[0].seriesId
            : null)

        const effectiveAttachments = 'attachments' in body
          ? body.attachments
          : (existing.relatedStudy?.attachments ?? []).map((att: { id: string; name: string; url: string; type: string; fileSize: number | null }) => ({
              id: att.id,
              name: att.name,
              url: att.url,
              type: att.type,
            }))

        await syncMessageStudy({
          messageId: updated.id,
          churchId,
          title: updated.title,
          slug: updated.slug,
          passage: updated.passage,
          speakerId: updated.speakerId,
          seriesId: effectiveSeriesId,
          dateFor: updated.dateFor,
          hasStudy: updated.hasStudy,
          publishedAt: updated.publishedAt,
          studySections: effectiveStudySections,
          attachments: effectiveAttachments,
          bibleVersion: updated.bibleVersion,
          existingStudyId: updated.relatedStudyId,
          rawTranscript: effectiveRawTranscript,
        })
      } else if (effectiveHasStudy && !hasStudySections && !hasRawTranscript) {
        // hasStudy=true but no study sections and no transcript — auto-correct to hasStudy=false
        await updateMessage(churchId, updated.id, { hasStudy: false })
        if (updated.relatedStudyId) {
          await unlinkMessageStudy(updated.id, updated.relatedStudyId)
        }
      } else if (!effectiveHasStudy && updated.relatedStudyId) {
        // Study was removed — unlink and soft-delete the BibleStudy
        await unlinkMessageStudy(updated.id, updated.relatedStudyId)
      }
    } catch (syncErr) {
      console.error('PATCH /api/v1/messages/[slug]: bible study sync warning:', syncErr)
    }

    // Revalidate public website pages that display messages and bible studies
    revalidatePath('/website')
    revalidatePath('/website/messages')
    revalidatePath('/website/bible-study')

    return NextResponse.json({ success: true, data: updated })
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to update message'
    const errorStack = error instanceof Error ? error.stack : undefined
    console.error('PATCH /api/v1/messages/[slug] error:', errorMessage)
    if (errorStack) console.error(errorStack)
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: errorMessage } },
      { status: 500 },
    )
  }
}

export async function DELETE(_request: NextRequest, { params }: Params) {
  try {
    const authResult = await requireApiAuth('messages.delete')
    if (!authResult.authorized) return authResult.response

    const churchId = await getChurchId()
    const { slug } = await params

    const existing = await getMessageBySlug(churchId, slug, { publishedOnly: false })
    if (!existing) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Message not found' } },
        { status: 404 },
      )
    }

    // If message has a linked BibleStudy, soft-delete it too
    if (existing.relatedStudyId) {
      try {
        await unlinkMessageStudy(existing.id, existing.relatedStudyId)
      } catch (syncErr) {
        console.error('DELETE /api/v1/messages/[slug]: bible study unlink warning:', syncErr)
      }
    }

    await deleteMessage(churchId, existing.id)

    // Revalidate public website pages that display messages and bible studies
    revalidatePath('/website')
    revalidatePath('/website/messages')
    revalidatePath('/website/bible-study')

    return NextResponse.json({ success: true, data: { deleted: true } })
  } catch (error) {
    console.error('DELETE /api/v1/messages/[slug] error:', error)
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to delete message' } },
      { status: 500 },
    )
  }
}
