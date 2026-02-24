import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { MOCK_BIBLE_STUDIES } from "@/lib/mock-data/bible-studies";
import StudyDetailPage from "@/components/study-detail/StudyDetailPage";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const study = MOCK_BIBLE_STUDIES.find((s) => s.slug === slug);
  if (!study) return { title: "Study Not Found" };
  return {
    title: study.title,
    description: `Bible study on ${study.passage} from the series "${study.series}".`,
  };
}

export default async function BibleStudyDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const study = MOCK_BIBLE_STUDIES.find((s) => s.slug === slug);

  if (!study) {
    notFound();
  }

  return <StudyDetailPage study={study} />;
}
