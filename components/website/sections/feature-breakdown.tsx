"use client"

import SectionContainer from "@/components/website/shared/section-container"
import CTAButton from "@/components/website/shared/cta-button"
import { themeTokens, type SectionTheme } from "@/components/website/shared/theme-tokens"
import { cn } from "@/lib/utils"
import Image from "next/image"

interface FeatureBreakdownContent {
  heading: string
  acronymLines: string[]
  description: string
  button: { label: string; href: string; visible: boolean }
}

interface Props {
  content: FeatureBreakdownContent
  enableAnimations: boolean
  colorScheme?: SectionTheme
}

export default function FeatureBreakdownSection({ content, enableAnimations, colorScheme = "light" }: Props) {
  const t = themeTokens[colorScheme]
  const animate = enableAnimations !== false

  return (
    <SectionContainer colorScheme={colorScheme} bgOverride="bg-brand-2" className="relative overflow-hidden !py-14 lg:!py-30">
      {/* Background watermark logo */}
      <div className="absolute right-0 top-1/2 -translate-y-1/2 opacity-[0.08] pointer-events-none">
        <Image
          src="/logo/laubf-logo-blue.svg"
          alt=""
          width={400}
          height={400}
          className="object-contain"
          aria-hidden="true"
        />
      </div>

      <div className="relative z-10 flex flex-col gap-4 lg:gap-0 mx-auto w-[80%] sm:w-full">
        {/* Heading */}
        <div className={cn(animate && "animate-hero-fade-up")}>
          <h2 className={`text-h2 ${t.textPrimary} mb-2 lg:mb-10`}>{content.heading}</h2>
        </div>

        <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:gap-16">
          {/* Left column — stacked acronym words with first-letter highlight */}
          <div className="flex flex-col gap-1 lg:w-[35%] shrink-0">
            {content.acronymLines.map((line, i) => (
              <span
                key={i}
                className="text-h2 lg:text-h1 leading-tight"
              >
                <span className={t.textPrimary}>{line.charAt(0)}</span>
                <span className={t.textMuted}>{line.slice(1)}</span>
              </span>
            ))}
          </div>

          {/* Right column — description + CTA */}
          <div className={cn("flex flex-col gap-8 lg:w-[65%]", animate && "animate-hero-fade-up-delayed")}>
            <p className={`text-body-1 ${t.textSecondary} leading-relaxed`}>
              {content.description}
            </p>

            {content.button.visible && (
              <CTAButton
                label={content.button.label}
                href={content.button.href}
                variant="primary"
                className="self-start"
              />
            )}
          </div>
        </div>
      </div>
    </SectionContainer>
  )
}
