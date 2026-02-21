import { Suspense } from "react";
import EventsHeroSection from "@/components/sections/EventsHeroSection";
// TODO: Re-enable QuickLinksSection in a future iteration
// import QuickLinksSection from "@/components/sections/QuickLinksSection";
import AllEventsSection from "@/components/sections/AllEventsSection";

import type {
  EventsHeroSectionProps,
  // TODO: Re-enable QuickLinksSection in a future iteration
  // QuickLinksSectionProps,
  AllEventsSectionProps,
} from "@/lib/types/sections";

// TODO: Re-enable RECURRING_MEETINGS when QuickLinksSection is restored
import { MOCK_EVENTS /* , RECURRING_MEETINGS */ } from "@/lib/mock-data/events";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Events",
  description: "Browse upcoming events, meetings, and programs at LA UBF.",
};

/* ================================================================
 * SAMPLE DATA — Content from Figma design
 * In production, this data comes from PostgreSQL via CMS API.
 * ================================================================ */

const heroData: EventsHeroSectionProps = {
  id: "events-hero",
  visible: true,
  colorScheme: "dark",
  paddingY: "compact",
  content: {
    heading: "Get Involved",
    subtitle:
      "Join us on our next gathering — whether it be bible study, conference, or fellowship.",
  },
};

// TODO: Re-enable QuickLinksSection in a future iteration
// const quickLinksData: QuickLinksSectionProps = {
//   id: "quick-links",
//   visible: true,
//   colorScheme: "light",
//   paddingY: "compact",
//   content: {
//     heading: "Quick Links",
//     subtitle:
//       "Online meeting links for our recurring meetings & programs.",
//   },
// };

const allEventsData: AllEventsSectionProps = {
  id: "all-events",
  visible: true,
  colorScheme: "light",
  paddingY: "none",
  content: {
    heading: "All Events",
  },
};

const VALID_TABS = ["event", "meeting", "program"] as const;
type ValidTab = (typeof VALID_TABS)[number];

export default async function EventsPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const params = await searchParams;
  const rawTab = typeof params.tab === "string" ? params.tab : undefined;
  const initialTab: ValidTab = VALID_TABS.includes(rawTab as ValidTab)
    ? (rawTab as ValidTab)
    : "event";

  return (
    <main>
      <EventsHeroSection settings={heroData} />
      {/* TODO: Re-enable QuickLinksSection in a future iteration */}
      {/* <QuickLinksSection settings={quickLinksData} meetings={RECURRING_MEETINGS} /> */}
      {/* TODO: Re-enable divider when QuickLinksSection is restored */}
      {/* <hr className="border-white-2" /> */}
      <Suspense>
        <AllEventsSection settings={allEventsData} events={MOCK_EVENTS} initialTab={initialTab} />
      </Suspense>
    </main>
  );
}
