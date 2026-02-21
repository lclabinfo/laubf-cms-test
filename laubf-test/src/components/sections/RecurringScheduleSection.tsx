/*
 * CMS SETTINGS:
 * -- Content (BASIC) --
 *   heading: string -- section heading
 *   subtitle?: string -- supporting text
 * -- Meetings (BASIC) --
 *   meetings[]: { title, description?, time, days[], location? }
 * -- Animation (ADVANCED) --
 *   enableAnimations?: boolean (default true) — toggle scroll-reveal animations
 * -- Layout (ADVANCED) --
 *   visible, colorScheme, paddingY, containerWidth
 *
 * DB SCHEMA: recurring_schedule_sections (id, heading, subtitle, visible, color_scheme)
 * DB SCHEMA: weekly_meetings (id, section_id, title, description, time, days, location, sort_order)
 */
"use client";

import SectionContainer from "@/components/shared/SectionContainer";
import AnimateOnScroll from "@/components/shared/AnimateOnScroll";
import { themeTokens } from "@/lib/theme";
import type { RecurringScheduleSectionProps } from "@/lib/types/sections";
import { IconClock, IconMapPin } from "@/components/layout/icons";
import { cn } from "@/lib/utils";

const ALL_DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] as const;
const DAY_LABELS: Record<string, string> = {
  Mon: "M",
  Tue: "T",
  Wed: "W",
  Thu: "T",
  Fri: "F",
  Sat: "S",
  Sun: "S",
};

export default function RecurringScheduleSection(props: {
  settings: RecurringScheduleSectionProps;
}) {
  const { settings } = props;
  const { content } = settings;
  const t = themeTokens[settings.colorScheme];
  const animate = settings.enableAnimations !== false;

  return (
    <SectionContainer settings={settings}>
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
            meeting.days.includes(day);

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
                  <h3
                    className={`text-[17px] font-medium leading-snug ${t.textPrimary}`}
                  >
                    {meeting.title}
                  </h3>
                  <div
                    className={cn(
                      "shrink-0 flex items-center gap-1.5 rounded-full px-3 py-1",
                      t.surfaceBg
                    )}
                  >
                    <IconClock className={`size-3.5 ${t.textMuted}`} />
                    <span
                      className={`text-[13px] font-medium ${t.textSecondary}`}
                    >
                      {meeting.time}
                    </span>
                  </div>
                </div>

                {/* Description */}
                {meeting.description && (
                  <p
                    className={`text-[14px] ${t.textMuted} mb-4 leading-relaxed`}
                  >
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
                    <IconMapPin
                      className={`size-3.5 ${t.textMuted} shrink-0`}
                    />
                    <span className={`text-[13px] ${t.textMuted}`}>
                      {meeting.location}
                    </span>
                  </div>
                )}
              </div>
            </AnimateOnScroll>
          );
        })}
      </div>
    </SectionContainer>
  );
}
