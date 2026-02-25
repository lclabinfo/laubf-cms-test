"use client"

import SectionContainer from "@/components/website/shared/section-container"
import CTAButton from "@/components/website/shared/cta-button"
import AnimateOnScroll from "@/components/website/shared/animate-on-scroll"
import { themeTokens, type SectionTheme, type ThemeTokens } from "@/components/website/shared/theme-tokens"
import { IconChevronDown } from "@/components/website/shared/icons"
import Image from "next/image"
import Link from "next/link"

interface CampusCardItem {
  id: string
  abbreviation?: string
  fullName: string
  href?: string
}

function CampusCard({ campus, tokens }: { campus: CampusCardItem; tokens: ThemeTokens }) {
  const classes = `flex flex-col items-center justify-center text-center transition-colors min-h-16 py-2.5 px-5 md:py-3 md:px-7 gap-0.5 md:gap-1 rounded-2xl border ${tokens.cardBorder} ${tokens.cardBg} hover:bg-white-2`
  const cardContent = (
    <>
      {campus.abbreviation && (
        <p className={`text-button-2 ${tokens.textMuted}`}>{campus.abbreviation}</p>
      )}
      <p className={`text-body-2 font-medium ${tokens.textPrimary} tracking-tight`}>{campus.fullName}</p>
    </>
  )

  if (campus.href) {
    return <Link href={campus.href} className={classes}>{cardContent}</Link>
  }
  return <div className={classes}>{cardContent}</div>
}

interface CampusCardGridContent {
  overline?: string
  heading: string
  description?: string
  decorativeImages?: { src: string; alt: string; objectPosition?: string }[]
  campuses: CampusCardItem[]
  ctaHeading?: string
  ctaButton?: { label: string; href: string }
}

interface Props {
  content: CampusCardGridContent
  enableAnimations: boolean
  colorScheme?: SectionTheme
  paddingY?: "none" | "compact" | "default" | "spacious"
  containerWidth?: "standard" | "narrow" | "full"
}

export default function CampusCardGridSection({ content, enableAnimations, colorScheme = "light", paddingY, containerWidth }: Props) {
  const t = themeTokens[colorScheme]
  const animate = enableAnimations !== false

  return (
    <SectionContainer colorScheme={colorScheme} paddingY={paddingY} containerWidth={containerWidth}>
      {/* Decorative overlapping photos */}
      {content.decorativeImages && content.decorativeImages.length > 0 && (
        <AnimateOnScroll animation="scale-up" enabled={animate} className="flex items-center justify-center mb-6 md:mb-12 overflow-hidden">
          <div className="relative w-[300px] h-[180px] md:w-[400px] md:h-[200px] overflow-hidden">
            {content.decorativeImages.map((img, i) => {
              const positions = [
                { top: "28%", left: "12%", zIndex: 1 },
                { top: "0%", left: "25%", zIndex: 3 },
                { top: "20%", left: "46%", zIndex: 2 },
              ]
              const rotations = [-13, -2, 15]
              const pos = positions[i % positions.length]

              return (
                <div
                  key={i}
                  className="absolute w-[130px] h-[100px] md:w-[160px] md:h-[120px] rounded-2xl overflow-hidden shadow-lg border-[3px] border-white-0"
                  style={{
                    top: pos.top,
                    left: pos.left,
                    zIndex: pos.zIndex,
                    transform: `rotate(${rotations[i % rotations.length]}deg)`,
                  }}
                >
                  <Image
                    src={img.src}
                    alt={img.alt}
                    fill
                    className="object-cover"
                    style={{ objectPosition: img.objectPosition }}
                  />
                </div>
              )
            })}
          </div>
        </AnimateOnScroll>
      )}

      {/* Section header */}
      <AnimateOnScroll animation="fade-up" enabled={animate} className="text-center mb-10">
        {content.overline && (
          <p className={`text-body-1 ${t.textSecondary} mb-2`}>
            {content.overline}
          </p>
        )}
        <h2 className={`text-h2 ${t.textPrimary} mb-4`}>
          {content.heading}
        </h2>
        {content.description && (
          <p className={`text-body-1 ${t.textSecondary} max-w-3xl mx-auto`}>
            {content.description}
          </p>
        )}
      </AnimateOnScroll>

      {/* Campus cards grid */}
      <div className="flex flex-wrap justify-center gap-2.5 md:gap-5 max-w-4xl mx-auto">
        {content.campuses.map((campus) => (
          <CampusCard key={campus.id} campus={campus} tokens={t} />
        ))}
      </div>

      {/* Bottom CTA area */}
      {content.ctaHeading && content.ctaButton && (
        <div className="mt-16 text-center">
          <h3 className={`text-h3 ${t.textPrimary} mb-4`}>{content.ctaHeading}</h3>
          <CTAButton
            label={content.ctaButton.label}
            href={content.ctaButton.href}
            variant="secondary"
            icon={<IconChevronDown className="ml-2 size-5" />}
          />
        </div>
      )}
    </SectionContainer>
  )
}
