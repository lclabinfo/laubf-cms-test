"use client"

import SectionContainer from "@/components/website/shared/section-container"
import SectionHeader from "@/components/website/shared/section-header"
import EventCard from "@/components/website/shared/event-card"
import { cn } from "@/lib/utils"
import type { SectionTheme } from "@/components/website/shared/theme-tokens"

interface EventCardData {
  id: string
  title: string
  date: string
  location: string
  imageUrl: string
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
        <div className={cn(animate && "animate-hero-fade-up")}>
          <SectionHeader
            heading={content.heading}
            subheading={content.subheading}
            ctaLabel={content.ctaLabel}
            ctaHref={content.ctaHref}
          />
        </div>

        {/* Events grid: 1 large + 2 small stacked */}
        <div className="grid gap-5 lg:grid-cols-2">
          {/* Large card */}
          {events[0] && (
            <div className={cn("h-full", animate && "animate-hero-fade-up")}>
              <EventCard data={events[0]} size="large" />
            </div>
          )}

          {/* Two small cards stacked */}
          <div className="flex flex-col gap-5">
            {events[1] && (
              <div className={cn(animate && "animate-hero-fade-up-delayed")}>
                <EventCard data={events[1]} size="small" />
              </div>
            )}
            {events[2] && (
              <div className={cn(animate && "animate-hero-fade-up-delayed")}>
                <EventCard data={events[2]} size="small" />
              </div>
            )}
          </div>
        </div>
      </div>
    </SectionContainer>
  )
}
