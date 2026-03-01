import { NextRequest, NextResponse } from 'next/server'
import { isYouTubeConfigured, AINotConfiguredError } from '@/lib/ai/config'
import { fetchYouTubeCaptions } from '@/lib/ai/youtube-client'

export async function GET(request: NextRequest) {
  try {
    if (!isYouTubeConfigured()) {
      return NextResponse.json(
        {
          error: 'AI service not configured',
          message:
            'YouTube Data API is not configured. Please add YOUTUBE_API_KEY to your environment variables.',
        },
        { status: 503 }
      )
    }

    const { searchParams } = new URL(request.url)
    const videoId = searchParams.get('videoId')

    if (!videoId) {
      return NextResponse.json(
        { error: 'Invalid request', message: 'videoId query parameter is required' },
        { status: 400 }
      )
    }

    const segments = await fetchYouTubeCaptions(videoId)
    return NextResponse.json({ success: true, data: segments })
  } catch (error) {
    if (error instanceof AINotConfiguredError) {
      return NextResponse.json(
        { error: 'AI service not configured', message: error.message },
        { status: 503 }
      )
    }
    console.error('GET /api/v1/youtube/captions error:', error)
    return NextResponse.json(
      {
        error: 'Internal error',
        message:
          error instanceof Error ? error.message : 'Failed to fetch captions',
      },
      { status: 500 }
    )
  }
}
