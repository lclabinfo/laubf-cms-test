import { notFound } from "next/navigation";
import Link from "next/link";
import { MOCK_EVENTS, getEventBySlug } from "@/lib/mock-data/events";
import { formatEventDate, getEventBadge } from "@/lib/types/events";
import {
  IconCalendar,
  IconClock,
  IconMapPin,
  IconChevronRight,
  IconExternalLink,
  IconLink,
} from "@/components/layout/icons";
import ShareButton from "./ShareButton";

/* ── Static params for SSG ── */

export function generateStaticParams() {
  return MOCK_EVENTS.map((event) => ({ slug: event.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const event = getEventBySlug(slug);
  if (!event) return { title: "Event Not Found" };
  return {
    title: `${event.title} | LA UBF Events`,
    description: event.description,
  };
}

/* ── Page component ── */

export default async function EventDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const event = getEventBySlug(slug);
  if (!event) notFound();

  const dateDisplay = event.dateEnd
    ? `${formatEventDate(event.dateStart)} — ${formatEventDate(event.dateEnd)}`
    : formatEventDate(event.dateStart);

  return (
    <main className="bg-white-1 pt-8 pb-20">
      {/* Breadcrumb */}
      <div className="container-standard">
        <nav className="flex items-center gap-1.5 text-[14px]">
          <Link
            href="/"
            className="text-black-3 transition-colors hover:text-black-1"
          >
            Home
          </Link>
          <IconChevronRight className="size-3.5 text-black-3" />
          <Link
            href="/events"
            className="text-black-3 transition-colors hover:text-black-1"
          >
            Events
          </Link>
          <IconChevronRight className="size-3.5 text-black-3" />
          <span className="text-black-1 font-medium line-clamp-1">
            {event.title}
          </span>
        </nav>
      </div>

      {/* Two-column layout */}
      <div className="container-standard mt-6 grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-10">
        {/* Left column — article */}
        <article>
          {/* Event Image Placeholder */}
          <div className="relative w-full aspect-[16/10] rounded-[20px] overflow-hidden bg-gradient-to-br from-white-2 to-white-1-5 mb-8">
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="size-16 rounded-full bg-white-2-5/60 flex items-center justify-center">
                <IconCalendar className="size-7 text-black-3/40" />
              </div>
            </div>
            {getEventBadge(event) && (
              <span className="absolute top-4 left-4 bg-black-1/80 text-white-0 text-[12px] tracking-wider font-medium px-4 py-1.5 rounded-full uppercase">
                {getEventBadge(event)}
              </span>
            )}
          </div>

          {/* Tags */}
          {event.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-4">
              {event.tags.map((tag) => (
                <span
                  key={tag}
                  className="bg-accent-blue/10 text-accent-blue text-[13px] font-medium px-3 py-1 rounded-full"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}

          {/* Title */}
          <h1 className="text-h1 text-black-1 mb-6">{event.title}</h1>

          {/* Description blockquote */}
          <blockquote className="border-l-4 border-brand-1 pl-6 text-body-1 text-black-2 mb-8 italic">
            {event.description}
          </blockquote>

          {/* Rich text body */}
          <div
            className="prose prose-lg max-w-none text-black-2 [&_h3]:text-h4 [&_h3]:text-black-1 [&_h3]:mt-8 [&_h3]:mb-3 [&_p]:text-body-1 [&_p]:text-black-2 [&_p]:mb-4 [&_ul]:mb-4 [&_ul]:pl-6 [&_li]:text-body-2 [&_li]:text-black-2 [&_li]:mb-1 [&_strong]:text-black-1"
            dangerouslySetInnerHTML={{ __html: event.body }}
          />

          {/* Footer note */}
          <div className="mt-10 pt-6 border-t border-white-2">
            <p className="text-body-3 text-black-3 italic">
              For questions about this event, please contact us at{" "}
              <a
                href="mailto:info@laubf.org"
                className="text-accent-blue hover:underline"
              >
                info@laubf.org
              </a>
            </p>
          </div>
        </article>

        {/* Right column — sidebar card */}
        <aside className="lg:sticky lg:top-[88px] h-fit">
          <div className="bg-white-0 rounded-[20px] border border-white-2-5 shadow-[0px_12px_20px_0px_rgba(0,0,0,0.05)] p-6">
            <h3 className="text-overline text-black-3 uppercase mb-4">
              Event Details
            </h3>
            <hr className="border-white-2 mb-5" />

            {/* Date */}
            <DetailRow
              icon={
                <div className="flex size-10 items-center justify-center rounded-full bg-accent-blue/10">
                  <IconCalendar className="size-5 text-accent-blue" />
                </div>
              }
              label="Date"
              value={dateDisplay}
            />

            {/* Time */}
            <DetailRow
              icon={
                <div className="flex size-10 items-center justify-center rounded-full bg-accent-green/10">
                  <IconClock className="size-5 text-accent-green" />
                </div>
              }
              label="Time"
              value={event.time}
            />

            {/* Location */}
            <DetailRow
              icon={
                <div className="flex size-10 items-center justify-center rounded-full bg-brand-1/10">
                  <IconMapPin className="size-5 text-brand-1" />
                </div>
              }
              label="Location"
              value={event.location}
            />

            <hr className="border-white-2 my-5" />

            {/* Registration button */}
            {event.registrationUrl && (
              <a
                href={event.registrationUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center w-full rounded-full bg-black-1 text-white-1 py-4 text-button-1 transition-colors hover:bg-black-2 mb-3"
              >
                Register Now
              </a>
            )}

            {/* Online meeting button */}
            {event.meetingUrl && (
              <a
                href={event.meetingUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 w-full rounded-full border border-accent-blue/30 text-accent-blue py-4 text-button-1 transition-colors hover:bg-accent-blue/5 mb-3"
              >
                <IconLink className="size-4" />
                Join Online Meeting
              </a>
            )}

            {/* Share button */}
            <ShareButton title={event.title} />

            {/* Additional links */}
            {event.links && event.links.length > 0 && (
              <div className="mt-5 pt-5 border-t border-white-2">
                <h4 className="text-[14px] font-medium text-black-3 uppercase mb-3">
                  Important Links
                </h4>
                <div className="flex flex-col gap-2">
                  {event.links.map((link) => (
                    <a
                      key={link.label}
                      href={link.href}
                      target={link.external ? "_blank" : undefined}
                      rel={link.external ? "noopener noreferrer" : undefined}
                      className="flex items-center gap-2 text-[14px] text-accent-blue hover:underline"
                    >
                      <IconExternalLink className="size-3.5 shrink-0" />
                      {link.label}
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>
        </aside>
      </div>
    </main>
  );
}

/* ── Sub-components ── */

function DetailRow({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start gap-3 mb-4">
      {icon}
      <div className="flex flex-col">
        <span className="text-[12px] text-black-3 uppercase tracking-wide">
          {label}
        </span>
        <span className="text-[15px] text-black-1 font-medium">{value}</span>
      </div>
    </div>
  );
}

