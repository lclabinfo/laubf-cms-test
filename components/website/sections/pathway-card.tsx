"use client"

import SectionContainer from "@/components/website/shared/section-container"
import CTAButton from "@/components/website/shared/cta-button"
import AnimateOnScroll from "@/components/website/shared/animate-on-scroll"
import { themeTokens, type SectionTheme } from "@/components/website/shared/theme-tokens"
import {
  IconBookOpen,
  IconGraduationCap,
  IconCalendar,
  IconArrowRight,
} from "@/components/website/shared/icons"
import type { ComponentType, SVGProps } from "react"

type IconComponent = ComponentType<SVGProps<SVGSVGElement>>

const iconMap: Record<string, IconComponent> = {
  "book-open": IconBookOpen,
  "graduation-cap": IconGraduationCap,
  calendar: IconCalendar,
}

interface PathwayCardItem {
  icon: string
  title: string
  description: string
  buttonLabel: string
  buttonHref: string
  buttonVariant: "primary" | "secondary"
}

interface PathwayCardContent {
  heading: string
  description: string
  cards: PathwayCardItem[]
}

interface Props {
  content: PathwayCardContent
  enableAnimations: boolean
  colorScheme?: SectionTheme
  paddingY?: "none" | "compact" | "default" | "spacious"
  containerWidth?: "standard" | "narrow" | "full"
}

export default function PathwayCardSection({ content, enableAnimations, colorScheme = "light", paddingY, containerWidth }: Props) {
  const t = themeTokens[colorScheme]
  const animate = enableAnimations !== false

  return (
    <SectionContainer colorScheme={colorScheme} paddingY={paddingY} containerWidth={containerWidth}>
      <div className="flex flex-col items-center gap-16">
        {/* Section header */}
        <AnimateOnScroll animation="fade-up" enabled={animate} className="flex flex-col items-center gap-5 text-center max-w-3xl mx-auto">
          <h2 className={`text-h2 ${t.textPrimary}`}>{content.heading}</h2>
          <p className={`text-body-1 ${t.textSecondary}`}>{content.description}</p>
        </AnimateOnScroll>

        {/* Cards grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10 lg:gap-14 w-full">
          {content.cards.map((card, i) => {
            const Icon = iconMap[card.icon]

            return (
              <AnimateOnScroll
                key={i}
                animation="fade-up"
                staggerIndex={i}
                staggerBaseMs={120}
                enabled={animate}
                className="flex flex-col items-center text-center gap-5"
              >
                {/* Icon */}
                {Icon && (
                  <div className="flex items-center justify-center w-10 h-10">
                    <Icon className={`w-10 h-10 ${t.textPrimary}`} />
                  </div>
                )}

                {/* Title */}
                <h3 className={`text-h3 font-medium ${t.textPrimary}`}>
                  {card.title}
                </h3>

                {/* Description */}
                <p className={`text-body-2 ${t.textSecondary}`}>{card.description}</p>

                {/* CTA button */}
                <div className="mt-auto pt-3">
                  <CTAButton
                    label={card.buttonLabel}
                    href={card.buttonHref}
                    variant={card.buttonVariant}
                    icon={
                      card.buttonVariant === "secondary" ? (
                        <IconArrowRight className="ml-2 size-4" />
                      ) : undefined
                    }
                  />
                </div>
              </AnimateOnScroll>
            )
          })}
        </div>
      </div>
    </SectionContainer>
  )
}
