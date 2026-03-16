"use client"

import type { ReactNode } from "react"
import SectionContainer from "@/components/website/shared/section-container"
import OverlineLabel from "@/components/website/shared/overline-label"
import AnimateOnScroll from "@/components/website/shared/animate-on-scroll"
import type { SectionTheme } from "@/components/website/shared/theme-tokens"

/**
 * Converts leading verse numbers (e.g. "16 They are not...") into <sub> elements.
 * Matches numbers at the start of the text or after a space that precede a capital letter.
 */
function formatVerseText(text: string): ReactNode[] {
  // Split on verse numbers: a number followed by a space then a capital letter or quote
  const parts = text.split(/(\b\d{1,3}\s)(?=[A-Z\u201C\u201D"'])/g)
  const result: ReactNode[] = []
  for (let i = 0; i < parts.length; i++) {
    const part = parts[i]
    if (/^\d{1,3}\s$/.test(part)) {
      result.push(
        <sup key={i} className="text-[0.65em] text-white-3 font-medium mr-0.5 align-super">
          {part.trim()}
        </sup>
      )
    } else if (part) {
      result.push(part)
    }
  }
  return result
}

interface QuoteBannerContent {
  overline: string
  heading: string
  verse: { text: string; reference: string }
}

interface Props {
  content: QuoteBannerContent
  enableAnimations: boolean
  colorScheme?: SectionTheme
  paddingY?: "none" | "compact" | "default" | "spacious"
  containerWidth?: "standard" | "narrow" | "full"
}

export default function QuoteBannerSection({ content, enableAnimations, paddingY, containerWidth }: Props) {
  const animate = enableAnimations !== false

  return (
    <SectionContainer
      colorScheme="dark"
      paddingY={paddingY}
      containerWidth={containerWidth ?? "narrow"}
      bgOverride="bg-gradient-to-b from-black-gradient to-black-1 to-[67%]"
    >
      <div className="relative flex flex-col items-center gap-10 text-center overflow-hidden">
        {/* Spotlight beam from top center */}
        <div
          className="absolute top-[-120px] left-1/2 -translate-x-1/2 w-[926px] h-[500px] pointer-events-none"
          style={{
            background:
              "conic-gradient(from 180deg at 50% 0%, transparent 135deg, rgba(250,250,250,0.06) 160deg, rgba(250,250,250,0.12) 175deg, rgba(250,250,250,0.18) 180deg, rgba(250,250,250,0.12) 185deg, rgba(250,250,250,0.06) 200deg, transparent 225deg)",
            maskImage:
              "radial-gradient(ellipse 60% 80% at 50% 0%, black 0%, transparent 100%)",
            WebkitMaskImage:
              "radial-gradient(ellipse 60% 80% at 50% 0%, black 0%, transparent 100%)",
          }}
        />

        {/* Content */}
        <AnimateOnScroll animation="fade-up" enabled={animate} className="relative flex flex-col items-center gap-4 lg:gap-6">
          <OverlineLabel text={content.overline} className="text-white-3" />
          <h2 className="text-script-heading text-white-1">
            {content.heading}
          </h2>
        </AnimateOnScroll>

        <AnimateOnScroll animation="fade-in" staggerIndex={1} staggerBaseMs={200} enabled={animate} className="relative flex flex-col items-center gap-4">
          <p className="text-body-1 text-white-2 max-w-[960px] leading-[1.5]">
            {formatVerseText(content.verse.text)}
          </p>
          <p className="text-h4 text-white-3">{content.verse.reference}</p>
        </AnimateOnScroll>
      </div>
    </SectionContainer>
  )
}
