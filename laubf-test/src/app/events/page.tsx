import { Suspense } from "react";
import EventsHeroSection from "@/components/sections/EventsHeroSection";
import AllEventsSection from "@/components/sections/AllEventsSection";

import type {
  EventsHeroSectionProps,
  AllEventsSectionProps,
} from "@/lib/types/sections";

import { getEvents } from "@/lib/dal";
import { getChurchId } from "@/lib/get-church-id";
import { toUIEvent } from "@/lib/adapters";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Events",
  description: "Browse upcoming events, meetings, and programs at LA UBF.",
};

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

  const churchId = await getChurchId();
  const eventsResult = await getEvents(churchId, { pageSize: 100 });
  const events = eventsResult.data.map(toUIEvent);

  return (
    <main>
      <EventsHeroSection settings={heroData} />
      <Suspense>
        <AllEventsSection settings={allEventsData} events={events} initialTab={initialTab} />
      </Suspense>
    </main>
  );
}
