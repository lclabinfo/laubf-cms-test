import type { TranscriptSegment } from '@/lib/messages-data'
import { aiConfig, isYouTubeConfigured, AINotConfiguredError } from './config'

interface YouTubeCaptionTrack {
  id: string
  snippet: {
    language: string
    name: string
    trackKind: string // 'standard' | 'ASR' (auto-generated)
  }
}

interface YouTubeCaptionsListResponse {
  items: YouTubeCaptionTrack[]
}

/**
 * Fetch captions for a YouTube video. Prefers manual captions over
 * auto-generated ones. Returns parsed TranscriptSegment[].
 */
export async function fetchYouTubeCaptions(
  videoId: string
): Promise<TranscriptSegment[]> {
  if (!isYouTubeConfigured()) throw new AINotConfiguredError('YouTube Data API')

  const apiKey = aiConfig.youtube.apiKey

  // 1. List available caption tracks
  const listUrl = `https://www.googleapis.com/youtube/v3/captions?part=snippet&videoId=${videoId}&key=${apiKey}`
  const listResponse = await fetch(listUrl)

  if (!listResponse.ok) {
    const errorText = await listResponse.text()
    throw new Error(`YouTube API error (${listResponse.status}): ${errorText}`)
  }

  const listData: YouTubeCaptionsListResponse = await listResponse.json()

  if (!listData.items || listData.items.length === 0) {
    throw new Error('No captions available for this video')
  }

  // Prefer manual captions ('standard') over auto-generated ('ASR')
  const manualTrack = listData.items.find(
    (t) => t.snippet.trackKind === 'standard'
  )
  const track = manualTrack ?? listData.items[0]

  // 2. Download the caption track in SRT format
  const downloadUrl = `https://www.googleapis.com/youtube/v3/captions/${track.id}?tfmt=srt&key=${apiKey}`
  const downloadResponse = await fetch(downloadUrl, {
    headers: {
      Authorization: `Bearer ${apiKey}`,
    },
  })

  if (!downloadResponse.ok) {
    // Caption download often requires OAuth; fall back to a message
    throw new Error(
      'Caption download requires OAuth authorization. YouTube API key alone is not sufficient for downloading caption content. Please use the YouTube Studio export feature and upload the SRT file directly.'
    )
  }

  const srtContent = await downloadResponse.text()
  return parseSrt(srtContent)
}

/**
 * Fetch video metadata (title, description, duration) from YouTube.
 */
export async function fetchYouTubeVideoMetadata(videoId: string) {
  if (!isYouTubeConfigured()) throw new AINotConfiguredError('YouTube Data API')

  const apiKey = aiConfig.youtube.apiKey
  const url = `https://www.googleapis.com/youtube/v3/videos?part=snippet,contentDetails&id=${videoId}&key=${apiKey}`

  const response = await fetch(url)
  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`YouTube API error (${response.status}): ${errorText}`)
  }

  const data = await response.json()
  const video = data.items?.[0]

  if (!video) {
    throw new Error('Video not found')
  }

  return {
    title: video.snippet.title as string,
    description: video.snippet.description as string,
    duration: video.contentDetails.duration as string,
    thumbnailUrl: (video.snippet.thumbnails?.maxres?.url ??
      video.snippet.thumbnails?.high?.url ??
      video.snippet.thumbnails?.default?.url) as string,
  }
}

function parseSrt(text: string): TranscriptSegment[] {
  const blocks = text.trim().split(/\n\s*\n/)
  const segments: TranscriptSegment[] = []

  for (const block of blocks) {
    const lines = block.trim().split('\n')
    if (lines.length < 3) continue

    const timeLine = lines[1]
    const timeMatch = timeLine.match(
      /(\d{2}:\d{2}:\d{2})[,.]?\d*\s*-->\s*(\d{2}:\d{2}:\d{2})/
    )
    if (!timeMatch) continue

    segments.push({
      id: `yt-${Date.now()}-${segments.length}`,
      startTime: timeMatch[1],
      endTime: timeMatch[2],
      text: lines.slice(2).join(' ').trim(),
    })
  }

  return segments
}
