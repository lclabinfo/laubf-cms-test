import { notFound } from "next/navigation"
import type { Metadata } from "next"
import { getChurchId } from "@/lib/tenant/context"
import { getBibleStudyBySlug } from "@/lib/dal/bible-studies"
import type { BibleStudyDetail, BibleStudyAttachment } from "@/lib/types/bible-study"
import { bibleBookLabel } from "@/lib/website/bible-book-labels"
import StudyDetailView from "@/components/website/study-detail/study-detail-view"

interface PageProps {
  params: Promise<{ slug: string }>
}

/**
 * Map Prisma AttachmentType enum to the lowercase string the client expects.
 */
function mapAttachmentType(type: string): BibleStudyAttachment["type"] {
  switch (type) {
    case "PDF":
      return "pdf"
    case "DOCX":
      return "docx"
    case "IMAGE":
      return "image"
    default:
      return "other"
  }
}

/**
 * Transform Prisma BibleStudy record into the serializable BibleStudyDetail
 * shape expected by the client component.
 */
function transformStudy(study: NonNullable<Awaited<ReturnType<typeof getBibleStudyBySlug>>>): BibleStudyDetail {
  return {
    id: study.id,
    slug: study.slug,
    title: study.title,
    book: bibleBookLabel(study.book),
    passage: study.passage,
    dateFor: study.dateFor.toISOString().split("T")[0],
    series: study.series?.name ?? "",
    messenger: study.speaker?.name ?? undefined,
    keyVerse:
      study.keyVerseRef && study.keyVerseText
        ? { verse: study.keyVerseRef, text: study.keyVerseText }
        : undefined,
    questions: study.questions ?? "",
    answers: study.answers ?? undefined,
    transcript: study.transcript ?? undefined,
    bibleText: study.bibleText ?? undefined,
    attachments: study.attachments.map((a) => ({
      name: a.name,
      url: a.url,
      type: mapAttachmentType(a.type),
    })),
  }
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params
  const churchId = await getChurchId()
  const study = await getBibleStudyBySlug(churchId, slug)

  if (!study) return { title: "Study Not Found" }

  return {
    title: study.title,
    description: `Bible study on ${study.passage} from the series "${study.series?.name ?? ""}".`,
  }
}

export default async function BibleStudyDetailPage({ params }: PageProps) {
  const { slug } = await params
  const churchId = await getChurchId()
  const study = await getBibleStudyBySlug(churchId, slug)

  if (!study) {
    notFound()
  }

  const detail = transformStudy(study)

  return <StudyDetailView study={detail} />
}
