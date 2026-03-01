import type { TranscriptSegment } from '@/lib/messages-data'
import { aiConfig, isAzureConfigured, AINotConfiguredError } from './config'

interface AzureChatMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

interface AzureChatResponse {
  choices: Array<{
    message: {
      content: string
    }
  }>
}

async function callAzureChat(messages: AzureChatMessage[]): Promise<string> {
  if (!isAzureConfigured()) throw new AINotConfiguredError('Azure OpenAI')

  const { endpoint, deploymentName, apiVersion, apiKey } = aiConfig.azure
  const url = `${endpoint}/openai/deployments/${deploymentName}/chat/completions?api-version=${apiVersion}`

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'api-key': apiKey,
    },
    body: JSON.stringify({
      messages,
      temperature: 0.3,
      max_tokens: 4096,
    }),
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`Azure OpenAI API error (${response.status}): ${errorText}`)
  }

  const data: AzureChatResponse = await response.json()
  return data.choices[0]?.message?.content ?? ''
}

/**
 * Generate a transcript from an audio URL using Azure OpenAI.
 * In practice, Azure OpenAI's Whisper deployment or a speech-to-text
 * service would be used for actual audio transcription. This uses the
 * chat completion API as a placeholder for transcript processing.
 */
export async function generateTranscriptFromAudio(
  audioUrl: string
): Promise<TranscriptSegment[]> {
  if (!isAzureConfigured()) throw new AINotConfiguredError('Azure OpenAI')

  // Note: Full audio transcription requires Azure Speech Services or
  // a Whisper deployment. This is a placeholder that would be replaced
  // with the actual speech-to-text integration.
  const result = await callAzureChat([
    {
      role: 'system',
      content: `You are a transcript processor. When given audio metadata, generate timestamped transcript segments. Return a JSON array of objects with fields: startTime (HH:MM:SS), endTime (HH:MM:SS), text.`,
    },
    {
      role: 'user',
      content: `Process the audio at: ${audioUrl}\n\nReturn the transcript as a JSON array.`,
    },
  ])

  return parseTranscriptResponse(result)
}

/**
 * Improve/clean up an existing transcript — fix grammar, punctuation,
 * speaker labels, and paragraph breaks while preserving timestamps.
 */
export async function improveTranscript(
  rawSegments: TranscriptSegment[]
): Promise<TranscriptSegment[]> {
  if (!isAzureConfigured()) throw new AINotConfiguredError('Azure OpenAI')

  const result = await callAzureChat([
    {
      role: 'system',
      content: `You are a transcript editor. Clean up the following transcript segments: fix grammar, punctuation, and awkward phrasing while preserving the original meaning and timestamps. Return a JSON array of objects with fields: startTime, endTime, text.`,
    },
    {
      role: 'user',
      content: JSON.stringify(
        rawSegments.map((s) => ({
          startTime: s.startTime,
          endTime: s.endTime,
          text: s.text,
        }))
      ),
    },
  ])

  return parseTranscriptResponse(result)
}

/**
 * Align raw text to timestamps based on estimated speech duration.
 * Uses an LLM to split text into logical segments and distribute
 * timestamps across the given duration.
 */
export async function alignTextToTimestamps(
  rawText: string,
  duration: string
): Promise<TranscriptSegment[]> {
  if (!isAzureConfigured()) throw new AINotConfiguredError('Azure OpenAI')

  const result = await callAzureChat([
    {
      role: 'system',
      content: `You are a transcript alignment tool. Given raw text and a total duration, split the text into logical segments (roughly sentence or paragraph-sized) and distribute timestamps evenly across the duration. Return a JSON array of objects with fields: startTime (HH:MM:SS), endTime (HH:MM:SS), text.`,
    },
    {
      role: 'user',
      content: `Total duration: ${duration}\n\nText to align:\n${rawText}`,
    },
  ])

  return parseTranscriptResponse(result)
}

function parseTranscriptResponse(content: string): TranscriptSegment[] {
  // Extract JSON array from the response (it may be wrapped in markdown code blocks)
  const jsonMatch = content.match(/\[[\s\S]*\]/)
  if (!jsonMatch) {
    throw new Error('Failed to parse transcript response: no JSON array found')
  }

  let parsed: Array<{
    startTime: string
    endTime: string
    text: string
  }>
  try {
    parsed = JSON.parse(jsonMatch[0])
  } catch {
    throw new Error('AI returned invalid JSON response. Please try again.')
  }

  return parsed.map((segment, i) => ({
    id: `ai-${Date.now()}-${i}`,
    startTime: segment.startTime,
    endTime: segment.endTime,
    text: segment.text,
  }))
}
