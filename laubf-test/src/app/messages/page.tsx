import SpotlightMediaSection from "@/components/sections/SpotlightMediaSection";
import AllMessagesSection from "@/components/sections/AllMessagesSection";

import type {
  SpotlightMediaSectionProps,
  AllMessagesSectionProps,
} from "@/lib/types/sections";

import { getMessages, getLatestMessage } from "@/lib/dal";
import { getChurchId } from "@/lib/get-church-id";
import { toUIMessage } from "@/lib/adapters";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Messages",
  description: "Watch and listen to Sunday messages, Bible teachings, and sermon series from LA UBF.",
};

export default async function MessagesPage() {
  const churchId = await getChurchId();
  const [latestMessage, messagesResult] = await Promise.all([
    getLatestMessage(churchId),
    getMessages(churchId, { pageSize: 100 }),
  ]);

  const messages = messagesResult.data.map(toUIMessage);

  // Build spotlight from latest message
  const latest = latestMessage ? toUIMessage(latestMessage) : null;
  const dateLabel = latest
    ? new Date(latest.dateFor + "T00:00:00")
        .toLocaleDateString("en-US", { month: "short", day: "numeric" })
        .toUpperCase()
    : "";

  const spotlightData: SpotlightMediaSectionProps = {
    id: "this-weeks-message",
    visible: true,
    colorScheme: "dark",
    paddingY: "compact",
    content: {
      sectionHeading: "This Week\u2019s Message",
      sermon: latest
        ? {
            slug: latest.slug,
            title: latest.title,
            speaker: latest.speaker,
            date: dateLabel,
            series: latest.series.toUpperCase(),
            thumbnailUrl: `https://img.youtube.com/vi/${latest.youtubeId}/maxresdefault.jpg`,
            videoUrl: `https://www.youtube.com/watch?v=${latest.youtubeId}`,
          }
        : {
            title: "No messages yet",
            speaker: "",
            date: "",
            thumbnailUrl: "",
          },
    },
  };

  const allMessagesData: AllMessagesSectionProps = {
    id: "all-messages",
    visible: true,
    colorScheme: "light",
    paddingY: "none",
    content: {
      heading: "All Messages",
    },
  };

  return (
    <main className="-mt-[76px] pt-[76px]" style={{ background: "var(--color-black-1)" }}>
      <SpotlightMediaSection settings={spotlightData} />
      <AllMessagesSection settings={allMessagesData} messages={messages} />
    </main>
  );
}
