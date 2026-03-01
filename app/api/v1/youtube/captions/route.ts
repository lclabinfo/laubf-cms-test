import { NextRequest, NextResponse } from 'next/server'
import { isYouTubeConfigured, AINotConfiguredError } from '@/lib/ai/config'
import { fetchYouTubeCaptions } from '@/lib/ai/youtube-client'
import { requireApiAuth } from '@/lib/api/require-auth'

export async function GET(request: NextRequest) {
  try {
    const authResult = await requireApiAuth('EDITOR')
    if (!authResult.authorized) return authResult.response

    if (!isYouTubeConfigured()) {
      return NextResponse.json(
        { success: false, error: { code: 'SERVICE_UNAVAILABLE', message: 'YouTube Data API is not configured. Please add YOUTUBE_API_KEY to your environment variables.' } },
        { status: 503 }
      )
    }

    const { searchParams } = new URL(request.url)
    const videoId = searchParams.get('videoId')

    if (!videoId) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: 'videoId query parameter is required' } },
        { status: 400 }
      )
    }

    const segments = await fetchYouTubeCaptions(videoId)
    return NextResponse.json({ success: true, data: segments })
  } catch (error) {
    if (error instanceof AINotConfiguredError) {
      return NextResponse.json(
        { success: false, error: { code: 'SERVICE_UNAVAILABLE', message: error.message } },
        { status: 503 }
      )
    }
    console.error('GET /api/v1/youtube/captions error:', error)
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: error instanceof Error ? error.message : 'Failed to fetch captions' } },
      { status: 500 }
    )
  }
}
