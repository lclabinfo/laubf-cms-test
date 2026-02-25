"use client"

import SectionContainer from "@/components/website/shared/section-container"
import OverlineLabel from "@/components/website/shared/overline-label"
import CTAButton from "@/components/website/shared/cta-button"
import AnimateOnScroll from "@/components/website/shared/animate-on-scroll"
import EventGridCard from "@/components/website/shared/event-grid-card"
import { themeTokens, type SectionTheme } from "@/components/website/shared/theme-tokens"
import { IconArrowRight } from "@/components/website/shared/icons"

interface Event {
  slug: string
  title: string
  dateStart: string
  timeStart: string
  type: string
  location: string
  thumbnailUrl?: string
  isFeatured: boolean
  tags?: string[]
  image?: { src: string; alt: string; objectPosition?: string }
}

interface UpcomingEventsContent {
  overline?: string
  heading: string
  ctaButton?: { label: string; href: string }
}

interface Props {
  content: UpcomingEventsContent
  enableAnimations: boolean
  colorScheme?: SectionTheme
  paddingY?: "none" | "compact" | "default" | "spacious"
  containerWidth?: "standard" | "narrow" | "full"
  events?: Event[]
}

export default function UpcomingEventsSection({ content, enableAnimations, colorScheme = "light", paddingY, containerWidth, events = [] }: Props) {
  const t = themeTokens[colorScheme]
  const animate = enableAnimations !== false

  return (
    <SectionContainer colorScheme={colorScheme} paddingY={paddingY} containerWidth={containerWidth}>
      {/* Header -- centered */}
      <AnimateOnScroll animation="fade-up" enabled={animate} className="flex flex-col items-center text-center mb-12 lg:mb-16">
        {content.overline && (
          <OverlineLabel text={content.overline} className="mb-3" />
        )}
        <h2 className={`text-h2 ${t.textPrimary}`}>{content.heading}</h2>
      </AnimateOnScroll>

      {/* Event cards grid */}
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
  )
}
