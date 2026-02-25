"use client"

import SectionContainer from "@/components/website/shared/section-container"
import ImageCard from "@/components/website/shared/image-card"
import AnimateOnScroll from "@/components/website/shared/animate-on-scroll"
import CTAButton from "@/components/website/shared/cta-button"
import type { SectionTheme } from "@/components/website/shared/theme-tokens"

interface ImageCardData {
  id: string
  title: string
  description: string
  imageUrl: string
  href?: string
  objectPosition?: string
}

interface ActionCardGridContent {
  heading: { line1: string; line2: string; line3: string }
  subheading: string
  ctaButton?: { label: string; href: string }
  cards: ImageCardData[]
}

interface Props {
  content: ActionCardGridContent
  enableAnimations: boolean
  colorScheme?: SectionTheme
  paddingY?: "none" | "compact" | "default" | "spacious"
  containerWidth?: "standard" | "narrow" | "full"
}

export default function ActionCardGridSection({ content, enableAnimations, colorScheme = "light", paddingY, containerWidth }: Props) {
  const animate = enableAnimations !== false

  return (
    <SectionContainer colorScheme={colorScheme} paddingY={paddingY} containerWidth={containerWidth}>
      <div className="flex flex-col gap-10 lg:flex-row lg:gap-10">
        {/* Left header */}
        <AnimateOnScroll animation="fade-left" enabled={animate} className="flex flex-col gap-5 lg:w-[280px] lg:shrink-0">
          <h2 className="text-h2 text-black-1 leading-none">
            <span>{content.heading.line1}</span>
            <br />
            <span className="font-display italic font-normal">
              {content.heading.line2}
            </span>
            <br />
            <span>{content.heading.line3}</span>
          </h2>
          <p className="text-h4 text-black-2">{content.subheading}</p>
          {content.ctaButton && (
            <CTAButton
              label={content.ctaButton.label}
              href={content.ctaButton.href}
              variant="primary"
              className="w-fit"
            />
          )}
        </AnimateOnScroll>

        {/* 2x2 grid */}
        <div className="grid flex-1 grid-cols-1 gap-5 lg:grid-cols-2">
          {content.cards.map((card, i) => (
            <AnimateOnScroll key={card.id} animation="fade-up" staggerIndex={i} enabled={animate}>
              <ImageCard data={card} />
            </AnimateOnScroll>
          ))}
        </div>
      </div>
    </SectionContainer>
  )
}
