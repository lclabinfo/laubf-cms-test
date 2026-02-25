import { getLatestMessage } from '@/lib/dal/messages'
import { getFeaturedEvents, getUpcomingEvents, getEvents } from '@/lib/dal/events'
import { getVideos } from '@/lib/dal/videos'
import { getBibleStudies } from '@/lib/dal/bible-studies'
import { getTodaysDailyBread } from '@/lib/dal/daily-bread'
import type { SectionType } from '@/lib/db/types'

type Content = Record<string, unknown>

/**
 * Resolves `dataSource` references in section content by fetching
 * the corresponding data from the DAL and merging it into the content
 * object (or returning it as a separate `resolvedData` payload).
 *
 * Sections that are async Server Components (ALL_MESSAGES, ALL_EVENTS)
 * fetch their own data internally and don't need resolution here.
 */
export async function resolveSectionData(
  churchId: string,
  sectionType: SectionType,
  content: Content,
): Promise<{ content: Content; resolvedData?: Record<string, unknown> }> {
  const dataSource = content.dataSource as string | undefined
  if (!dataSource) return { content }

  switch (dataSource) {
    case 'latest-message': {
      const message = await getLatestMessage(churchId)
      if (!message) return { content }

      const dateLabel = message.dateFor
        ? new Date(message.dateFor).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }).toUpperCase()
        : ''

      return {
        content: {
          ...content,
          sermon: {
            slug: message.slug,
            title: message.title,
            speaker: message.speaker?.name || 'Unknown',
            date: dateLabel,
            series: message.messageSeries?.[0]?.series?.name?.toUpperCase() || '',
            thumbnailUrl: message.thumbnailUrl ||
              (message.youtubeId
                ? `https://img.youtube.com/vi/${message.youtubeId}/maxresdefault.jpg`
                : null),
            videoUrl: message.youtubeId
              ? `https://www.youtube.com/watch?v=${message.youtubeId}`
              : undefined,
          },
        },
      }
    }

    case 'featured-events': {
      const count = (content.count as number) || 3
      const events = await getFeaturedEvents(churchId, count)
      return {
        content: {
          ...content,
          featuredEvents: events.map((e) => ({
            id: e.id,
            title: e.title,
            date: formatEventDate(e.dateStart),
            location: e.location || '',
            imageUrl: e.coverImage || null,
            badge: e.isFeatured ? 'Featured' : undefined,
            slug: e.slug,
          })),
        },
      }
    }

    case 'upcoming-events': {
      const events = await getUpcomingEvents(churchId, 10)
      return {
        content,
        resolvedData: {
          events: events.map((e) => ({
            slug: e.slug,
            title: e.title,
            dateStart: toDateString(e.dateStart),
            dateEnd: e.dateEnd ? toDateString(e.dateEnd) : undefined,
            time: e.startTime || '',
            type: e.type.toLowerCase(),
            location: e.location || '',
            isRecurring: e.isRecurring,
            recurrenceSchedule: e.recurrenceSchedule || undefined,
          })),
        },
      }
    }

    case 'ministry-events': {
      const ministrySlug = content.ministrySlug as string
      const events = await getUpcomingEvents(churchId, 6)
      // Filter by ministry if slug is provided
      const filtered = ministrySlug
        ? events.filter((e) => e.ministry?.slug === ministrySlug)
        : events
      return {
        content,
        resolvedData: {
          events: filtered.map((e) => ({
            slug: e.slug,
            title: e.title,
            dateStart: toDateString(e.dateStart),
            timeStart: e.startTime || '',
            type: e.type.toLowerCase(),
            location: e.location || '',
            thumbnailUrl: e.coverImage || null,
            isFeatured: e.isFeatured,
          })),
        },
      }
    }

    case 'latest-videos': {
      const count = (content.count as number) || 3
      const result = await getVideos(churchId, { pageSize: count })
      return {
        content: {
          ...content,
          videos: result.data.map((v) => ({
            id: v.id,
            title: v.title,
            thumbnailUrl: v.youtubeId
              ? `https://img.youtube.com/vi/${v.youtubeId}/maxresdefault.jpg`
              : null,
            youtubeId: v.youtubeId || '',
            duration: v.duration || '',
            category: v.category || '',
            datePublished: toDateString(v.datePublished),
            description: v.description || '',
          })),
        },
      }
    }

    case 'all-messages':
    case 'all-events':
      // These are server components that fetch their own data
      return { content }

    case 'all-bible-studies': {
      const result = await getBibleStudies(churchId, { pageSize: 200 })
      return {
        content,
        resolvedData: {
          studies: result.data.map((s) => ({
            id: s.id,
            slug: s.slug,
            title: s.title,
            passage: s.passage || '',
            series: s.series?.name || '',
            dateFor: toDateString(s.dateFor),
            hasQuestions: s.hasQuestions,
            hasAnswers: s.hasAnswers,
            hasTranscript: s.hasTranscript,
            book: s.book || undefined,
          })),
        },
      }
    }

    case 'all-videos': {
      const result = await getVideos(churchId, { pageSize: 200 })
      return {
        content,
        resolvedData: {
          videos: result.data.map((v) => ({
            id: v.id,
            title: v.title,
            thumbnailUrl: v.youtubeId
              ? `https://img.youtube.com/vi/${v.youtubeId}/maxresdefault.jpg`
              : null,
            youtubeId: v.youtubeId || '',
            duration: v.duration || '',
            category: v.category || '',
            datePublished: toDateString(v.datePublished),
            description: v.description || '',
            isShort: v.isShort,
          })),
        },
      }
    }

    case 'latest-daily-bread': {
      const bread = await getTodaysDailyBread(churchId)
      return {
        content: {
          ...content,
          dailyBread: bread
            ? {
                title: bread.title,
                passage: bread.passage || '',
                body: bread.body || '',
                date: toDateString(bread.date),
              }
            : null,
        },
      }
    }

    default:
      console.warn(`Unknown dataSource: ${dataSource}`)
      return { content }
  }
}

function formatEventDate(date: Date | string | null): string {
  if (!date) return ''
  const d = date instanceof Date ? date : new Date(date)
  return d.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  })
}

function toDateString(date: Date | string | null): string {
  if (!date) return ''
  if (date instanceof Date) return date.toISOString().split('T')[0]
  return String(date)
}
