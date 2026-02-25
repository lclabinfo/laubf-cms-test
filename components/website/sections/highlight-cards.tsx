"use client"

import SectionContainer from "@/components/website/shared/section-container"
import SectionHeader from "@/components/website/shared/section-header"
import EventCard from "@/components/website/shared/event-card"
import AnimateOnScroll from "@/components/website/shared/animate-on-scroll"
import type { SectionTheme } from "@/components/website/shared/theme-tokens"

interface EventCardData {
  id: string
  title: string
  date: string
  location: string
  imageUrl?: string | null
  badge?: string
  slug: string
  objectPosition?: string
}

interface HighlightCardsContent {
  heading: string
  subheading?: string
  ctaLabel?: string
  ctaHref?: string
  featuredEvents: EventCardData[]
}

interface Props {
  content: HighlightCardsContent
  enableAnimations: boolean
  colorScheme?: SectionTheme
}

export default function HighlightCardsSection({ content, enableAnimations, colorScheme = "light" }: Props) {
  const events = content.featuredEvents ?? []
  const animate = enableAnimations !== false

  return (
    <SectionContainer colorScheme={colorScheme} className="!pt-24 lg:!pt-25 lg:!pb-10">
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
  )
}
