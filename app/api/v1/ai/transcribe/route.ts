import { NextRequest, NextResponse } from 'next/server'
import { isAzureConfigured, AINotConfiguredError } from '@/lib/ai/config'
import { generateTranscriptFromAudio } from '@/lib/ai/azure-client'

export async function POST(request: NextRequest) {
  try {
    if (!isAzureConfigured()) {
      return NextResponse.json(
        {
          error: 'AI service not configured',
          message:
            'Azure OpenAI is not configured. Please add AZURE_OPENAI_API_KEY, AZURE_OPENAI_ENDPOINT, and AZURE_OPENAI_DEPLOYMENT_NAME to your environment variables.',
        },
        { status: 503 }
      )
    }

    const body = await request.json()
    const { videoUrl } = body

    if (!videoUrl || typeof videoUrl !== 'string') {
      return NextResponse.json(
        { error: 'Invalid request', message: 'videoUrl is required' },
        { status: 400 }
      )
    }

    const segments = await generateTranscriptFromAudio(videoUrl)
    return NextResponse.json({ success: true, data: segments })
  } catch (error) {
    if (error instanceof AINotConfiguredError) {
      return NextResponse.json(
        { error: 'AI service not configured', message: error.message },
        { status: 503 }
      )
    }
    console.error('POST /api/v1/ai/transcribe error:', error)
    return NextResponse.json(
      {
        error: 'Internal error',
        message:
          error instanceof Error ? error.message : 'Failed to generate transcript',
      },
      { status: 500 }
    )
  }
}
