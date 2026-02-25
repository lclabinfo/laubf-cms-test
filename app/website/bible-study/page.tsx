import type { Metadata } from 'next'
import { getChurchId } from '@/lib/tenant/context'
import { getBibleStudies } from '@/lib/dal/bible-studies'
import { bibleBookLabel } from '@/lib/website/bible-book-labels'
import EventsHeroSection from '@/components/website/sections/events-hero'
import AllBibleStudiesSection from '@/components/website/sections/all-bible-studies'

export const metadata: Metadata = {
  title: 'Bible Study',
  description:
    'Explore Bible study resources, series, and materials.',
}

/**
 * Convert a Date or date-like value to a YYYY-MM-DD string.
 */
function toDateString(date: Date | string | null): string {
  if (!date) return ''
  if (date instanceof Date) return date.toISOString().split('T')[0]
  return String(date)
}

export default async function BibleStudyListingPage() {
  const churchId = await getChurchId()

  // Fetch all published bible studies (paginated at 200 to match
  // the pattern used by resolve-section-data for all-bible-studies)
  const result = await getBibleStudies(churchId, { pageSize: 200 })

  // Transform Prisma models into the shape expected by AllBibleStudiesSection
  const studies = result.data.map((s) => ({
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
  }))

  return (
    <>
      <EventsHeroSection
        content={{
          heading: 'Bible Study Resources',
          subtitle:
            'Deep dive into the Word of God with our weekly bible study materials and questions.',
        }}
        enableAnimations={true}
        colorScheme="dark"
      />
      <AllBibleStudiesSection
        content={{ heading: 'All Bible studies' }}
        enableAnimations={true}
        colorScheme="light"
        studies={studies}
      />
    </>
  )
}
