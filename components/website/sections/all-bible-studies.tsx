import { getBibleStudies } from '@/lib/dal/bible-studies'
import { bibleBookLabel } from '@/lib/website/bible-book-labels'
import AllBibleStudiesClient from './all-bible-studies-client'

interface AllBibleStudiesContent {
  heading: string
}

interface PaginationInfo {
  total: number
  page: number
  pageSize: number
  totalPages: number
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
  pagination?: PaginationInfo
}

/**
 * Convert a Date or date-like value to a YYYY-MM-DD string.
 */
function toDateString(date: Date | string | null): string {
  if (!date) return ''
  if (date instanceof Date) return date.toISOString().split('T')[0]
  return String(date)
}

export default async function AllBibleStudiesSection({ content, churchId, studies: preloadedStudies, pagination: preloadedPagination }: Props) {
  try {
    // If studies are already resolved (via resolve-section-data or direct prop), use them.
    // Otherwise fetch from DB directly (for when used as a standalone server component).
    let studies = preloadedStudies
    let pagination = preloadedPagination
    if (!studies && churchId) {
      const PAGE_SIZE = 50
      const result = await getBibleStudies(churchId, { pageSize: PAGE_SIZE })
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
      pagination = { total: result.total, page: result.page, pageSize: result.pageSize, totalPages: result.totalPages }
    }

    return <AllBibleStudiesClient studies={studies ?? []} heading={content.heading} pagination={pagination} />
  } catch (error) {
    console.error('[AllBibleStudiesSection] Failed to load Bible studies:', error)
    return (
      <div className="py-16 text-center">
        <p className="text-muted-foreground">Bible studies are temporarily unavailable.</p>
      </div>
    )
  }
}
