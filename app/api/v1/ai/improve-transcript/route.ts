import { NextRequest, NextResponse } from 'next/server'
import { isAzureConfigured, AINotConfiguredError } from '@/lib/ai/config'
import { improveTranscript } from '@/lib/ai/azure-client'
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
    const { segments } = body

    if (!Array.isArray(segments) || segments.length === 0) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: 'segments array is required' } },
        { status: 400 }
      )
    }

    const improved = await improveTranscript(segments)
    return NextResponse.json({ success: true, data: improved })
  } catch (error) {
    if (error instanceof AINotConfiguredError) {
      return NextResponse.json(
        { success: false, error: { code: 'SERVICE_UNAVAILABLE', message: error.message } },
        { status: 503 }
      )
    }
    console.error('POST /api/v1/ai/improve-transcript error:', error)
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: error instanceof Error ? error.message : 'Failed to improve transcript' } },
      { status: 500 }
    )
  }
}
