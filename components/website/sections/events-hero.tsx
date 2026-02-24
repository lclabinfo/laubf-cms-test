"use client"

import SectionContainer from "@/components/website/shared/section-container"
import { themeTokens, type SectionTheme } from "@/components/website/shared/theme-tokens"
import { cn } from "@/lib/utils"

interface EventsHeroContent {
  heading: string
  subtitle: string
}

interface Props {
  content: EventsHeroContent
  enableAnimations: boolean
  colorScheme?: SectionTheme
}

export default function EventsHeroSection({ content, enableAnimations, colorScheme = "light" }: Props) {
  const t = themeTokens[colorScheme]
  const animate = enableAnimations !== false

  return (
    <SectionContainer colorScheme={colorScheme}>
      <div className="flex flex-col items-start">
        <h1 className={cn(`text-h1 ${t.textPrimary}`, animate && "animate-hero-fade-up")}>{content.heading}</h1>
        <p className={cn(`text-body-1 ${t.textSecondary} mt-4 max-w-[600px] text-balance`, animate && "animate-hero-fade-up-delayed")}>
          {content.subtitle}
        </p>
      </div>
    </SectionContainer>
  )
}
