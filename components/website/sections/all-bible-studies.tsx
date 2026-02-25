import { getBibleStudies } from '@/lib/dal/bible-studies'
import { bibleBookLabel } from '@/lib/website/bible-book-labels'
import AllBibleStudiesClient from './all-bible-studies-client'

interface AllBibleStudiesContent {
  heading: string
}

interface Props {
  content: AllBibleStudiesContent
  churchId?: string
  enableAnimations: boolean
  colorScheme?: string
  paddingY?: string
  containerWidth?: string
  studies?: {
    id: string
    slug: string
    title: string
    passage: string
    series: string
    dateFor: string
    hasQuestions: boolean
    hasAnswers: boolean
    hasTranscript: boolean
    book?: string
  }[]
}

/**
 * Convert a Date or date-like value to a YYYY-MM-DD string.
 */
function toDateString(date: Date | string | null): string {
  if (!date) return ''
  if (date instanceof Date) return date.toISOString().split('T')[0]
  return String(date)
}

export default async function AllBibleStudiesSection({ content, churchId, studies: preloadedStudies }: Props) {
  // If studies are already resolved (via resolve-section-data or direct prop), use them.
  // Otherwise fetch from DB directly (for when used as a standalone server component).
  let studies = preloadedStudies
  if (!studies && churchId) {
    const result = await getBibleStudies(churchId, { pageSize: 200 })
    studies = result.data.map((s) => ({
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
  }

  return <AllBibleStudiesClient studies={studies ?? []} heading={content.heading} />
}
