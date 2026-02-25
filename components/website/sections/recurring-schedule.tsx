"use client"

import SectionContainer from "@/components/website/shared/section-container"
import AnimateOnScroll from "@/components/website/shared/animate-on-scroll"
import { themeTokens, type SectionTheme } from "@/components/website/shared/theme-tokens"
import { IconClock, IconMapPin } from "@/components/website/shared/icons"
import { cn } from "@/lib/utils"

const ALL_DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] as const
const DAY_LABELS: Record<string, string> = {
  Mon: "M",
  Tue: "T",
  Wed: "W",
  Thu: "T",
  Fri: "F",
  Sat: "S",
  Sun: "S",
}

interface WeeklyMeeting {
  title: string
  description?: string
  time: string
  days: string[]
  location?: string
}

interface RecurringScheduleContent {
  heading: string
  subtitle?: string
  meetings: WeeklyMeeting[]
}

interface Props {
  content: RecurringScheduleContent
  enableAnimations: boolean
  colorScheme?: SectionTheme
  paddingY?: "none" | "compact" | "default" | "spacious"
  containerWidth?: "standard" | "narrow" | "full"
}

export default function RecurringScheduleSection({ content, enableAnimations, colorScheme = "light", paddingY, containerWidth }: Props) {
  const t = themeTokens[colorScheme]
  const animate = enableAnimations !== false

  return (
    <SectionContainer colorScheme={colorScheme} paddingY={paddingY} containerWidth={containerWidth}>
      {/* Header */}
      <AnimateOnScroll animation="fade-up" enabled={animate} className="mb-8">
        <h2 className={`text-h2 ${t.textPrimary}`}>{content.heading}</h2>
        {content.subtitle && (
          <p className={`text-body-1 ${t.textSecondary} mt-2 max-w-[600px]`}>
            {content.subtitle}
          </p>
        )}
      </AnimateOnScroll>

      {/* Meeting cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {content.meetings.map((meeting, i) => {
          const isActive = (day: typeof ALL_DAYS[number]) =>
            meeting.days.includes(day)

          return (
            <AnimateOnScroll
              key={i}
              animation="fade-up"
              staggerIndex={i}
              staggerBaseMs={100}
              enabled={animate}
            >
              <div
                className={cn(
                  "rounded-[16px] border p-5 sm:p-6",
                  t.cardBorder,
                  t.surfaceBgSubtle,
                  "transition-shadow duration-200 hover:shadow-[0px_4px_16px_rgba(0,0,0,0.06)]"
                )}
              >
                {/* Title + time row */}
                <div className="flex items-start justify-between gap-3 mb-4">
                  <h3 className={`text-[17px] font-medium leading-snug ${t.textPrimary}`}>
                    {meeting.title}
                  </h3>
                  <div className={cn("shrink-0 flex items-center gap-1.5 rounded-full px-3 py-1", t.surfaceBg)}>
                    <IconClock className={`size-3.5 ${t.textMuted}`} />
                    <span className={`text-[13px] font-medium ${t.textSecondary}`}>
                      {meeting.time}
                    </span>
                  </div>
                </div>

                {/* Description */}
                {meeting.description && (
                  <p className={`text-[14px] ${t.textMuted} mb-4 leading-relaxed`}>
                    {meeting.description}
                  </p>
                )}

                {/* Day pills */}
                <div className="flex items-center gap-1.5 mb-4">
                  {ALL_DAYS.map((day) => (
                    <span
                      key={day}
                      className={cn(
                        "flex items-center justify-center size-8 rounded-full text-[12px] font-medium transition-colors",
                        isActive(day)
                          ? `${t.btnPrimaryBg} ${t.btnPrimaryText}`
                          : `${t.surfaceBg} ${t.textMuted}`
                      )}
                      title={day}
                    >
                      {DAY_LABELS[day]}
                    </span>
                  ))}
                </div>

                {/* Location */}
                {meeting.location && (
                  <div className="flex items-center gap-2">
                    <IconMapPin className={`size-3.5 ${t.textMuted} shrink-0`} />
                    <span className={`text-[13px] ${t.textMuted}`}>
                      {meeting.location}
                    </span>
                  </div>
                )}
              </div>
            </AnimateOnScroll>
          )
        })}
      </div>
    </SectionContainer>
  )
}
