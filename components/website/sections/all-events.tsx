import { getEvents } from '@/lib/dal/events'
import AllEventsClient from './all-events-client'

interface AllEventsContent {
  heading: string
}

interface Props {
  content: AllEventsContent
  churchId: string
  enableAnimations: boolean
}

export default async function AllEventsSection({ content, churchId }: Props) {
  try {
    const eventsResult = await getEvents(churchId, { pageSize: 200 })

    // Transform events to the shape the client component expects
    const events = eventsResult.data.map((e) => ({
      id: e.id,
      slug: e.slug,
      title: e.title,
      description: e.description || '',
      type: e.type.toLowerCase() as 'event' | 'meeting' | 'program',
      dateStart: e.dateStart instanceof Date ? e.dateStart.toISOString() : String(e.dateStart),
      dateEnd: e.dateEnd instanceof Date ? e.dateEnd.toISOString() : e.dateEnd ? String(e.dateEnd) : null,
      timeStart: e.startTime || '',
      timeEnd: e.endTime || '',
      location: e.location || '',
      locationDetail: e.address || '',
      ministry: e.ministry?.name || '',
      campus: e.campus?.name || '',
      thumbnailUrl: e.coverImage || '',
      isFeatured: e.isFeatured,
      isRecurring: e.isRecurring,
    }))

    return <AllEventsClient events={events} heading={content.heading} />
  } catch (error) {
    console.error('[AllEventsSection] Failed to load events:', error)
    return (
      <div className="py-16 text-center">
        <p className="text-muted-foreground">Events are temporarily unavailable.</p>
      </div>
    )
  }
}
