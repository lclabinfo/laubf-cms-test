import { getEvents, getEventFilterMeta } from '@/lib/dal/events'
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
    const PAGE_SIZE = 48
    const [eventsResult, filterMeta] = await Promise.all([
      getEvents(churchId, { pageSize: PAGE_SIZE }),
      getEventFilterMeta(churchId),
    ])

    // Transform events to the shape the client component expects
    const events = eventsResult.data.map((e) => ({
      id: e.id,
      slug: e.slug,
      title: e.title,
      description: e.description || '',
      type: e.type.toLowerCase() as 'event' | 'meeting' | 'program',
      dateStart: e.dateStart instanceof Date
        ? `${e.dateStart.getUTCFullYear()}-${String(e.dateStart.getUTCMonth() + 1).padStart(2, '0')}-${String(e.dateStart.getUTCDate()).padStart(2, '0')}`
        : String(e.dateStart).slice(0, 10),
      dateEnd: e.dateEnd
        ? (e.dateEnd instanceof Date
            ? `${e.dateEnd.getUTCFullYear()}-${String(e.dateEnd.getUTCMonth() + 1).padStart(2, '0')}-${String(e.dateEnd.getUTCDate()).padStart(2, '0')}`
            : String(e.dateEnd).slice(0, 10))
        : null,
      timeStart: e.startTime || '',
      timeEnd: e.endTime || '',
      location: e.location || '',
      locationDetail: e.address || '',
      ministry: e.ministry?.name || '',
      campus: e.campus?.name || '',
      thumbnailUrl: e.coverImage || '',
      isFeatured: e.isFeatured,
      isRecurring: e.isRecurring,
      recurrenceSchedule: e.recurrenceSchedule || '',
    }))

    const pagination = {
      total: eventsResult.total,
      page: eventsResult.page,
      pageSize: eventsResult.pageSize,
      totalPages: eventsResult.totalPages,
    }

    return <AllEventsClient events={events} heading={content.heading} filterMeta={filterMeta} pagination={pagination} />
  } catch (error) {
    console.error('[AllEventsSection] Failed to load events:', error)
    return (
      <div className="py-16 text-center">
        <p className="text-muted-foreground">Events are temporarily unavailable.</p>
      </div>
    )
  }
}
