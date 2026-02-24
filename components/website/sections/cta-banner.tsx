"use client"

import { SectionThemeContext } from "@/components/website/shared/theme-tokens"
import CTAButton from "@/components/website/shared/cta-button"
import AnimateOnScroll from "@/components/website/shared/animate-on-scroll"
import Image from "next/image"

interface CTABannerContent {
  overline: string
  heading: string
  body: string
  primaryButton: { label: string; href: string; visible: boolean }
  secondaryButton: { label: string; href: string; visible: boolean }
  backgroundImage?: { src: string; alt: string; objectPosition?: string }
}

interface Props {
  content: CTABannerContent
  enableAnimations: boolean
}

export default function CTABannerSection({ content, enableAnimations }: Props) {
  const animate = enableAnimations !== false

  return (
    <SectionThemeContext.Provider value="dark">
      <section className="relative flex flex-col items-center gap-10 bg-black-1 px-4 pb-30 pt-20 text-center lg:px-30">
        {/* Background image at 10% opacity */}
        {content.backgroundImage && (
          <Image
            src={content.backgroundImage.src}
            alt={content.backgroundImage.alt ?? ""}
            fill
            className="object-cover opacity-10 pointer-events-none"
            style={{ objectPosition: content.backgroundImage?.objectPosition }}
          />
        )}

        {/* Content */}
        <AnimateOnScroll animation="fade-up" enabled={animate} className="relative flex flex-col items-center gap-5 text-center">
          <div className="flex flex-col items-center gap-3">
            <p className="text-h4 text-white-1">{content.overline}</p>
            <h2 className="text-h2 text-white-1">{content.heading}</h2>
          </div>
          <p className="text-body-1 text-white-2 max-w-[640px]">
            {content.body}
          </p>
        </AnimateOnScroll>

        {/* Buttons */}
        <AnimateOnScroll animation="fade-up" staggerIndex={1} staggerBaseMs={150} enabled={animate} className="relative flex flex-col sm:flex-row gap-3">
          {content.primaryButton.visible && (
            <CTAButton
              label={content.primaryButton.label}
              href={content.primaryButton.href}
              variant="primary"
            />
          )}
          {content.secondaryButton.visible && (
            <CTAButton
              label={content.secondaryButton.label}
              href={content.secondaryButton.href}
              variant="secondary"
            />
          )}
        </AnimateOnScroll>
      </section>
    </SectionThemeContext.Provider>
  )
}
