/*
 * CMS SETTINGS:
 * -- Content (BASIC) --
 *   overline?: string -- label above heading (e.g. "YOUNG ADULT MINISTRY")
 *   heading: string -- section heading (e.g. "Upcoming Events")
 * -- Events (BASIC) --
 *   events: Event[] -- event objects from database
 * -- CTA (BASIC) --
 *   ctaButton?: { label, href }
 * -- Animation (ADVANCED) --
 *   enableAnimations?: boolean (default true) — toggle scroll-reveal animations
 *     Animations: header fades up, event cards stagger in.
 * -- Layout (ADVANCED) --
 *   visible, colorScheme, paddingY, containerWidth
 *
 * DB SCHEMA: upcoming_events_sections (id, overline, heading, cta_label, cta_href, visible, color_scheme)
 * Events fetched from events table filtered by ministry
 */
"use client";

import SectionContainer from "@/components/shared/SectionContainer";
import OverlineLabel from "@/components/shared/OverlineLabel";
import CTAButton from "@/components/shared/CTAButton";
import AnimateOnScroll from "@/components/shared/AnimateOnScroll";
import EventGridCard from "@/components/shared/EventGridCard";
import { themeTokens } from "@/lib/theme";
import type { UpcomingEventsSectionProps } from "@/lib/types/sections";
import type { Event } from "@/lib/types/events";
import { IconArrowRight } from "@/components/layout/icons";

export default function UpcomingEventsSection(props: {
  settings: UpcomingEventsSectionProps;
  events: Event[];
}) {
  const { settings, events } = props;
  const { content } = settings;
  const t = themeTokens[settings.colorScheme];
  const animate = settings.enableAnimations !== false;

  return (
    <SectionContainer settings={settings}>
      {/* Header — centered */}
      <AnimateOnScroll animation="fade-up" enabled={animate} className="flex flex-col items-center text-center mb-12 lg:mb-16">
        {content.overline && (
          <OverlineLabel text={content.overline} className="mb-3" />
        )}
        <h2 className={`text-h2 ${t.textPrimary}`}>{content.heading}</h2>
      </AnimateOnScroll>

      {/* Event cards grid — same component as events page */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {events.map((event) => (
          <EventGridCard key={event.slug} event={event} />
        ))}
      </div>

      {/* CTA button */}
      {content.ctaButton && (
        <div className="flex justify-center mt-10">
          <CTAButton
            label={content.ctaButton.label}
            href={content.ctaButton.href}
            variant="secondary"
            icon={<IconArrowRight className="ml-2 size-4" />}
          />
        </div>
      )}
    </SectionContainer>
  );
}
