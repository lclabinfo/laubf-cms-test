import EventsHeroSection from "@/components/sections/EventsHeroSection";
import AllBibleStudiesSection from "@/components/sections/AllBibleStudiesSection";

import type {
  EventsHeroSectionProps,
  AllBibleStudiesSectionProps,
} from "@/lib/types/sections";

import { getBibleStudies } from "@/lib/dal";
import { getChurchId } from "@/lib/get-church-id";
import { toUIBibleStudy } from "@/lib/adapters";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Bible Study",
  description: "Explore Bible study resources, series, and materials from LA UBF.",
};

const heroData: EventsHeroSectionProps = {
  id: "bible-study-hero",
  visible: true,
  colorScheme: "dark",
  paddingY: "compact",
  content: {
    heading: "Bible Study Resources",
    subtitle:
      "Deep dive into the Word of God with our weekly bible study materials and questions.",
  },
};

const allStudiesData: AllBibleStudiesSectionProps = {
  id: "all-bible-studies",
  visible: true,
  colorScheme: "light",
  paddingY: "none",
  content: {
    heading: "All Bible studies",
  },
};

export default async function BibleStudyPage() {
  const churchId = await getChurchId();
  const studiesResult = await getBibleStudies(churchId, { pageSize: 100 });
  const studies = studiesResult.data.map(toUIBibleStudy);

  return (
    <main>
      <EventsHeroSection settings={heroData} />
      <AllBibleStudiesSection settings={allStudiesData} studies={studies} />
    </main>
  );
}
