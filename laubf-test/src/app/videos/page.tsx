import EventsHeroSection from "@/components/sections/EventsHeroSection";
import AllVideosSection from "@/components/sections/AllVideosSection";

import type {
  EventsHeroSectionProps,
  AllVideosSectionProps,
} from "@/lib/types/sections";

import { getVideos } from "@/lib/dal";
import { getChurchId } from "@/lib/get-church-id";
import { toUIVideo } from "@/lib/adapters";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Videos",
  description: "Watch videos from LA UBF — worship services, testimonies, and special events.",
};

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

export default async function VideosPage() {
  const churchId = await getChurchId();
  const videosResult = await getVideos(churchId, { pageSize: 100 });
  const videos = videosResult.data.map(toUIVideo);

  return (
    <main>
      <EventsHeroSection settings={heroData} />
      <AllVideosSection settings={allVideosData} videos={videos} />
    </main>
  );
}
