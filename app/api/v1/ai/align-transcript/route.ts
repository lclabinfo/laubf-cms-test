import { NextRequest, NextResponse } from 'next/server'
import { isAzureConfigured, AINotConfiguredError } from '@/lib/ai/config'
import { alignTextToTimestamps } from '@/lib/ai/azure-client'
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
    const { rawText, duration } = body

    if (!rawText || typeof rawText !== 'string') {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: 'rawText is required' } },
        { status: 400 }
      )
    }

    if (!duration || typeof duration !== 'string') {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: 'duration is required' } },
        { status: 400 }
      )
    }

    const segments = await alignTextToTimestamps(rawText, duration)
    return NextResponse.json({ success: true, data: segments })
  } catch (error) {
    if (error instanceof AINotConfiguredError) {
      return NextResponse.json(
        { success: false, error: { code: 'SERVICE_UNAVAILABLE', message: error.message } },
        { status: 503 }
      )
    }
    console.error('POST /api/v1/ai/align-transcript error:', error)
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: error instanceof Error ? error.message : 'Failed to align transcript' } },
      { status: 500 }
    )
  }
}
