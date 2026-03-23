import { getLatestMessage, getMessages } from '@/lib/dal/messages'
import { getUpcomingEvents, getEvents, getHybridFeaturedEvents } from '@/lib/dal/events'
import { getVideos } from '@/lib/dal/videos'
import { getBibleStudies } from '@/lib/dal/bible-studies'
import { getTodaysDailyBread } from '@/lib/dal/daily-bread'
import { fetchDailyBreadFromFeed } from '@/lib/daily-bread-feed'
import { getCampuses } from '@/lib/dal/campuses'
import { bibleBookLabel } from '@/lib/website/bible-book-labels'
import { formatTime } from '@/lib/website/format-time'
import type { SectionType } from '@/lib/db/types'

type Content = Record<string, unknown>

/**
 * Default dataSource values inferred from sectionType when the content
 * JSON doesn't explicitly include a `dataSource` field. This provides a
 * safety net for sections created before the builder catalog included
 * dataSource in defaultContent.
 */
const DEFAULT_DATA_SOURCES: Partial<Record<SectionType, string>> = {
  SPOTLIGHT_MEDIA: 'latest-message',
  MEDIA_GRID: 'latest-videos',
  HIGHLIGHT_CARDS: 'featured-events',
  ALL_MESSAGES: 'all-messages',
  ALL_EVENTS: 'all-events',
  ALL_BIBLE_STUDIES: 'all-bible-studies',
  ALL_VIDEOS: 'all-videos',
  UPCOMING_EVENTS: 'upcoming-events',
  EVENT_CALENDAR: 'upcoming-events',
  RECURRING_MEETINGS: 'upcoming-events',
  DAILY_BREAD_FEATURE: 'latest-daily-bread',
}

/**
 * Resolves `dataSource` references in section content by fetching
 * the corresponding data from the DAL and merging it into the content
 * object (or returning it as a separate `resolvedData` payload).
 *
 * If `dataSource` is not set in the content JSON, falls back to a
 * default value inferred from the sectionType for known data-driven
 * section types.
 *
 * Sections that are async Server Components (ALL_MESSAGES, ALL_EVENTS)
 * fetch their own data internally and don't need resolution here.
 */
export async function resolveSectionData(
  churchId: string,
  sectionType: SectionType,
  content: Content,
): Promise<{ content: Content; resolvedData?: Record<string, unknown> }> {
  const dataSource = (content.dataSource as string | undefined) || DEFAULT_DATA_SOURCES[sectionType]
  if (!dataSource) return { content }

  try {
    switch (dataSource) {
      case 'latest-message': {
        const message = await getLatestMessage(churchId)
        if (!message) return { content }

        const dateLabel = message.dateFor
          ? (() => {
              const d = new Date(message.dateFor)
              const now = new Date()
              const sameYear = d.getFullYear() === now.getFullYear()
              return sameYear
                ? d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }).toUpperCase()
                : d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).toUpperCase()
            })()
          : ''

        return {
          content: {
            ...content,
            sermon: {
              slug: message.slug,
              title: message.title,
              speaker: message.speaker
                ? (message.speaker.preferredName
                  ? `${message.speaker.preferredName} ${message.speaker.lastName}`
                  : `${message.speaker.firstName} ${message.speaker.lastName}`)
                : 'Unknown',
              date: dateLabel,
              series: message.messageSeries?.[0]?.series?.name?.toUpperCase() || '',
              thumbnailUrl: message.thumbnailUrl ||
                (message.youtubeId
                  ? `https://img.youtube.com/vi/${message.youtubeId}/hqdefault.jpg`
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
        const includeRecurring = content.includeRecurring === true
        const showPastEvents = content.showPastEvents !== false // default true
        const pastEventsWindow = (content.pastEventsWindow as number) ?? 14 // default 2 weeks
        const sortOrder = (content.sortOrder as 'asc' | 'desc') ?? 'asc'
        const autoHidePastFeatured = content.autoHidePastFeatured === true

        const events = await getHybridFeaturedEvents(churchId, {
          maxCount: count,
          autoHidePastFeatured,
          includeRecurring,
          pastEventsDays: showPastEvents ? pastEventsWindow : 0,
          sortOrder,
        })

        return {
          content: {
            ...content,
            featuredEvents: events.map((e) => ({
              id: e.id,
              title: e.title,
              date: formatEventDate(e.dateStart),
              location: e.location || '',
              imageUrl: e.coverImage || null,
              slug: e.slug,
              featuredMode: e.featuredMode,
            })),
          },
        }
      }

      case 'upcoming-events': {
        const maxCount = (content.maxCount as number) ?? 100
        const includeRecurring = content.includeRecurring === true
        const includePast = content.includePast === true
        const pastDays = (content.pastDays as number) ?? 14

        const events = await getUpcomingEvents(churchId, maxCount, {
          includeRecurring,
          pastEventsDays: includePast ? pastDays : 0,
        })

        // For UPCOMING_EVENTS section, filter out recurring meetings unless explicitly included
        // EVENT_CALENDAR and RECURRING_MEETINGS sections also use this dataSource but handle their own filtering
        const filteredEvents = sectionType === 'UPCOMING_EVENTS' && !includeRecurring
          ? events.filter((e) => !e.isRecurring)
          : events

        return {
          content,
          resolvedData: {
            events: filteredEvents.slice(0, maxCount).map((e) => ({
              slug: e.slug,
              title: e.title,
              dateStart: toDateString(e.dateStart),
              dateEnd: e.dateEnd ? toDateString(e.dateEnd) : undefined,
              timeStart: formatTime(e.startTime),
              type: e.type.toLowerCase(),
              location: e.location || '',
              thumbnailUrl: e.coverImage || undefined,
              isFeatured: e.isFeatured,
              isRecurring: e.isRecurring,
              recurrenceSchedule: e.recurrenceSchedule || undefined,
              recurrenceDays: e.recurrenceDays.length > 0 ? e.recurrenceDays : undefined,
              meetingUrl: e.meetingUrl || undefined,
            })),
          },
        }
      }

      case 'ministry-events': {
        const ministrySlug = content.ministrySlug as string
        const events = await getUpcomingEvents(churchId, 20)
        // Include non-recurring events for the specific ministry AND church-wide events
        const filtered = events
          .filter((e) => !e.isRecurring)
          .filter((e) => !ministrySlug || e.ministry?.slug === ministrySlug || e.ministry?.slug === 'church-wide')
        return {
          content,
          resolvedData: {
            events: filtered.slice(0, 6).map((e) => ({
              slug: e.slug,
              title: e.title,
              dateStart: toDateString(e.dateStart),
              dateEnd: e.dateEnd ? toDateString(e.dateEnd) : undefined,
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
                ? `https://img.youtube.com/vi/${v.youtubeId}/hqdefault.jpg`
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

      case 'all-messages': {
        const messagesResult = await getMessages(churchId, { pageSize: 50, videoPublished: true })
        const withVideo = messagesResult.data.filter((m) => m.youtubeId || m.videoUrl)
        return {
          content,
          resolvedData: {
            messages: withVideo.map((m) => ({
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
              thumbnailUrl: m.thumbnailUrl || (m.youtubeId ? `https://img.youtube.com/vi/${m.youtubeId}/hqdefault.jpg` : ''),
              duration: m.duration || '',
            })),
          },
        }
      }

      case 'all-events': {
        const eventsResult = await getEvents(churchId, { pageSize: 50 })
        return {
          content,
          resolvedData: {
            events: eventsResult.data.map((e) => ({
              id: e.id,
              slug: e.slug,
              title: e.title,
              description: e.description || '',
              type: e.type.toLowerCase(),
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
            })),
          },
        }
      }

      case 'all-bible-studies': {
        const result = await getBibleStudies(churchId, { pageSize: 50 })
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
              book: s.book ? bibleBookLabel(s.book) : undefined,
            })),
          },
        }
      }

      case 'all-videos': {
        const result = await getVideos(churchId, { pageSize: 50 })
        return {
          content,
          resolvedData: {
            videos: result.data.map((v) => ({
              id: v.id,
              title: v.title,
              thumbnailUrl: v.youtubeId
                ? `https://img.youtube.com/vi/${v.youtubeId}/hqdefault.jpg`
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

      case 'all-campuses': {
        const campuses = await getCampuses(churchId)
        return {
          content: {
            ...content,
            campuses: campuses
              .filter((c) => c.slug !== 'all')
              .map((c) => ({
                id: c.slug,
                abbreviation: c.shortName || '',
                fullName: c.name,
                href: `/website/ministries/campus/${c.slug}`,
              })),
          },
        }
      }

      case 'latest-daily-bread': {
        const bread = await getTodaysDailyBread(churchId)

        if (bread) {
          return {
            content: {
              ...content,
              dailyBread: {
                slug: bread.slug,
                title: bread.title,
                passage: bread.passage || '',
                keyVerse: bread.keyVerse || null,
                body: bread.body || '',
                bibleText: bread.bibleText || null,
                author: bread.author,
                audioUrl: bread.audioUrl || null,
                date: toDateString(bread.date),
              },
            },
          }
        }

        // Fall back to UBF.org XML feed when no local DB entry exists
        const feedEntry = await fetchDailyBreadFromFeed()
        return {
          content: {
            ...content,
            dailyBread: feedEntry ?? null,
          },
        }
      }

      default:
        console.warn(`Unknown dataSource: ${dataSource}`)
        return { content }
    }
  } catch (error) {
    console.error(
      `[resolveSectionData] Failed to resolve dataSource="${dataSource}" for sectionType="${sectionType}" (churchId=${churchId}):`,
      error,
    )
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
