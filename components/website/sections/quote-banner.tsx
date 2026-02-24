"use client"

import SectionContainer from "@/components/website/shared/section-container"
import { cn } from "@/lib/utils"
import type { SectionTheme } from "@/components/website/shared/theme-tokens"

interface QuoteBannerContent {
  overline: string
  heading: string
  verse: { text: string; reference: string }
}

interface Props {
  content: QuoteBannerContent
  enableAnimations: boolean
  colorScheme?: SectionTheme
}

export default function QuoteBannerSection({ content, enableAnimations }: Props) {
  const animate = enableAnimations !== false

  return (
    <SectionContainer
      colorScheme="dark"
      containerWidth="narrow"
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
        <div className={cn("relative flex flex-col items-center gap-4 lg:gap-6", animate && "animate-hero-fade-up")}>
          <p className="text-overline text-white-3">{content.overline}</p>
          <h2 className="text-script-heading text-white-1">
            {content.heading}
          </h2>
        </div>

        <div className={cn("relative flex flex-col items-center gap-4", animate && "animate-hero-fade-up-delayed")}>
          <p className="text-body-1 text-white-2 max-w-[960px] leading-[1.5]">
            {content.verse.text}
          </p>
          <p className="text-h4 text-white-3">{content.verse.reference}</p>
        </div>
      </div>
    </SectionContainer>
  )
}
