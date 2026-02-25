"use client"

import SectionContainer from "@/components/website/shared/section-container"
import OverlineLabel from "@/components/website/shared/overline-label"
import AnimateOnScroll from "@/components/website/shared/animate-on-scroll"
import { themeTokens, type SectionTheme } from "@/components/website/shared/theme-tokens"
import Image from "next/image"

interface TimelineItem {
  time: string
  title: string
  description: string
}

interface TimelineContent {
  overline: string
  heading: string
  description?: string
  imageSrc?: string
  imageAlt?: string
  videoUrl?: string
  items: TimelineItem[]
}

interface Props {
  content: TimelineContent
  enableAnimations: boolean
  colorScheme?: SectionTheme
  paddingY?: "none" | "compact" | "default" | "spacious"
  containerWidth?: "standard" | "narrow" | "full"
}

export default function TimelineSection({ content, enableAnimations, colorScheme = "light", paddingY, containerWidth }: Props) {
  const t = themeTokens[colorScheme]
  const animate = enableAnimations !== false

  return (
    <SectionContainer colorScheme={colorScheme} paddingY={paddingY} containerWidth={containerWidth}>
      {/* Header area */}
      <AnimateOnScroll animation="fade-up" enabled={animate} className="mb-12">
        <OverlineLabel text={content.overline} className="text-brand-1" />
        <h2 className={`text-h2 ${t.textPrimary} mt-3`}>
          {content.heading}
        </h2>
        {content.description && (
          <p className={`text-body-1 ${t.textSecondary} mt-3 max-w-2xl`}>
            {content.description}
          </p>
        )}
      </AnimateOnScroll>

      {/* Two-column layout: image left, timeline right */}
      <div className="flex flex-col lg:flex-row gap-12 lg:gap-16">
        {/* Left column -- image */}
        <AnimateOnScroll animation="fade-left" enabled={animate} className="lg:w-[40%] shrink-0">
          {content.imageSrc ? (
            <div className="relative aspect-[3/4] w-full max-h-[500px] rounded-2xl overflow-hidden">
              <Image
                src={content.imageSrc}
                alt={content.imageAlt || ""}
                fill
                className="object-cover"
              />
            </div>
          ) : content.videoUrl ? (
            <div className="aspect-[9/16] max-h-[500px] w-full rounded-2xl overflow-hidden">
              <iframe
                src={content.videoUrl}
                title="Sunday service video"
                className="w-full h-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
          ) : null}
        </AnimateOnScroll>

        {/* Right column -- timeline items */}
        <div className="lg:w-[60%] flex items-center">
          <div className="w-full">
            {content.items.map((item, i) => {
              const isLast = i === content.items.length - 1
              return (
                <div
                  key={i}
                  className={`relative pl-10 ${isLast ? "pb-0" : "pb-10"}`}
                >
                  {/* Filled dot marker */}
                  <div className="absolute left-0 top-1 w-3 h-3 rounded-full bg-brand-1" />

                  {/* Vertical connecting line */}
                  {!isLast && (
                    <div className={`absolute left-[5px] top-4 bottom-0 w-px ${t.textPrimary} opacity-15`} />
                  )}

                  {/* Item content */}
                  <p className={`text-body-2 ${t.textMuted} mb-1`}>
                    {item.time}
                  </p>
                  <h3 className={`text-h3 ${t.textPrimary} mb-2`}>{item.title}</h3>
                  <p className={`text-body-2 ${t.textSecondary} max-w-lg`}>{item.description}</p>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </SectionContainer>
  )
}
