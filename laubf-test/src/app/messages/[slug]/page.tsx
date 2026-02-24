import { notFound } from "next/navigation";
import Link from "next/link";
import { MOCK_MESSAGES, getMessageBySlug } from "@/lib/mock-data/messages";
import {
  IconChevronLeft,
  IconCalendar,
  IconArrowRight,
  IconBookOpen,
  IconUser,
} from "@/components/layout/icons";
import TranscriptPanel from "./TranscriptPanel";
import ShareMessageButton from "./ShareMessageButton";

/* ── Static params for SSG ── */

export function generateStaticParams() {
  return MOCK_MESSAGES.map((m) => ({ slug: m.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const message = getMessageBySlug(slug);
  if (!message) return { title: "Message Not Found" };
  return {
    title: `${message.title} | LA UBF Messages`,
    description: message.description,
  };
}

function formatDate(dateStr: string) {
  const date = new Date(dateStr + "T00:00:00");
  return date
    .toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    })
    .toUpperCase();
}

/* ── Page component ── */

export default async function MessageDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const message = getMessageBySlug(slug);
  if (!message) notFound();

  return (
    <main className="bg-white-1 min-h-screen">
      {/* Sub-navigation bar */}
      <div className="py-4">
        <div className="container-standard flex items-center justify-between">
          <Link
            href="/messages"
            className="flex items-center gap-2 text-[14px] font-bold text-black-3 uppercase tracking-wide hover:text-black-1 transition-colors"
          >
            <IconChevronLeft className="size-4" />
            Back to Messages
          </Link>
          <div className="flex items-center gap-4">
            <span className="text-[12px] font-bold text-black-3 uppercase tracking-[1.2px] hidden sm:block">
              {message.series}
            </span>
            <ShareMessageButton title={message.title} />
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container-standard pt-2 pb-20 grid grid-cols-1 lg:grid-cols-[1fr_420px] gap-10">
        {/* ── Left column: Video + Metadata ── */}
        <div>
          {/* YouTube Embed */}
          <div className="aspect-video rounded-[24px] overflow-hidden bg-black-1 shadow-[0px_25px_50px_-12px_rgba(0,0,0,0.25)]">
            <iframe
              src={`https://www.youtube.com/embed/${message.youtubeId}`}
              title={message.title}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              className="w-full h-full"
            />
          </div>

          {/* Series badge + Date */}
          <div className="flex items-center gap-4 mt-8">
            <span className="bg-accent-blue text-white-0 text-[12px] font-bold uppercase tracking-[0.6px] px-3 py-1 rounded-[10px]">
              {message.series}
            </span>
            <div className="flex items-center gap-2">
              <IconCalendar className="size-3 text-black-3" />
              <span className="text-[14px] font-bold text-black-3 uppercase tracking-wide">
                {formatDate(message.dateFor)}
              </span>
            </div>
          </div>

          {/* Title */}
          <h1 className="text-[36px] md:text-[48px] font-black leading-[1.15] tracking-[-0.85px] text-black-1 uppercase mt-4">
            {message.title}
          </h1>

          {/* Passage + Speaker */}
          <div className="flex flex-col gap-1 mt-4 pb-6 border-b border-white-2">
            <p className="text-[18px] font-bold text-black-1 tracking-[-0.44px]">
              {message.passage}
            </p>
            <p className="text-[16px] text-black-3 tracking-[-0.31px]">
              Message by{" "}
              <span className="font-bold text-black-1">{message.speaker}</span>
            </p>
          </div>

          {/* Description */}
          <div className="mt-8">
            <p className="text-[16px] text-black-2 leading-[1.5] tracking-[-0.31px]">
              {message.description}
            </p>
          </div>

          {/* Duration */}
          {message.duration && (
            <p className="text-[14px] text-black-3 mt-4">
              Duration: {message.duration}
            </p>
          )}
        </div>

        {/* ── Right column: Transcript + Study Guide ── */}
        <aside className="flex flex-col gap-6 lg:sticky lg:top-[96px] h-fit">
          <TranscriptPanel
            liveTranscript={message.liveTranscript}
            rawTranscript={message.rawTranscript}
          />

          {/* Study Guide Card */}
          {message.relatedStudyId && (
            <Link
              href={`/bible-study/${message.relatedStudyId}`}
              className="group relative rounded-[24px] bg-white-0 border border-accent-blue/20 overflow-hidden p-5 shadow-[0px_10px_15px_-3px_rgba(28,57,142,0.05),0px_4px_6px_-4px_rgba(28,57,142,0.05)] hover:shadow-[0px_10px_15px_-3px_rgba(28,57,142,0.1)] transition-shadow"
            >
              {/* Blue glow */}
              <div
                aria-hidden="true"
                className="absolute -top-12 -right-12 size-24 rounded-full bg-accent-blue/10 blur-[40px]"
              />
              <p className="text-[10px] font-black text-accent-blue uppercase tracking-[1.1px] mb-1">
                Preparation
              </p>
              <p className="text-[14px] font-bold text-black-1 tracking-[-0.15px] mb-3">
                Study Guide Available
              </p>
              <div className="flex items-center justify-center gap-2 w-full rounded-[14px] bg-accent-blue text-white-0 py-3 text-[12px] font-bold uppercase tracking-[0.3px] transition-colors group-hover:bg-accent-blue/90">
                Open Guide
                <IconArrowRight className="size-4" />
              </div>
            </Link>
          )}
        </aside>
      </div>
    </main>
  );
}
