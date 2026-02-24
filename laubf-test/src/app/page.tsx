import HeroBannerSection from "@/components/sections/HeroBannerSection";
import MediaTextSection from "@/components/sections/MediaTextSection";
import HighlightCardsSection from "@/components/sections/HighlightCardsSection";
import EventCalendarSection from "@/components/sections/EventCalendarSection";
import QuoteBannerSection from "@/components/sections/QuoteBannerSection";
import ActionCardGridSection from "@/components/sections/ActionCardGridSection";
import DirectoryListSection from "@/components/sections/DirectoryListSection";
import SpotlightMediaSection from "@/components/sections/SpotlightMediaSection";
import MediaGridSection from "@/components/sections/MediaGridSection";
import CTABannerSection from "@/components/sections/CTABannerSection";

import { getEvents, getFeaturedEvents, getLatestMessage, getVideos } from "@/lib/dal";
import { getChurchId } from "@/lib/get-church-id";
import { toUIEvent, toUIMessage, toUIVideo } from "@/lib/adapters";
import { toEventCardData, toEventListItemData } from "@/lib/types/events";

import type {
  HeroBannerSectionProps,
  MediaTextSectionProps,
  HighlightCardsSectionProps,
  EventCalendarSectionProps,
  QuoteBannerSectionProps,
  ActionCardGridSectionProps,
  DirectoryListSectionProps,
  SpotlightMediaSectionProps,
  MediaGridSectionProps,
  CTABannerSectionProps,
} from "@/lib/types/sections";

export const dynamic = "force-dynamic";

/* ================================================================
 * HOMEPAGE
 * Section order: Dark->Dark->Light->Dark->Light->Light->Light->Dark->Dark
 * ================================================================ */

export default async function HomePage() {
  const churchId = await getChurchId();

  const [latestMessage, featuredEventsDb, eventsResult, videosResult] = await Promise.all([
    getLatestMessage(churchId),
    getFeaturedEvents(churchId, 3),
    getEvents(churchId, { pageSize: 5 }),
    getVideos(churchId, { pageSize: 3 }),
  ]);

  const featuredEvents = featuredEventsDb.map(toUIEvent);
  const allEvents = eventsResult.data.map(toUIEvent);
  const videos = videosResult.data.map(toUIVideo);
  const latest = latestMessage ? toUIMessage(latestMessage) : null;

  const dateLabel = latest
    ? new Date(latest.dateFor + "T00:00:00")
        .toLocaleDateString("en-US", { month: "short", day: "numeric" })
        .toUpperCase()
    : "";

  /* -- Section data -- */

  const heroBannerData: HeroBannerSectionProps = {
    id: "hero",
    visible: true,
    colorScheme: "dark",
    content: {
      heading: { line1: "Welcome to", line2: "LA UBF" },
      subheading:
        "Where people find their community.\nWhere disciples are raised.\nWhere the Word of God is lived.",
      primaryButton: { label: "I'm new", href: "/im-new", visible: true },
      secondaryButton: {
        label: "Upcoming events",
        href: "/events",
        visible: true,
      },
      backgroundImage: {
        src: "/videos/compressed-hero-vid.mp4",
        alt: "LA UBF community gathering",
      },
    },
    showSubheading: true,
  };

  const mediaTextData: MediaTextSectionProps = {
    id: "who-we-are",
    visible: true,
    colorScheme: "dark",
    content: {
      overline: "WHO WE ARE",
      heading: "Christian Ministry for College Students",
      body: "LA UBF (Los Angeles University Bible Fellowship) is an international, non-denominational evangelical church. We serve college students from diverse backgrounds, helping them to grow in faith, build community, and find purpose through the Word of God.",
      button: { label: "More about us", href: "/about", visible: true },
      images: [
        { src: "/images/compressed/home/rotatingwheel/compressed-bible-study.png", alt: "Bible study" },
        { src: "/images/compressed/home/rotatingwheel/compressed-campus-ministry-list.png", alt: "Campus ministry" },
        { src: "/images/compressed/home/rotatingwheel/compressed-campus-ministry.jpg", alt: "Campus ministry" },
        { src: "/images/compressed/home/rotatingwheel/compressed-event-christmas.png", alt: "Christmas event" },
        { src: "/images/compressed/home/rotatingwheel/compressed-fellowship.jpg", alt: "Fellowship" },
        { src: "/images/compressed/home/rotatingwheel/compressed-sunday-worship.jpg", alt: "Sunday worship" },
      ],
    },
  };

  const highlightCardsData: HighlightCardsSectionProps = {
    id: "featured-events",
    visible: true,
    colorScheme: "light",
    content: {
      heading: "Featured Events",
      subheading: "Highlights of what's happening in our community.",
      ctaLabel: "View All Events",
      ctaHref: "/events",
      featuredEvents: featuredEvents.slice(0, 3).map(toEventCardData),
    },
  };

  const eventCalendarData: EventCalendarSectionProps = {
    id: "schedule",
    visible: true,
    colorScheme: "light",
    content: {
      heading: "Schedule",
      currentMonth: new Date().toLocaleDateString("en-US", { month: "long", year: "numeric" }).toUpperCase(),
      filters: ["ALL", "Events", "Meetings", "Programs"],
      events: allEvents.slice(0, 5).map(toEventListItemData),
      ctaButtons: [
        { label: "2026 LA UBF Calendar", href: "https://laubf.org/calendar?month=2", icon: true },
        { label: "View all events", href: "/events" },
      ],
    },
  };

  const quoteBannerData: QuoteBannerSectionProps = {
    id: "spiritual-direction",
    visible: true,
    colorScheme: "dark",
    content: {
      overline: "2026 SPIRITUAL DIRECTION",
      heading: "Not of the World",
      verse: {
        text: "16 They are not of the world, just as I am not of the world. 17 Sanctify them in the truth; your word is truth. 18 As you sent me into the world, so I have sent them into the world.",
        reference: "John 17:16-18",
      },
    },
  };

  const actionCardGridData: ActionCardGridSectionProps = {
    id: "next-steps",
    visible: true,
    colorScheme: "light",
    content: {
      heading: { line1: "Your", line2: "Next Steps", line3: "at LA UBF" },
      subheading:
        "Explore different ways to connect, grow in faith, and be part of our community.",
      ctaButton: { label: "Plan your visit", href: "/im-new" },
      cards: [
        {
          id: "ns-1",
          title: "Sunday Worship",
          description:
            "Join us every Sunday for worship, teaching, and fellowship with believers.",
          imageUrl: "/images/compressed/home/compressed-sunday-worship.jpg",
          imageAlt: "Sunday worship service",
        },
        {
          id: "ns-2",
          title: "College Campus Ministries",
          description:
            "Connect with other students on your campus for Bible study and community.",
          imageUrl: "/images/compressed/home/compressed-campus-ministry.jpg",
          imageAlt: "Campus ministry gathering",
        },
        {
          id: "ns-3",
          title: "Personal Bible Studies",
          description:
            "Study the Bible one-on-one with a mentor at a time that works for you.",
          imageUrl: "/images/compressed/home/compressed-bible-study.png",
          imageAlt: "One-on-one Bible study",
        },
        {
          id: "ns-4",
          title: "Fellowship",
          description:
            "Build lasting friendships through shared meals, activities, and life together.",
          imageUrl: "/images/compressed/home/compressed-fellowship.jpg",
          imageAlt: "Fellowship dinner",
        },
      ],
    },
  };

  const directoryListData: DirectoryListSectionProps = {
    id: "campus-ministries",
    visible: true,
    colorScheme: "light",
    content: {
      heading: "Our Campus Ministries",
      items: [
        { id: "lbcc", name: "LBCC", active: true, href: "/ministries/campus/lbcc" },
        { id: "csulb", name: "CSULB", href: "/ministries/campus/csulb" },
        { id: "csuf", name: "CSUF", href: "/ministries/campus/csuf" },
        { id: "ucla", name: "UCLA", href: "/ministries/campus/ucla" },
        { id: "usc", name: "USC", href: "/ministries/campus/usc" },
        { id: "csudh", name: "CSUDH", href: "/ministries/campus/csudh" },
        { id: "ccc", name: "CCC", href: "/ministries/campus/ccc" },
        { id: "mt-sac", name: "MT. SAC", href: "/ministries/campus/mt-sac" },
        {
          id: "golden-west",
          name: "GOLDEN WEST",
          href: "/ministries/campus/golden-west",
        },
        { id: "cypress", name: "CYPRESS", href: "/ministries/campus/cypress" },
        {
          id: "cal-poly-pomona",
          name: "CAL POLY POMONA",
          href: "/ministries/campus/cal-poly-pomona",
        },
      ],
      image: {
        src: "/images/compressed/home/compressed-campus-ministry-list.png",
        alt: "Campus ministry students",
      },
      ctaHeading: "Don't see your campus?",
      ctaButton: {
        label: "Let us know your interest",
        href: "/im-new",
      },
    },
  };

  const spotlightMediaData: SpotlightMediaSectionProps = {
    id: "this-weeks-message",
    visible: true,
    colorScheme: "dark",
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

  const mediaGridData: MediaGridSectionProps = {
    id: "featured-videos",
    visible: true,
    colorScheme: "dark",
    content: {
      heading: "Featured Videos",
      ctaLabel: "View All Videos",
      ctaHref: "/videos",
      videos: videos.map((v) => ({
        id: v.id,
        title: v.title,
        thumbnailUrl: `https://img.youtube.com/vi/${v.youtubeId}/mqdefault.jpg`,
        videoUrl: `https://www.youtube.com/watch?v=${v.youtubeId}`,
        duration: v.duration,
      })),
    },
  };

  const ctaBannerData: CTABannerSectionProps = {
    id: "visit-us-banner",
    visible: true,
    colorScheme: "dark",
    content: {
      overline: "New Here?",
      heading: "Visit us this Sunday",
      body: "All are welcome. Come connect with us and get to know our community.",
      primaryButton: {
        label: "Plan your visit",
        href: "/im-new",
        visible: true,
      },
      secondaryButton: {
        label: "See our ministries",
        href: "/ministries",
        visible: true,
      },
      backgroundImage: {
        src: "/images/compressed/home/compressed-visit-us.jpg",
        alt: "LA UBF community",
      },
    },
  };

  return (
    <main>
      <HeroBannerSection settings={heroBannerData} />
      <MediaTextSection settings={mediaTextData} />
      <HighlightCardsSection settings={highlightCardsData} />
      <EventCalendarSection settings={eventCalendarData} events={allEvents} />
      <QuoteBannerSection settings={quoteBannerData} />
      <ActionCardGridSection settings={actionCardGridData} />
      <DirectoryListSection settings={directoryListData} />
      <SpotlightMediaSection settings={spotlightMediaData} />
      <MediaGridSection settings={mediaGridData} videos={videos} />
      <CTABannerSection settings={ctaBannerData} />
    </main>
  );
}
