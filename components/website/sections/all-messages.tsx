import { getMessages } from '@/lib/dal/messages'
import { getAllSeries } from '@/lib/dal/series'
import AllMessagesClient from './all-messages-client'

interface AllMessagesContent {
  // Grid layout
  columns?: { desktop?: number; tablet?: number; mobile?: number }
  cardGap?: 'tight' | 'default' | 'spacious'
  itemsPerPage?: number
  // Card element toggles
  showDate?: boolean
  showSeriesPill?: boolean
  showSpeaker?: boolean
  showPassage?: boolean
  showDuration?: boolean
}

interface Props {
  content: AllMessagesContent
  churchId: string
  enableAnimations: boolean
  colorScheme?: string
  paddingY?: string
  containerWidth?: string
}

export default async function AllMessagesSection({
  content,
  churchId,
  colorScheme = 'light',
  paddingY = 'default',
  containerWidth = 'standard',
}: Props) {
  try {
    const [messagesResult] = await Promise.all([
      getMessages(churchId, { pageSize: 200, videoPublished: true }),
      getAllSeries(churchId),
    ])

    // Only include messages that have an actual video source (youtubeId or videoUrl)
    const withVideo = messagesResult.data.filter((m) => m.youtubeId || m.videoUrl)

    // Transform messages to the shape the client component expects
    const messages = withVideo.map((m) => ({
      id: m.id,
      slug: m.slug,
      title: m.title,
      videoTitle: m.videoTitle || undefined,
      passage: m.passage || '',
      speaker: m.speaker
        ? (m.speaker.preferredName
          ? `${m.speaker.preferredName} ${m.speaker.lastName}`
          : `${m.speaker.firstName} ${m.speaker.lastName}`)
        : 'Unknown',
      series: m.messageSeries?.[0]?.series?.name || '',
      dateFor: m.dateFor instanceof Date ? m.dateFor.toISOString().split('T')[0] : String(m.dateFor),
      youtubeId: m.youtubeId || '',
      videoUrl: m.videoUrl || '',
      thumbnailUrl: m.thumbnailUrl || (m.youtubeId ? `https://img.youtube.com/vi/${m.youtubeId}/hqdefault.jpg` : ''),
      duration: m.duration || '',
      hasVideo: m.hasVideo,
      rawTranscript: undefined,
      liveTranscript: undefined,
    }))

    const layoutConfig = {
      columns: {
        desktop: content.columns?.desktop ?? 3,
        tablet: content.columns?.tablet ?? 2,
        mobile: content.columns?.mobile ?? 1,
      },
      cardGap: content.cardGap ?? 'default',
      itemsPerPage: content.itemsPerPage ?? 50,
      showDate: content.showDate ?? true,
      showSeriesPill: content.showSeriesPill ?? true,
      showSpeaker: content.showSpeaker ?? true,
      showPassage: content.showPassage ?? true,
      showDuration: content.showDuration ?? true,
    }

    return (
      <AllMessagesClient
        messages={messages}
        layout={layoutConfig}
        colorScheme={colorScheme}
        paddingY={paddingY}
        containerWidth={containerWidth}
      />
    )
  } catch (error) {
    console.error('[AllMessagesSection] Failed to load messages:', error)
    return (
      <div className="py-16 text-center">
        <p className="text-muted-foreground">Messages are temporarily unavailable.</p>
      </div>
    )
  }
}
