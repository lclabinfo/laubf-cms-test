"use client"

import SectionContainer from "@/components/website/shared/section-container"
import CTAButton from "@/components/website/shared/cta-button"
import { themeTokens, type SectionTheme } from "@/components/website/shared/theme-tokens"
import { cn } from "@/lib/utils"
import Image from "next/image"

interface PillarImage {
  src: string
  alt: string
  objectPosition?: string
}

interface PillarItem {
  title: string
  description: string
  images: PillarImage[]
  button?: { label: string; href: string }
}

function PillarImageCollage({ images }: { images: PillarImage[] }) {
  if (images.length === 0) return null

  if (images.length === 1) {
    return (
      <div className="relative w-full aspect-[672/400] rounded-2xl overflow-hidden">
        <Image src={images[0].src} alt={images[0].alt} fill className="object-cover" style={{ objectPosition: images[0].objectPosition }} />
      </div>
    )
  }

  return (
    <div className="relative w-full aspect-[672/400] rounded-2xl overflow-hidden">
      <div className="absolute inset-0 grid grid-cols-5 grid-rows-2 gap-1.5">
        <div className="col-span-3 row-span-2 relative">
          <Image src={images[0].src} alt={images[0].alt} fill className="object-cover" style={{ objectPosition: images[0].objectPosition }} />
        </div>
        {images[1] && (
          <div className="col-span-2 relative">
            <Image src={images[1].src} alt={images[1].alt} fill className="object-cover" style={{ objectPosition: images[1].objectPosition }} />
          </div>
        )}
        {images[2] && (
          <div className="col-span-2 relative">
            <Image src={images[2].src} alt={images[2].alt} fill className="object-cover" style={{ objectPosition: images[2].objectPosition }} />
          </div>
        )}
      </div>
    </div>
  )
}

interface PillarsContent {
  overline: string
  heading: string
  items: PillarItem[]
}

interface Props {
  content: PillarsContent
  enableAnimations: boolean
  colorScheme?: SectionTheme
}

export default function PillarsSection({ content, enableAnimations, colorScheme = "light" }: Props) {
  const t = themeTokens[colorScheme]
  const animate = enableAnimations !== false

  return (
    <SectionContainer colorScheme={colorScheme}>
      {/* Section header */}
      <div className={cn("mb-12 lg:mb-16", animate && "animate-hero-fade-up")}>
        <p className="text-overline text-black-3 mb-3">{content.overline}</p>
        <h2 className={`text-h2 ${t.textPrimary} mt-3`}>{content.heading}</h2>
      </div>

      {/* Pillar items — alternating layout */}
      <div className="flex flex-col gap-12 lg:gap-12">
        {content.items.map((item, i) => {
          const isReversed = i % 2 !== 0

          return (
            <div
              key={i}
              className={cn(
                "flex flex-col lg:flex-row gap-8 lg:gap-12 items-center",
                isReversed && "lg:flex-row-reverse",
                animate && "animate-hero-fade-up-delayed"
              )}
            >
              {/* Image collage — 56% width on desktop */}
              <div className="w-full lg:w-[56%] shrink-0">
                <PillarImageCollage images={item.images} />
              </div>

              {/* Text content — 44% width on desktop */}
              <div
                className={`w-full lg:w-[44%] flex flex-col justify-center ${
                  isReversed ? "lg:items-end lg:text-right" : ""
                }`}
              >
                <div className="max-w-[480px]">
                  <h3 className={`text-h3 ${t.textPrimary} mb-3`}>{item.title}</h3>
                  <p className={`text-body-2 ${t.textPrimary} leading-relaxed`}>
                    {item.description}
                  </p>
                </div>
                {item.button && (
                  <div className="mt-6">
                    <CTAButton
                      label={item.button.label}
                      href={item.button.href}
                      variant="secondary"
                    />
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </SectionContainer>
  )
}
