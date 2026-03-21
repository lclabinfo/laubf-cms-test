"use client"

import SectionContainer from "@/components/website/shared/section-container"
import { themeTokens, type SectionTheme } from "@/components/website/shared/theme-tokens"
import CTAButton from "@/components/website/shared/cta-button"
import AnimateOnScroll from "@/components/website/shared/animate-on-scroll"
import Image from "next/image"
import { cn } from "@/lib/utils"

interface CTABannerContent {
  overline: string
  heading: string
  body: string
  primaryButton: { label: string; href: string; visible: boolean }
  secondaryButton: { label: string; href: string; visible: boolean }
  backgroundImage?: { src: string; alt: string; objectPosition?: string }
}

interface Props {
  content: CTABannerContent
  enableAnimations: boolean
  colorScheme?: SectionTheme
  paddingY?: "none" | "compact" | "default" | "spacious"
  containerWidth?: "standard" | "narrow" | "full"
}

export default function CTABannerSection({ content, enableAnimations, colorScheme = "dark", paddingY, containerWidth }: Props) {
  const animate = enableAnimations !== false
  const t = themeTokens[colorScheme]

  return (
    <SectionContainer colorScheme={colorScheme} paddingY={paddingY ?? "spacious"} containerWidth={containerWidth}>
      <div className="relative flex flex-col items-center gap-10 text-center">
        {/* Background image at 10% opacity */}
        {content.backgroundImage && (
          <Image
            src={content.backgroundImage.src}
            alt={content.backgroundImage.alt ?? ""}
            fill
            className="object-cover opacity-10 pointer-events-none"
            style={{ objectPosition: content.backgroundImage?.objectPosition }}
          />
        )}

        {/* Content */}
        <AnimateOnScroll animation="fade-up" enabled={animate} className="relative flex flex-col items-center gap-5 text-center">
          <div className="flex flex-col items-center gap-3">
            <p className={cn("text-h4", t.textPrimary)}>{content.overline}</p>
            <h2 className={cn("text-h2", t.textPrimary)}>{content.heading}</h2>
          </div>
          <p className={cn("text-body-1 max-w-[640px]", t.textSecondary)}>
            {content.body}
          </p>
        </AnimateOnScroll>

        {/* Buttons */}
        <AnimateOnScroll animation="fade-up" staggerIndex={1} staggerBaseMs={150} enabled={animate} className="relative flex flex-col sm:flex-row gap-3">
          {content.primaryButton.visible && (
            <CTAButton
              label={content.primaryButton.label}
              href={content.primaryButton.href}
              variant="primary"
            />
          )}
          {content.secondaryButton.visible && (
            <CTAButton
              label={content.secondaryButton.label}
              href={content.secondaryButton.href}
              variant="secondary"
            />
          )}
        </AnimateOnScroll>
      </div>
    </SectionContainer>
  )
}
