"use client"

import { SectionThemeContext, themeTokens, type SectionTheme } from "@/components/website/shared/theme-tokens"
import AnimateOnScroll from "@/components/website/shared/animate-on-scroll"
import Image from "next/image"

const paddingYMap = {
  none: "py-0",
  compact: "py-16 lg:py-20",
  default: "py-24 lg:py-30",
  spacious: "py-32 lg:py-40",
} as const

interface PhotoGalleryContent {
  heading: string
  images: { src: string; alt: string; objectPosition?: string }[]
}

interface Props {
  content: PhotoGalleryContent
  enableAnimations: boolean
  colorScheme?: SectionTheme
  paddingY?: "none" | "compact" | "default" | "spacious"
}

export default function PhotoGallerySection({ content, enableAnimations, colorScheme = "light", paddingY = "default" }: Props) {
  const t = themeTokens[colorScheme]
  const animate = enableAnimations !== false

  // Double the images for seamless infinite loop
  const loopImages = [...content.images, ...content.images]
  const paddingClass = paddingYMap[paddingY]

  return (
    <SectionThemeContext.Provider value={colorScheme}>
      <section className={`${t.bg} ${paddingClass} overflow-hidden`}>
        {/* Centered heading inside container */}
        <div className="container-standard">
          <AnimateOnScroll animation="fade-up" enabled={animate}>
            <h2 className={`text-h2 ${t.textPrimary} text-center mb-12`}>
              {content.heading}
            </h2>
          </AnimateOnScroll>
        </div>

        {/* Full-width infinite scrolling carousel -- no container */}
        <div className="w-full overflow-hidden">
          <div
            className="flex gap-4 animate-carousel"
            style={{ width: "max-content" }}
          >
            {loopImages.map((img, i) => (
              <div
                key={i}
                className="relative w-[300px] lg:w-[360px] aspect-[4/3] rounded-2xl overflow-hidden shrink-0"
              >
                <Image
                  src={img.src}
                  alt={img.alt}
                  fill
                  className="object-cover"
                  style={{ objectPosition: img.objectPosition }}
                />
              </div>
            ))}
          </div>
        </div>

        <style dangerouslySetInnerHTML={{ __html: `
          @keyframes carousel-scroll {
            0% { transform: translateX(0); }
            100% { transform: translateX(-50%); }
          }
          .animate-carousel {
            animation: carousel-scroll 30s linear infinite;
          }
          .animate-carousel:hover {
            animation-play-state: paused;
          }
        `}} />
      </section>
    </SectionThemeContext.Provider>
  )
}
