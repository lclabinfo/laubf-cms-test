import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getBibleStudyBySlug } from "@/lib/dal";
import { getChurchId } from "@/lib/get-church-id";
import { toUIBibleStudy } from "@/lib/adapters";
import StudyDetailPage from "@/components/study-detail/StudyDetailPage";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const churchId = await getChurchId();
  const dbStudy = await getBibleStudyBySlug(churchId, slug);
  if (!dbStudy) return { title: "Study Not Found" };
  const study = toUIBibleStudy(dbStudy);
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
  const churchId = await getChurchId();
  const dbStudy = await getBibleStudyBySlug(churchId, slug);

  if (!dbStudy) {
    notFound();
  }

  const study = toUIBibleStudy(dbStudy);
  return <StudyDetailPage study={study} />;
}
