"use client"

import { useRef, useState, useEffect, useCallback } from "react"
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
  dateEnd?: string
  timeStart: string
  type: string
  location: string
  thumbnailUrl?: string
  isFeatured: boolean
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

  // Hide the entire section when there are no events to display
  if (events.length === 0) return null

  // Carousel when more items than fit in one row:
  // Desktop (lg): 3 columns, Tablet (md): 2 columns, Mobile: 1 column
  // We use the desktop breakpoint as the threshold since the carousel
  // component handles responsive card widths internally
  const needsCarousel = events.length > 3

  return (
    <SectionContainer colorScheme={colorScheme} paddingY={paddingY} containerWidth={containerWidth}>
      {/* Header -- centered */}
      <AnimateOnScroll animation="fade-up" enabled={animate} className="flex flex-col items-center text-center mb-12 lg:mb-16">
        {content.overline && (
          <OverlineLabel text={content.overline} className="mb-3" />
        )}
        <h2 className={`text-h2 ${t.textPrimary}`}>{content.heading}</h2>
      </AnimateOnScroll>

      {/* Event cards */}
      {needsCarousel ? (
        <EventCarousel events={events} />
      ) : (
        <div className={`flex flex-wrap justify-center gap-5 ${events.length === 3 ? "lg:grid lg:grid-cols-3" : ""}`}>
          {events.map((event) => (
            <div key={event.slug} className={`w-full ${events.length === 1 ? "max-w-sm" : "md:w-[calc(50%-10px)]"} ${events.length === 3 ? "lg:w-full" : ""}`}>
              <EventGridCard event={event} />
            </div>
          ))}
        </div>
      )}

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

/* ------------------------------------------------------------------ */
/*  Horizontal scroll carousel for 4+ events                         */
/* ------------------------------------------------------------------ */

function EventCarousel({ events }: { events: Event[] }) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const [canScrollLeft, setCanScrollLeft] = useState(false)
  const [canScrollRight, setCanScrollRight] = useState(false)

  const checkOverflow = useCallback(() => {
    const el = scrollRef.current
    if (!el) return
    setCanScrollLeft(el.scrollLeft > 2)
    setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 2)
  }, [])

  useEffect(() => {
    checkOverflow()
    const el = scrollRef.current
    if (!el) return
    el.addEventListener("scroll", checkOverflow, { passive: true })
    window.addEventListener("resize", checkOverflow)
    return () => {
      el.removeEventListener("scroll", checkOverflow)
      window.removeEventListener("resize", checkOverflow)
    }
  }, [checkOverflow])

  const scroll = (direction: "left" | "right") => {
    const el = scrollRef.current
    if (!el) return
    // Scroll by roughly one card width + gap
    const cardWidth = el.querySelector<HTMLElement>(":scope > div")?.offsetWidth ?? 320
    el.scrollBy({ left: direction === "left" ? -cardWidth - 20 : cardWidth + 20, behavior: "smooth" })
  }

  return (
    <div className="relative">
      {/* Left arrow */}
      {canScrollLeft && (
        <button
          type="button"
          aria-label="Scroll left"
          onClick={() => scroll("left")}
          className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-3 z-10 hidden md:flex items-center justify-center w-10 h-10 rounded-full bg-white-0/90 border border-white-2 shadow-md hover:bg-white-1 transition-colors"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6" /></svg>
        </button>
      )}

      {/* Right arrow */}
      {canScrollRight && (
        <button
          type="button"
          aria-label="Scroll right"
          onClick={() => scroll("right")}
          className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-3 z-10 hidden md:flex items-center justify-center w-10 h-10 rounded-full bg-white-0/90 border border-white-2 shadow-md hover:bg-white-1 transition-colors"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6" /></svg>
        </button>
      )}

      {/* Scrollable track */}
      <div
        ref={scrollRef}
        className="flex gap-5 overflow-x-auto scroll-smooth snap-x snap-mandatory pb-4 -mb-4 scrollbar-hide"
        style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
      >
        {events.map((event) => (
          <div
            key={event.slug}
            className="shrink-0 snap-start w-[85vw] sm:w-[calc(50%-10px)] lg:w-[calc(33.333%-14px)]"
          >
            <EventGridCard event={event} />
          </div>
        ))}
      </div>
    </div>
  )
}
