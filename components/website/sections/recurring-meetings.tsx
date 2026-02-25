"use client"

import Link from "next/link"
import SectionContainer from "@/components/website/shared/section-container"
import TypePill from "@/components/website/shared/type-pill"
import {
  IconCalendar,
  IconClock,
  IconVideo,
  IconArrowUpRight,
} from "@/components/website/shared/icons"
import type { SectionTheme } from "@/components/website/shared/theme-tokens"

interface Event {
  slug: string
  title: string
  type: string
  time: string
  isRecurring?: boolean
  recurrenceSchedule?: string
  meetingUrl?: string
}

const DEFAULT_MAX_VISIBLE = 4

interface RecurringMeetingsContent {
  heading: string
  maxVisible?: number
  viewAllHref?: string
}

interface Props {
  content: RecurringMeetingsContent
  enableAnimations: boolean
  colorScheme?: SectionTheme
  events?: Event[]
}

export default function RecurringMeetingsSection({ content, colorScheme = "light", events = [] }: Props) {
  const maxVisible = content.maxVisible ?? DEFAULT_MAX_VISIBLE
  const viewAllHref = content.viewAllHref ?? "/events"

  const recurringEvents = events.filter((e) => e.isRecurring)
  const visibleEvents = recurringEvents.slice(0, maxVisible)
  const overflowCount = recurringEvents.length
  const hasOverflow = recurringEvents.length > maxVisible

  return (
    <SectionContainer colorScheme={colorScheme} className="pt-[40px] pb-[80px]">
      <h2 className="text-h2 text-black-1 text-center mb-[48px]">
        {content.heading}
      </h2>

      <div className="mx-auto max-w-[860px] flex flex-col gap-[16px]">
        {visibleEvents.map((event) => (
          <MeetingItem key={event.slug} event={event} />
        ))}
      </div>

      {hasOverflow && (
        <div className="flex justify-center mt-[32px]">
          <Link
            href={viewAllHref}
            className="inline-flex items-center gap-2 text-button-1 text-black-2 transition-colors hover:text-black-1 hover:underline transition-all duration-3000 ease-in-out"
          >
            View all ({overflowCount})
            <IconArrowUpRight className="size-5" />
          </Link>
        </div>
      )}
    </SectionContainer>
  )
}

function MeetingItem({ event }: { event: Event }) {
  const schedule = event.recurrenceSchedule
  const hasOnlineMeeting = !!event.meetingUrl

  return (
    <div className="bg-white-0 border border-white-2-5 rounded-[24px] shadow-[0px_12px_20px_0px_rgba(0,0,0,0.03)]">
      <div className="flex flex-col lg:flex-row lg:items-center gap-[20px] px-[20px] py-[20px] lg:px-[24px]">
        <div className="flex-1 min-w-0 flex flex-col gap-[8px]">
          <div className="flex gap-2 lg:gap-3 items-center justify-center">
            <TypePill type={event.type} className="shrink-0" />
            <Link
              href={`/events/${event.slug}`}
              className="flex-1 min-w-0 text-[16px] lg:text-[18px] font-medium text-black-1 leading-snug tracking-[-0.4px] hover:underline"
            >
              {event.title}
            </Link>
          </div>

          <div className="flex gap-[12px] items-center px-[8px]">
            {schedule && (
              <span className="inline-flex items-center gap-[6px] text-body-2 text-black-3">
                <IconCalendar className="size-[16px] shrink-0" />
                {schedule}
              </span>
            )}
            <span className="inline-flex items-center gap-[6px] text-body-2 text-black-3">
              <IconClock className="size-[16px] shrink-0" />
              {event.time}
            </span>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-[12px] items-stretch lg:items-center lg:shrink-0 w-full lg:w-auto">
          {hasOnlineMeeting && (
            <a
              href={event.meetingUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full lg:w-auto flex-1 lg:flex-initial inline-flex items-center justify-center gap-[8px] rounded-full bg-black-1 border border-black-1 px-[21px] py-[17px] text-button-2 text-white-1 whitespace-nowrap transition-colors hover:bg-black-2 hover:border-black-2"
            >
              <IconVideo className="size-[14px]" />
              Join online meeting
            </a>
          )}
          <Link
            href={`/events/${event.slug}`}
            className="w-full lg:w-auto flex-1 lg:flex-initial inline-flex items-center justify-center gap-[8px] rounded-full bg-white-1 border border-white-2-5 px-[21px] py-[17px] text-button-2 text-black-2 whitespace-nowrap transition-colors hover:bg-white-2"
          >
            View detail
            <IconArrowUpRight className="size-[14px]" />
          </Link>
        </div>
      </div>
    </div>
  )
}
