import { NextRequest, NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'
import { getChurchId } from '@/lib/api/get-church-id'
import { getBibleStudies, createBibleStudy, type BibleStudyFilters } from '@/lib/dal/bible-studies'
import { ContentStatus, type BibleBook } from '@/lib/generated/prisma/client'

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

    return NextResponse.json({
      success: true,
      data: result.data,
      pagination: {
        total: result.total,
        page: result.page,
        pageSize: result.pageSize,
        totalPages: result.totalPages,
      },
    })
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

    const study = await createBibleStudy(churchId, body)

    // Revalidate public website pages that display bible studies
    revalidatePath('/website', 'layout')

    return NextResponse.json({ success: true, data: study }, { status: 201 })
  } catch (error) {
    console.error('POST /api/v1/bible-studies error:', error)
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to create bible study' } },
      { status: 500 },
    )
  }
}
