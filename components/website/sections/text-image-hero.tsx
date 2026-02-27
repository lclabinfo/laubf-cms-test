"use client"

import SectionContainer from "@/components/website/shared/section-container"
import { themeTokens, type SectionTheme } from "@/components/website/shared/theme-tokens"
import { cn } from "@/lib/utils"
import Image from "next/image"

const alignmentClasses = {
  left: { wrapper: "", heading: "", description: "max-w-xl" },
  center: { wrapper: "text-center items-center mx-auto max-w-[680px]", heading: "", description: "max-w-[680px]" },
  right: { wrapper: "text-right items-end ml-auto", heading: "", description: "max-w-xl ml-auto" },
} as const

interface TextImageHeroContent {
  overline: string
  headingLine1: string
  headingAccent?: string
  description: string
  image: { src: string; alt: string; objectPosition?: string }
  textAlign?: "left" | "center" | "right"
}

interface Props {
  content: TextImageHeroContent
  enableAnimations: boolean
  colorScheme?: SectionTheme
  paddingY?: "none" | "compact" | "default" | "spacious"
  containerWidth?: "standard" | "narrow" | "full"
}

export default function TextImageHeroSection({ content, enableAnimations, colorScheme = "light", paddingY, containerWidth }: Props) {
  const t = themeTokens[colorScheme]
  const animate = enableAnimations !== false
  const align = content.textAlign ?? "left"
  const a = alignmentClasses[align]

  return (
    <SectionContainer colorScheme={colorScheme} paddingY={paddingY} containerWidth={containerWidth} className="pt-12 lg:pt-16">
      <div className={cn(`mb-12 lg:mb-16 flex flex-col ${a.wrapper}`, animate && "animate-hero-fade-up")}>
        <p className={`text-overline ${t.textMuted} mb-4`}>{content.overline}</p>
        <h1 className={`mb-6 ${a.heading}`}>
          <span className={`text-h1 ${t.textPrimary} block`}>{content.headingLine1}</span>
          {content.headingAccent && (
            <span className={`text-display-heading ${t.textPrimary} block mt-1`}>{content.headingAccent}</span>
          )}
        </h1>
        <p className={`text-body-1 ${t.textMuted} ${a.description}`}>{content.description}</p>
      </div>

      <div className={cn("relative w-full aspect-[16/7] rounded-2xl overflow-hidden", animate && "animate-hero-fade-up-delayed")}>
        {content.image?.src ? (
          <Image src={content.image.src} alt={content.image.alt} fill className="object-cover" priority style={{ objectPosition: content.image.objectPosition }} />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-white-2 to-white-1-5" />
        )}
      </div>
    </SectionContainer>
  )
}
