"use client"

import SectionContainer from "@/components/website/shared/section-container"
import { themeTokens, type SectionTheme } from "@/components/website/shared/theme-tokens"
import { cn } from "@/lib/utils"
import Image from "next/image"

interface AboutDescriptionContent {
  logoSrc: string
  heading: string
  description: string
  videoUrl?: string
  videoTitle?: string
}

interface Props {
  content: AboutDescriptionContent
  enableAnimations: boolean
  colorScheme?: SectionTheme
}

export default function AboutDescriptionSection({ content, enableAnimations, colorScheme = "light" }: Props) {
  const t = themeTokens[colorScheme]
  const animate = enableAnimations !== false

  return (
    <SectionContainer colorScheme={colorScheme}>
      {/* Centered header with logo */}
      <div className={cn("flex flex-col items-center text-center max-w-[840px] mx-auto", animate && "animate-hero-fade-up")}>
        {/* Logo */}
        <div className="mb-5">
          <Image
            src={content.logoSrc}
            alt=""
            width={120}
            height={100}
            className="object-contain"
          />
        </div>

        {/* Heading */}
        <h2 className={`text-h2 ${t.textPrimary} mb-8`}>{content.heading}</h2>

        {/* Description */}
        <p className={`text-body-1 ${t.textSecondary} leading-relaxed`}>
          {content.description}
        </p>
      </div>

      {/* Video embed */}
      {content.videoUrl && (
        <div className={cn("mt-12 lg:mt-16 max-w-[854px] mx-auto", animate && "animate-hero-fade-up-delayed")}>
          <div className="relative aspect-video rounded-2xl overflow-hidden">
            <iframe
              src={content.videoUrl}
              title={content.videoTitle || "Video"}
              className="w-full h-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
        </div>
      )}
    </SectionContainer>
  )
}
