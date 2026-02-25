"use client"

import SectionContainer from "@/components/website/shared/section-container"
import OverlineLabel from "@/components/website/shared/overline-label"
import CTAButton from "@/components/website/shared/cta-button"
import AnimateOnScroll from "@/components/website/shared/animate-on-scroll"
import { themeTokens, type SectionTheme } from "@/components/website/shared/theme-tokens"
import { IconExternalLink } from "@/components/website/shared/icons"
import Image from "next/image"

interface LocationDetailContent {
  overline: string
  timeLabel: string
  timeValue: string
  locationLabel: string
  address: string[]
  directionsUrl: string
  directionsLabel: string
  images: { src: string; alt: string; objectPosition?: string }[]
}

interface Props {
  content: LocationDetailContent
  enableAnimations: boolean
  colorScheme?: SectionTheme
}

export default function LocationDetailSection({ content, enableAnimations, colorScheme = "light" }: Props) {
  const t = themeTokens[colorScheme]
  const animate = enableAnimations !== false

  return (
    <SectionContainer colorScheme={colorScheme}>
      <div className="flex flex-col lg:flex-row gap-12 lg:gap-16 items-start">
        {/* Left column -- info */}
        <AnimateOnScroll animation="fade-left" enabled={animate} className="lg:w-[40%]">
          <OverlineLabel text={content.overline} />

          {/* Time block */}
          <div className="mt-8">
            <p className={`text-h4 ${t.textMuted} mb-2`}>
              {content.timeLabel}
            </p>
            <p className={`text-h2 font-medium ${t.textPrimary} leading-tight whitespace-pre-line`}>
              {content.timeValue}
            </p>
          </div>

          {/* Location block */}
          <div className="mt-8">
            <p className={`text-h4 ${t.textMuted} mb-2`}>
              {content.locationLabel}
            </p>
            <div>
              {content.address.map((line, i) => (
                <p key={i} className={`text-h3 font-medium ${t.textPrimary} leading-snug`}>
                  {line}
                </p>
              ))}
            </div>
          </div>

          {/* Directions CTA */}
          <div className="mt-8">
            <CTAButton
              label={content.directionsLabel}
              href={content.directionsUrl}
              variant="secondary"
              icon={<IconExternalLink className="ml-2 size-4" />}
            />
          </div>
        </AnimateOnScroll>

        {/* Right column -- single image */}
        <AnimateOnScroll animation="fade-right" staggerIndex={1} staggerBaseMs={150} enabled={animate} className="lg:w-[60%]">
          {content.images[0] && (
            <div className="rounded-2xl overflow-hidden relative aspect-[16/10]">
              <Image
                src={content.images[0].src}
                alt={content.images[0].alt}
                fill
                className="object-cover"
                style={{ objectPosition: content.images[0]?.objectPosition }}
              />
            </div>
          )}
        </AnimateOnScroll>
      </div>
    </SectionContainer>
  )
}
