import EventsHeroSection from "@/components/sections/EventsHeroSection";
import AllBibleStudiesSection from "@/components/sections/AllBibleStudiesSection";

import type {
  EventsHeroSectionProps,
  AllBibleStudiesSectionProps,
} from "@/lib/types/sections";

import { MOCK_BIBLE_STUDIES } from "@/lib/mock-data/bible-studies";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Bible Study",
  description: "Explore Bible study resources, series, and materials from LA UBF.",
};

/* ================================================================
 * SAMPLE DATA — Content from Figma design
 * In production, this data comes from PostgreSQL via CMS API.
 * ================================================================ */

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

export default function BibleStudyPage() {
  return (
    <main>
      <EventsHeroSection settings={heroData} />
      <AllBibleStudiesSection settings={allStudiesData} studies={MOCK_BIBLE_STUDIES} />
    </main>
  );
}
