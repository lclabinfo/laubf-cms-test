import { NextRequest, NextResponse } from 'next/server'
import { isAzureConfigured, AINotConfiguredError } from '@/lib/ai/config'
import { improveTranscript } from '@/lib/ai/azure-client'

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
    const { segments } = body

    if (!Array.isArray(segments) || segments.length === 0) {
      return NextResponse.json(
        { error: 'Invalid request', message: 'segments array is required' },
        { status: 400 }
      )
    }

    const cleaned = await improveTranscript(segments)
    return NextResponse.json({ success: true, data: cleaned })
  } catch (error) {
    if (error instanceof AINotConfiguredError) {
      return NextResponse.json(
        { error: 'AI service not configured', message: error.message },
        { status: 503 }
      )
    }
    console.error('POST /api/v1/ai/cleanup-captions error:', error)
    return NextResponse.json(
      {
        error: 'Internal error',
        message:
          error instanceof Error ? error.message : 'Failed to clean up captions',
      },
      { status: 500 }
    )
  }
}
