import EventsHeroSection from "@/components/sections/EventsHeroSection";
import AllVideosSection from "@/components/sections/AllVideosSection";

import type {
  EventsHeroSectionProps,
  AllVideosSectionProps,
} from "@/lib/types/sections";

import { MOCK_VIDEOS } from "@/lib/mock-data/videos";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Videos",
  description: "Watch videos from LA UBF — worship services, testimonies, and special events.",
};

/* ================================================================
 * SAMPLE DATA — Content from Figma design
 * In production, this data comes from PostgreSQL via CMS API.
 * ================================================================ */

const heroData: EventsHeroSectionProps = {
  id: "videos-hero",
  visible: true,
  colorScheme: "dark",
  paddingY: "compact",
  content: {
    heading: "Videos",
    subtitle:
      "Testimonies, event recaps, worship sessions, and special features from our community.",
  },
};

const allVideosData: AllVideosSectionProps = {
  id: "all-videos",
  visible: true,
  colorScheme: "light",
  paddingY: "none",
  content: {
    heading: "All Videos",
  },
};

export default function VideosPage() {
  return (
    <main>
      <EventsHeroSection settings={heroData} />
      <AllVideosSection settings={allVideosData} videos={MOCK_VIDEOS} />
    </main>
  );
}
