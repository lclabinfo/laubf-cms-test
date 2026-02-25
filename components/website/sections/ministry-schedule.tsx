"use client"

import SectionContainer from "@/components/website/shared/section-container"
import CTAButton from "@/components/website/shared/cta-button"
import AnimateOnScroll from "@/components/website/shared/animate-on-scroll"
import { themeTokens, type SectionTheme } from "@/components/website/shared/theme-tokens"
import { IconMapPin, IconExternalLink } from "@/components/website/shared/icons"
import Image from "next/image"

interface ScheduleEntry {
  day: string
  time: string
  location: string
}

interface MinistryScheduleContent {
  heading: string
  headingStyle?: "sans" | "script"
  description?: string
  scheduleLabel?: string
  scheduleEntries?: ScheduleEntry[]
  timeValue?: string
  address?: string[]
  directionsUrl?: string
  buttons?: { label: string; href: string; variant: "primary" | "secondary" }[]
  image?: { src: string; alt: string; objectPosition?: string }
  logo?: { src: string; alt: string }
}

interface Props {
  content: MinistryScheduleContent
  enableAnimations: boolean
  colorScheme?: SectionTheme
  paddingY?: "none" | "compact" | "default" | "spacious"
  containerWidth?: "standard" | "narrow" | "full"
}

export default function MinistryScheduleSection({ content, enableAnimations, colorScheme = "light", paddingY, containerWidth }: Props) {
  const t = themeTokens[colorScheme]
  const animate = enableAnimations !== false
  const hasImage = !!content.image

  return (
    <SectionContainer colorScheme={colorScheme} paddingY={paddingY} containerWidth={containerWidth}>
      <div className="flex flex-col lg:flex-row gap-10 lg:gap-16 items-start">
        {/* Left column */}
        <AnimateOnScroll animation="fade-left" enabled={animate} className={hasImage ? "w-full lg:w-[50%]" : "w-full lg:w-[40%]"}>
          {content.logo && (
            <div className="mb-6">
              <Image
                src={content.logo.src}
                alt={content.logo.alt}
                width={62}
                height={52}
                unoptimized
                className="object-contain brightness-0 invert"
              />
            </div>
          )}
          <h2 className={`text-h2 ${t.textPrimary} mb-4`}>
            {content.heading}
          </h2>

          {content.description && (
            <p className={`text-body-1 ${t.textSecondary} mb-6`}>
              {content.description}
            </p>
          )}

          {/* Simple time + address layout (children variant) */}
          {content.timeValue && (
            <div className="mb-4">
              <p className={`text-h4 ${t.textMuted} mb-1`}>Time</p>
              <p className={`text-h3 font-medium ${t.textPrimary} leading-snug whitespace-pre-line`}>
                {content.timeValue}
              </p>
            </div>
          )}

          {content.address && content.address.length > 0 && (
            <div className="mb-6">
              <p className={`text-h4 ${t.textMuted} mb-1`}>Location</p>
              {content.address.map((line, i) => (
                <p key={i} className={`text-h3 font-medium ${t.textPrimary} leading-snug`}>
                  {line}
                </p>
              ))}
            </div>
          )}

          {content.directionsUrl && (
            <div className="mb-6">
              <CTAButton
                label="Get Directions"
                href={content.directionsUrl}
                variant="secondary"
                size="small"
                icon={<IconExternalLink className="ml-2 size-4" />}
              />
            </div>
          )}
        </AnimateOnScroll>

        {/* Right column */}
        <AnimateOnScroll animation="fade-right" staggerIndex={1} staggerBaseMs={150} enabled={animate} className={hasImage ? "w-full lg:w-[50%]" : "w-full lg:w-[60%]"}>
          {hasImage ? (
            <div className="relative w-full aspect-[4/3] rounded-2xl overflow-hidden">
              <Image
                src={content.image!.src}
                alt={content.image!.alt}
                fill
                className="object-cover"
                style={{ objectPosition: content.image?.objectPosition }}
              />
            </div>
          ) : (
            /* Schedule entries layout (college variant) */
            content.scheduleEntries && content.scheduleEntries.length > 0 && (
              <div>
                {content.scheduleLabel && (
                  <p className={`text-overline ${t.textMuted} mb-6`}>
                    {content.scheduleLabel}
                  </p>
                )}
                <div className="flex flex-col gap-6">
                  {content.scheduleEntries.map((entry, i) => (
                    <div key={i}>
                      <p className={`text-h3 font-medium ${t.textPrimary}`}>
                        <span className="font-medium">{entry.day}</span> @ {entry.time}
                      </p>
                      <div className="flex items-center gap-1.5 mt-1.5">
                        <IconMapPin className={`size-4 ${t.textMuted} shrink-0`} />
                        <p className={`text-body-2 ${t.textMuted}`}>{entry.location}</p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Buttons below schedule */}
                {content.buttons && content.buttons.length > 0 && (
                  <div className="flex flex-wrap gap-3 mt-8">
                    {content.buttons.map((btn, i) => (
                      <CTAButton
                        key={i}
                        label={btn.label}
                        href={btn.href}
                        variant={btn.variant}
                      />
                    ))}
                  </div>
                )}
              </div>
            )
          )}
        </AnimateOnScroll>
      </div>
    </SectionContainer>
  )
}
