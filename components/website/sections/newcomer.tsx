"use client"

import Image from "next/image"
import { Users } from "lucide-react"
import SectionContainer from "@/components/website/shared/section-container"
import CTAButton from "@/components/website/shared/cta-button"
import { themeTokens, type SectionTheme } from "@/components/website/shared/theme-tokens"
import { cn } from "@/lib/utils"

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
}

export default function NewcomerSection({ content, enableAnimations, colorScheme = "light" }: Props) {
  const t = themeTokens[colorScheme]
  const animate = enableAnimations !== false

  return (
    <SectionContainer colorScheme={colorScheme}>
      <div className="flex flex-col items-center gap-16 lg:gap-20">
        <div
          className={cn(
            "flex flex-col items-center gap-10 text-center max-w-[640px] mx-auto",
            animate && "animate-hero-fade-up"
          )}
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
        </div>

        {content.image && (
          <div className={cn("w-full", animate && "animate-hero-fade-up-delayed")}>
            <div className="relative w-full h-[240px] md:h-[320px] lg:h-[400px] rounded-xl overflow-hidden">
              <Image
                src={content.image.src}
                alt={content.image.alt}
                fill
                className="object-cover"
                style={{ objectPosition: content.image.objectPosition ?? "center" }}
              />
            </div>
          </div>
        )}
      </div>
    </SectionContainer>
  )
}
