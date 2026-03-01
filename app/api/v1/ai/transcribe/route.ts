import { NextRequest, NextResponse } from 'next/server'
import { isAzureConfigured, AINotConfiguredError } from '@/lib/ai/config'
import { generateTranscriptFromAudio } from '@/lib/ai/azure-client'
import { requireApiAuth } from '@/lib/api/require-auth'

export async function POST(request: NextRequest) {
  try {
    const authResult = await requireApiAuth('EDITOR')
    if (!authResult.authorized) return authResult.response

    if (!isAzureConfigured()) {
      return NextResponse.json(
        { success: false, error: { code: 'SERVICE_UNAVAILABLE', message: 'Azure OpenAI is not configured. Please add AZURE_OPENAI_API_KEY, AZURE_OPENAI_ENDPOINT, and AZURE_OPENAI_DEPLOYMENT_NAME to your environment variables.' } },
        { status: 503 }
      )
    }

    const body = await request.json()
    const { videoUrl } = body

    if (!videoUrl || typeof videoUrl !== 'string') {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: 'videoUrl is required' } },
        { status: 400 }
      )
    }

    const segments = await generateTranscriptFromAudio(videoUrl)
    return NextResponse.json({ success: true, data: segments })
  } catch (error) {
    if (error instanceof AINotConfiguredError) {
      return NextResponse.json(
        { success: false, error: { code: 'SERVICE_UNAVAILABLE', message: error.message } },
        { status: 503 }
      )
    }
    console.error('POST /api/v1/ai/transcribe error:', error)
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: error instanceof Error ? error.message : 'Failed to generate transcript' } },
      { status: 500 }
    )
  }
}
