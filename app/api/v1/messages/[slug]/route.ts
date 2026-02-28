import { NextRequest, NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'
import { getChurchId } from '@/lib/api/get-church-id'
import { getMessageBySlug, updateMessage, deleteMessage } from '@/lib/dal/messages'
import { syncMessageStudy, unlinkMessageStudy } from '@/lib/dal/sync-message-study'
import { requireApiAuth } from '@/lib/api/require-auth'

type Params = { params: Promise<{ slug: string }> }

export async function GET(_request: NextRequest, { params }: Params) {
  try {
    const churchId = await getChurchId()
    const { slug } = await params

    const message = await getMessageBySlug(churchId, slug)
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
    const authResult = await requireApiAuth('EDITOR')
    if (!authResult.authorized) return authResult.response

    const churchId = await getChurchId()
    const { slug } = await params
    const body = await request.json()

    const existing = await getMessageBySlug(churchId, slug)
    if (!existing) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Message not found' } },
        { status: 404 },
      )
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

      if (effectiveHasStudy && effectiveStudySections) {
        // Resolve the series ID for the linked BibleStudy
        const effectiveSeriesId = hasSeriesId
          ? (seriesId ?? null)
          : ((existing.messageSeries ?? []).length > 0
            ? existing.messageSeries[0].seriesId
            : null)

        await syncMessageStudy({
          messageId: updated.id,
          churchId,
          title: updated.title,
          slug: updated.slug,
          passage: updated.passage,
          speakerId: updated.speakerId,
          seriesId: effectiveSeriesId,
          dateFor: updated.dateFor,
          status: updated.status,
          publishedAt: updated.publishedAt,
          studySections: effectiveStudySections,
          bibleVersion: updated.bibleVersion,
          existingStudyId: updated.relatedStudyId,
        })
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
    revalidatePath('/website/bible-studies')

    return NextResponse.json({ success: true, data: updated })
  } catch (error) {
    console.error('PATCH /api/v1/messages/[slug] error:', error)
    const errorMessage = error instanceof Error ? error.message : 'Failed to update message'
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: errorMessage } },
      { status: 500 },
    )
  }
}

export async function DELETE(_request: NextRequest, { params }: Params) {
  try {
    const authResult = await requireApiAuth('ADMIN')
    if (!authResult.authorized) return authResult.response

    const churchId = await getChurchId()
    const { slug } = await params

    const existing = await getMessageBySlug(churchId, slug)
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
    revalidatePath('/website/bible-studies')

    return NextResponse.json({ success: true, data: { deleted: true } })
  } catch (error) {
    console.error('DELETE /api/v1/messages/[slug] error:', error)
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to delete message' } },
      { status: 500 },
    )
  }
}
