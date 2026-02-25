"use client"

import SectionContainer from "@/components/website/shared/section-container"
import AnimateOnScroll from "@/components/website/shared/animate-on-scroll"
import { themeTokens, type SectionTheme } from "@/components/website/shared/theme-tokens"
import Image from "next/image"

interface MinistryIntroContent {
  overline: string
  heading: string
  description: string
  image?: { src: string; alt: string; objectPosition?: string }
}

interface Props {
  content: MinistryIntroContent
  enableAnimations: boolean
  colorScheme?: SectionTheme
  paddingY?: "none" | "compact" | "default" | "spacious"
  containerWidth?: "standard" | "narrow" | "full"
}

export default function MinistryIntroSection({ content, enableAnimations, colorScheme = "light", paddingY, containerWidth }: Props) {
  const t = themeTokens[colorScheme]
  const animate = enableAnimations !== false
  const hasSideImage = !!content.image

  if (hasSideImage) {
    return (
      <SectionContainer colorScheme={colorScheme} paddingY={paddingY} containerWidth={containerWidth}>
        <div className="flex flex-col lg:flex-row gap-10 lg:gap-16 items-center">
          {/* Left -- image */}
          <AnimateOnScroll animation="fade-left" enabled={animate} className="w-full lg:w-[45%] shrink-0">
            <div className="relative w-full aspect-[4/3] rounded-2xl overflow-hidden">
              <Image
                src={content.image!.src}
                alt={content.image!.alt}
                fill
                className="object-cover"
                style={{ objectPosition: content.image?.objectPosition }}
              />
            </div>
          </AnimateOnScroll>

          {/* Right -- text */}
          <AnimateOnScroll animation="fade-right" staggerIndex={1} staggerBaseMs={150} enabled={animate} className="w-full lg:w-[55%]">
            <p className={`text-h4 font-normal ${t.textMuted} mb-3`}>
              {content.overline}
            </p>
            <h2 className={`text-h2 ${t.textPrimary} mb-5`}>
              {content.heading}
            </h2>
            <p className={`text-body-1 ${t.textSecondary} leading-relaxed whitespace-pre-line`}>
              {content.description}
            </p>
          </AnimateOnScroll>
        </div>
      </SectionContainer>
    )
  }

  /* Single-column variant (no image) */
  return (
    <SectionContainer colorScheme={colorScheme} paddingY={paddingY} containerWidth={containerWidth}>
      <AnimateOnScroll animation="fade-up" enabled={animate} className="max-w-3xl">
        <p className={`text-h4 font-normal ${t.textMuted} mb-3`}>
          {content.overline}
        </p>
        <h2 className={`text-h2 ${t.textPrimary} mb-5`}>
          {content.heading}
        </h2>
        <p className={`text-body-1 ${t.textSecondary} leading-relaxed whitespace-pre-line`}>
          {content.description}
        </p>
      </AnimateOnScroll>
    </SectionContainer>
  )
}
