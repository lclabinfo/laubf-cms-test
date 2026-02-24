import { getMessages } from '@/lib/dal/messages'
import { getSpeakers } from '@/lib/dal/speakers'
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
  const [messagesResult, speakers, series] = await Promise.all([
    getMessages(churchId, { pageSize: 200 }),
    getSpeakers(churchId),
    getAllSeries(churchId),
  ])

  // Transform messages to the shape the client component expects
  const messages = messagesResult.data.map((m) => ({
    id: m.id,
    slug: m.slug,
    title: m.title,
    passage: m.passage || '',
    speaker: m.speaker?.name || 'Unknown',
    series: m.messageSeries?.[0]?.series?.name || '',
    dateFor: m.dateFor instanceof Date ? m.dateFor.toISOString().split('T')[0] : String(m.dateFor),
    description: m.description || '',
    youtubeId: m.youtubeId || '',
    thumbnailUrl: m.thumbnailUrl || (m.youtubeId ? `https://img.youtube.com/vi/${m.youtubeId}/maxresdefault.jpg` : ''),
    duration: m.duration || '',
    rawTranscript: m.rawTranscript || undefined,
    liveTranscript: m.liveTranscript || undefined,
  }))

  return <AllMessagesClient messages={messages} heading={content.heading} />
}
