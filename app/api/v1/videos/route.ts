import { NextRequest, NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'
import { getChurchId } from '@/lib/api/get-church-id'
import { getVideos, createVideo, type VideoFilters } from '@/lib/dal/videos'
import { ContentStatus, type VideoCategory } from '@/lib/generated/prisma/client'

export async function GET(request: NextRequest) {
  try {
    const churchId = await getChurchId()
    const { searchParams } = request.nextUrl

    const filters: VideoFilters & { page?: number; pageSize?: number } = {
      page: searchParams.get('page') ? Number(searchParams.get('page')) : undefined,
      pageSize: searchParams.get('pageSize') ? Number(searchParams.get('pageSize')) : undefined,
      category: (searchParams.get('category') as VideoCategory) ?? undefined,
      isShort: searchParams.get('isShort') ? searchParams.get('isShort') === 'true' : undefined,
      status: (searchParams.get('status') as ContentStatus) ?? undefined,
    }

    const result = await getVideos(churchId, filters)

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
    console.error('GET /api/v1/videos error:', error)
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch videos' } },
      { status: 500 },
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const churchId = await getChurchId()
    const body = await request.json()

    if (!body.title || !body.slug || !body.youtubeId) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: 'title, slug, and youtubeId are required' } },
        { status: 400 },
      )
    }

    const video = await createVideo(churchId, body)

    // Revalidate public website pages that display videos
    revalidatePath('/website', 'layout')

    return NextResponse.json({ success: true, data: video }, { status: 201 })
  } catch (error) {
    console.error('POST /api/v1/videos error:', error)
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to create video' } },
      { status: 500 },
    )
  }
}
