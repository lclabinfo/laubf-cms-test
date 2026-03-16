import { getMessages } from '@/lib/dal/messages'
import { getAllSeries } from '@/lib/dal/series'
import AllMessagesClient from './all-messages-client'

interface AllMessagesContent {
  heading: string
}

interface Props {
  content: AllMessagesContent
  churchId: string
  enableAnimations: boolean
}

export default async function AllMessagesSection({ content, churchId }: Props) {
  try {
    const [messagesResult, series] = await Promise.all([
      getMessages(churchId, { pageSize: 200, videoPublished: true }),
      getAllSeries(churchId),
    ])

    // Transform messages to the shape the client component expects
    const messages = messagesResult.data.map((m) => ({
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
      rawTranscript: m.rawTranscript || undefined,
      liveTranscript: m.liveTranscript || undefined,
    }))

    return <AllMessagesClient messages={messages} heading={content.heading} />
  } catch (error) {
    console.error('[AllMessagesSection] Failed to load messages:', error)
    return (
      <div className="py-16 text-center">
        <p className="text-muted-foreground">Messages are temporarily unavailable.</p>
      </div>
    )
  }
}
