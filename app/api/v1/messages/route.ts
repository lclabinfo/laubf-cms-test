import { NextRequest, NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'
import { getChurchId } from '@/lib/api/get-church-id'
import { getMessages, createMessage, updateMessage as updateMessageRecord, type MessageFilters } from '@/lib/dal/messages'
import { syncMessageStudy } from '@/lib/dal/sync-message-study'
import { validateAll, validateTitle, validateSlug, validateLongText, validateUrl } from '@/lib/api/validation'
import { requireApiAuth } from '@/lib/api/require-auth'
import { invalidateSermons } from '@/lib/cache/invalidation'

export async function GET(request: NextRequest) {
  try {
    const churchId = await getChurchId()
    const { searchParams } = request.nextUrl

    const sortByParam = searchParams.get('sortBy')
    const sortDirParam = searchParams.get('sortDir')
    const filters: MessageFilters & { page?: number; pageSize?: number } = {
      page: searchParams.get('page') ? Number(searchParams.get('page')) : undefined,
      pageSize: searchParams.get('pageSize') ? Math.min(Number(searchParams.get('pageSize')), 100) : undefined,
      speakerId: searchParams.get('speakerId') ?? undefined,
      speakerName: searchParams.get('speakerName') ?? undefined,
      seriesId: searchParams.get('seriesId') ?? undefined,
      seriesName: searchParams.get('seriesName') ?? undefined,
      search: searchParams.get('search') ?? undefined,
      publishedOnly: searchParams.get('publishedOnly') === 'true',
      videoPublished: searchParams.get('videoPublished') === 'true' || undefined,
      dateFrom: searchParams.get('dateFrom') ?? undefined,
      dateTo: searchParams.get('dateTo') ?? undefined,
      sortBy: sortByParam && ['dateFor', 'title', 'speaker'].includes(sortByParam) ? sortByParam as 'dateFor' | 'title' | 'speaker' : undefined,
      sortDir: sortDirParam && ['asc', 'desc'].includes(sortDirParam) ? sortDirParam as 'asc' | 'desc' : undefined,
      archiveFilter: (searchParams.get('archiveFilter') as 'all' | 'active' | 'archived') ?? undefined,
    }

    const result = await getMessages(churchId, filters)

    const response = NextResponse.json({
      success: true,
      data: result.data,
      pagination: {
        total: result.total,
        page: result.page,
        pageSize: result.pageSize,
        totalPages: result.totalPages,
      },
    })
    response.headers.set('Cache-Control', 'public, s-maxage=60, stale-while-revalidate=300')
    return response
  } catch (error) {
    console.error('GET /api/v1/messages error:', error)
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch messages' } },
      { status: 500 },
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const authResult = await requireApiAuth('messages.create')
    if (!authResult.authorized) return authResult.response

    const churchId = await getChurchId()
    const body = await request.json()

    const validation = validateAll(
      validateTitle(body.title),
      validateSlug(body.slug),
      validateLongText(body.description, 'description'),
      validateLongText(body.body, 'body'),
      validateUrl(body.videoUrl, 'videoUrl'),
      validateUrl(body.audioUrl, 'audioUrl'),
    )
    if (!validation.valid) {
      return NextResponse.json(
        { success: false, error: validation.error },
        { status: 400 },
      )
    }

    // Extract seriesId (not a Message column — handled via MessageSeries join table)
    const { seriesId, ...messageData } = body

    const message = await createMessage(churchId, messageData, seriesId ?? null)

    // Sync study content to BibleStudy table if this message has study material or a transcript
    const studySections = message.studySections as { id: string; title: string; content: string }[] | null
    const hasStudySections = studySections && studySections.length > 0
    const rawTranscript = (message.rawTranscript as string) ?? null
    const hasRawTranscript = rawTranscript && rawTranscript.trim()

    if (message.hasStudy && (hasStudySections || hasRawTranscript)) {
      try {
        await syncMessageStudy({
          messageId: message.id,
          churchId,
          title: message.title,
          slug: message.slug,
          passage: message.passage,
          speakerId: message.speakerId,
          seriesId: seriesId ?? null,
          dateFor: message.dateFor,
          hasStudy: message.hasStudy,
          publishedAt: message.publishedAt,
          studySections,
          attachments: body.attachments as { id: string; name: string; url?: string; type?: string }[] | null,
          bibleVersion: message.bibleVersion,
          existingStudyId: null,
          rawTranscript,
        })
      } catch (syncErr) {
        console.error('POST /api/v1/messages: bible study sync warning:', syncErr)
        // Don't fail the message creation if sync fails
      }
    } else if (message.hasStudy && !hasStudySections && !hasRawTranscript) {
      // hasStudy=true but no study sections and no transcript — auto-correct to hasStudy=false
      try {
        await updateMessageRecord(churchId, message.id, { hasStudy: false })
      } catch (correctErr) {
        console.error('POST /api/v1/messages: hasStudy auto-correct warning:', correctErr)
      }
    }

    // Revalidate public website pages that display messages and bible studies
    revalidatePath('/website')
    revalidatePath('/website/messages')
    revalidatePath('/website/bible-study')
    invalidateSermons(churchId)

    return NextResponse.json({ success: true, data: message }, { status: 201 })
  } catch (error) {
    console.error('POST /api/v1/messages error:', error)
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to create message' } },
      { status: 500 },
    )
  }
}
