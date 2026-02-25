"use client"

import Image from "next/image"
import { Users } from "lucide-react"
import SectionContainer from "@/components/website/shared/section-container"
import CTAButton from "@/components/website/shared/cta-button"
import AnimateOnScroll from "@/components/website/shared/animate-on-scroll"
import { themeTokens, type SectionTheme } from "@/components/website/shared/theme-tokens"

interface NewcomerContent {
  heading: string
  description: string
  buttonLabel: string
  buttonHref: string
  image?: { src: string; alt: string; objectPosition?: string }
}

interface Props {
  content: NewcomerContent
  enableAnimations: boolean
  colorScheme?: SectionTheme
  paddingY?: "none" | "compact" | "default" | "spacious"
  containerWidth?: "standard" | "narrow" | "full"
}

export default function NewcomerSection({ content, enableAnimations, colorScheme = "light", paddingY, containerWidth }: Props) {
  const t = themeTokens[colorScheme]
  const animate = enableAnimations !== false

  return (
    <SectionContainer colorScheme={colorScheme} paddingY={paddingY} containerWidth={containerWidth}>
      <div className="flex flex-col items-center gap-16 lg:gap-20">
        <AnimateOnScroll
          animation="fade-up"
          enabled={animate}
          className="flex flex-col items-center gap-10 text-center max-w-[640px] mx-auto"
        >
          {/* Icon + text group */}
          <div className="flex flex-col items-center gap-4 w-full">
            <Users className={`size-12 ${t.textMuted}`} strokeWidth={1.5} />
            <div className="flex flex-col items-center gap-5 w-full">
              <h2 className={`text-h2 ${t.textPrimary}`}>{content.heading}</h2>
              <p className={`text-body-1 ${t.textSecondary}`}>
                {content.description}
              </p>
            </div>
          </div>

          <CTAButton
            label={content.buttonLabel}
            href={content.buttonHref}
            variant="primary"
            theme={colorScheme === "dark" ? "dark" : "light"}
          />
        </AnimateOnScroll>

        {content.image && (
          <AnimateOnScroll animation="fade-up" enabled={animate} className="w-full">
            <div className="relative w-full h-[240px] md:h-[320px] lg:h-[400px] rounded-xl overflow-hidden">
              <Image
                src={content.image.src}
                alt={content.image.alt}
                fill
                className="object-cover"
                style={{ objectPosition: content.image.objectPosition ?? "center" }}
              />
            </div>
          </AnimateOnScroll>
        )}
      </div>
    </SectionContainer>
  )
}
