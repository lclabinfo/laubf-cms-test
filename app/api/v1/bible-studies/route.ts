import { NextRequest, NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'
import { getChurchId } from '@/lib/api/get-church-id'
import { getBibleStudies, createBibleStudy, type BibleStudyFilters } from '@/lib/dal/bible-studies'
import { ContentStatus, type BibleBook } from '@/lib/generated/prisma/client'
import { validateAll, validateTitle, validateSlug, validateEnum, CONTENT_STATUS_VALUES } from '@/lib/api/validation'

export async function GET(request: NextRequest) {
  try {
    const churchId = await getChurchId()
    const { searchParams } = request.nextUrl

    const filters: BibleStudyFilters & { page?: number; pageSize?: number } = {
      page: searchParams.get('page') ? Number(searchParams.get('page')) : undefined,
      pageSize: searchParams.get('pageSize') ? Number(searchParams.get('pageSize')) : undefined,
      book: (searchParams.get('book') as BibleBook) ?? undefined,
      seriesId: searchParams.get('seriesId') ?? undefined,
      speakerId: searchParams.get('speakerId') ?? undefined,
      status: (searchParams.get('status') as ContentStatus) ?? undefined,
    }

    const result = await getBibleStudies(churchId, filters)

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
    console.error('GET /api/v1/bible-studies error:', error)
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch bible studies' } },
      { status: 500 },
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const churchId = await getChurchId()
    const body = await request.json()

    if (!body.title || !body.slug) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: 'title and slug are required' } },
        { status: 400 },
      )
    }

    const validation = validateAll(
      validateTitle(body.title),
      validateSlug(body.slug),
      validateEnum(body.status, CONTENT_STATUS_VALUES, 'status'),
    )
    if (!validation.valid) {
      return NextResponse.json(
        { success: false, error: validation.error },
        { status: 400 },
      )
    }

    const study = await createBibleStudy(churchId, body)

    // Revalidate public website pages that display bible studies
    revalidatePath('/website')
    revalidatePath('/website/bible-studies')

    return NextResponse.json({ success: true, data: study }, { status: 201 })
  } catch (error) {
    console.error('POST /api/v1/bible-studies error:', error)
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to create bible study' } },
      { status: 500 },
    )
  }
}
