/*
 * CMS SETTINGS:
 * ── Content (BASIC) ──
 *   heading: string — "Featured Events"
 *   subheading: string — description
 *   ctaLabel: string — "View All Events"
 *   ctaHref: string — "/events"
 * ── Events (BASIC) ──
 *   featuredEvents[]: EventCardData[] — 3 event cards (manual pick or auto-latest)
 * ── Animation (ADVANCED) ──
 *   enableAnimations?: boolean (default true) — toggle scroll-reveal animations
 *     Animations: header fades up, event cards stagger in.
 * ── Layout (ADVANCED) ──
 *   paddingY, colorScheme
 *
 * DB SCHEMA: highlight_cards_sections (id, heading, subheading, cta_label, cta_href, visible)
 *   + junction: highlight_card_picks (section_id, card_id, position)
 *   Cards collection: cards (id, title, date, location, image_url, badge, slug)
 */
"use client";

import SectionContainer from "@/components/shared/SectionContainer";
import SectionHeader from "@/components/shared/SectionHeader";
import EventCard from "@/components/shared/EventCard";
import AnimateOnScroll from "@/components/shared/AnimateOnScroll";
import type { HighlightCardsSectionProps } from "@/lib/types/sections";

export default function HighlightCardsSection(props: {
  settings: HighlightCardsSectionProps;
}) {
  const { settings } = props;
  const { content } = settings;
  const events = content.featuredEvents;
  const animate = settings.enableAnimations !== false;

  return (
    <SectionContainer settings={settings} className="!pt-24 lg:!pt-25 lg:!pb-10">
      <div className="flex flex-col gap-8 lg:gap-10">
        <AnimateOnScroll animation="fade-up" enabled={animate}>
          <SectionHeader
            heading={content.heading}
            subheading={content.subheading}
            ctaLabel={content.ctaLabel}
            ctaHref={content.ctaHref}
          />
        </AnimateOnScroll>

        {/* Events grid: 1 large + 2 small stacked */}
        <div className="grid gap-5 lg:grid-cols-2">
          {/* Large card */}
          {events[0] && (
            <AnimateOnScroll animation="fade-up" staggerIndex={0} enabled={animate} className="h-full">
              <EventCard data={events[0]} size="large" />
            </AnimateOnScroll>
          )}

          {/* Two small cards stacked */}
          <div className="flex flex-col gap-5">
            {events[1] && (
              <AnimateOnScroll animation="fade-up" staggerIndex={1} enabled={animate}>
                <EventCard data={events[1]} size="small" />
              </AnimateOnScroll>
            )}
            {events[2] && (
              <AnimateOnScroll animation="fade-up" staggerIndex={2} enabled={animate}>
                <EventCard data={events[2]} size="small" />
              </AnimateOnScroll>
            )}
          </div>
        </div>
      </div>
    </SectionContainer>
  );
}
