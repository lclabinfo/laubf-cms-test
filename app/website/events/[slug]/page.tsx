import { notFound } from "next/navigation"
import type { Metadata } from "next"
import Link from "next/link"
import Image from "next/image"
import { getChurchId } from "@/lib/tenant/context"
import { getEventBySlug } from "@/lib/dal/events"
import {
  IconCalendar,
  IconClock,
  IconMapPin,
  IconChevronRight,
  IconExternalLink,
  IconLink,
} from "@/components/website/shared/icons"

interface PageProps {
  params: Promise<{ slug: string }>
}

/* ── Helpers ── */

function formatEventDate(date: Date): string {
  return date.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  })
}

function formatEventTime(startTime?: string | null, endTime?: string | null): string {
  if (!startTime) return ""
  if (!endTime) return startTime
  return `${startTime} – ${endTime}`
}

function formatEventTypeBadge(type: string): string {
  return type.charAt(0).toUpperCase() + type.slice(1).toLowerCase()
}

function getRecurrenceLabel(recurrence: string): string | null {
  switch (recurrence) {
    case "DAILY":
      return "Repeats Daily"
    case "WEEKLY":
      return "Repeats Weekly"
    case "MONTHLY":
      return "Repeats Monthly"
    case "YEARLY":
      return "Repeats Yearly"
    case "WEEKDAY":
      return "Repeats on Weekdays"
    case "CUSTOM":
      return "Custom Recurrence"
    default:
      return null
  }
}

/* ── Metadata ── */

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params
  const churchId = await getChurchId()
  const event = await getEventBySlug(churchId, slug)

  if (!event) return { title: "Event Not Found" }

  return {
    title: `${event.title} | Events`,
    description: event.shortDescription || event.description || `Details for ${event.title}`,
  }
}

/* ── Page ── */

export default async function EventDetailPage({ params }: PageProps) {
  const { slug } = await params
  const churchId = await getChurchId()
  const event = await getEventBySlug(churchId, slug)

  if (!event) {
    notFound()
  }

  const dateDisplay = event.dateEnd
    ? `${formatEventDate(event.dateStart)} — ${formatEventDate(event.dateEnd)}`
    : formatEventDate(event.dateStart)

  const timeDisplay = event.allDay
    ? "All Day"
    : formatEventTime(event.startTime, event.endTime)

  const typeBadge = formatEventTypeBadge(event.type)
  const recurrenceLabel = event.isRecurring
    ? (event.recurrenceSchedule || getRecurrenceLabel(event.recurrence))
    : null

  const locationLabel =
    event.locationType === "ONLINE"
      ? "Online Event"
      : event.location || "Location TBD"

  return (
    <div className="bg-white-1 pt-8 pb-20">
      {/* Breadcrumb */}
      <div className="container-standard">
        <nav className="flex items-center gap-1.5 text-[14px]">
          <Link
            href="/website"
            className="text-black-3 transition-colors hover:text-black-1"
          >
            Home
          </Link>
          <IconChevronRight className="size-3.5 text-black-3" />
          <Link
            href="/website/events"
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
          {/* Cover image or placeholder */}
          <div className="relative w-full aspect-[16/10] rounded-[20px] overflow-hidden bg-gradient-to-br from-white-2 to-white-1-5 mb-8">
            {event.coverImage ? (
              <Image
                src={event.coverImage}
                alt={event.imageAlt || event.title}
                fill
                className="object-cover"
                style={{ objectPosition: event.imagePosition || "center" }}
              />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="size-16 rounded-full bg-white-2-5/60 flex items-center justify-center">
                  <IconCalendar className="size-7 text-black-3/40" />
                </div>
              </div>
            )}
            {/* Type badge */}
            <span className="absolute top-4 left-4 bg-black-1/80 text-white-0 text-[12px] tracking-wider font-medium px-4 py-1.5 rounded-full uppercase">
              {typeBadge}
            </span>
            {/* Featured badge */}
            {event.isFeatured && (
              <span className="absolute top-4 right-4 bg-accent-blue/90 text-white-0 text-[12px] tracking-wider font-medium px-4 py-1.5 rounded-full uppercase">
                Featured
              </span>
            )}
          </div>

          {/* Title */}
          <h1 className="text-h1 text-black-1 mb-6">{event.title}</h1>

          {/* Short description as blockquote */}
          {event.shortDescription && (
            <blockquote className="border-l-4 border-brand-1 pl-6 text-body-1 text-black-2 mb-8 italic">
              {event.shortDescription}
            </blockquote>
          )}

          {/* Description / body */}
          {event.description && (
            <div
              className="prose prose-lg max-w-none text-black-2 [&_h3]:text-h4 [&_h3]:text-black-1 [&_h3]:mt-8 [&_h3]:mb-3 [&_p]:text-body-1 [&_p]:text-black-2 [&_p]:mb-4 [&_ul]:mb-4 [&_ul]:pl-6 [&_li]:text-body-2 [&_li]:text-black-2 [&_li]:mb-1 [&_strong]:text-black-1"
              dangerouslySetInnerHTML={{ __html: event.description }}
            />
          )}

          {/* Welcome message */}
          {event.welcomeMessage && (
            <div className="mt-8 p-6 bg-white-0 rounded-[16px] border border-white-2-5">
              <h3 className="text-overline text-black-3 uppercase mb-3">Welcome Message</h3>
              <div
                className="text-body-1 text-black-2"
                dangerouslySetInnerHTML={{ __html: event.welcomeMessage }}
              />
            </div>
          )}

          {/* Footer note */}
          <div className="mt-10 pt-6 border-t border-white-2">
            <p className="text-body-3 text-black-3 italic">
              For questions about this event, please{" "}
              <Link href="/website/contact" className="text-accent-blue hover:underline">
                contact us
              </Link>
              .
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
            {timeDisplay && (
              <DetailRow
                icon={
                  <div className="flex size-10 items-center justify-center rounded-full bg-accent-green/10">
                    <IconClock className="size-5 text-accent-green" />
                  </div>
                }
                label="Time"
                value={timeDisplay}
              />
            )}

            {/* Location */}
            <DetailRow
              icon={
                <div className="flex size-10 items-center justify-center rounded-full bg-brand-1/10">
                  <IconMapPin className="size-5 text-brand-1" />
                </div>
              }
              label="Location"
              value={locationLabel}
            />

            {/* Address (if different from location name) */}
            {event.address && event.address !== event.location && (
              <p className="text-body-3 text-black-3 -mt-2 mb-4 ml-[52px]">
                {event.address}
              </p>
            )}

            {/* Recurrence info */}
            {recurrenceLabel && (
              <div className="flex items-center gap-2 mb-4 ml-[52px]">
                <span className="bg-accent-blue/10 text-accent-blue text-[12px] font-medium px-3 py-1 rounded-full">
                  {recurrenceLabel}
                </span>
              </div>
            )}

            {/* Ministry / Campus info */}
            {(event.ministry || event.campus) && (
              <div className="flex flex-wrap gap-2 mb-4">
                {event.ministry && (
                  <span className="bg-white-2 text-black-3 text-[12px] tracking-[0.24px] font-medium px-3 py-1.5 rounded-lg">
                    {event.ministry.name}
                  </span>
                )}
                {event.campus && (
                  <span className="bg-white-2 text-black-3 text-[12px] tracking-[0.24px] font-medium px-3 py-1.5 rounded-lg">
                    {event.campus.name}
                  </span>
                )}
              </div>
            )}

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

            {/* Event links */}
            {event.eventLinks && event.eventLinks.length > 0 && (
              <div className="mt-5 pt-5 border-t border-white-2">
                <h4 className="text-[14px] font-medium text-black-3 uppercase mb-3">
                  Important Links
                </h4>
                <div className="flex flex-col gap-2">
                  {event.eventLinks.map((link) => (
                    <a
                      key={link.id}
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
    </div>
  )
}

/* ── Sub-components ── */

function DetailRow({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode
  label: string
  value: string
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
  )
}
