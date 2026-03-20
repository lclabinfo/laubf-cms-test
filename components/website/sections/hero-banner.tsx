"use client"

import { useEffect, useRef, useState } from "react"
import { SectionThemeContext } from "@/components/website/shared/theme-tokens"
import CTAButton from "@/components/website/shared/cta-button"
import { cn } from "@/lib/utils"
import Image from "next/image"

const LG_BREAKPOINT = 1024

interface HeroBannerContent {
  heading: { line1: string; line2: string }
  subheading?: string
  primaryButton?: { label: string; href: string; visible: boolean }
  secondaryButton?: { label: string; href: string; visible: boolean }
  backgroundImage: { src: string; alt: string; objectPosition?: string }
  backgroundVideo?: { src: string; mobileSrc?: string }
  /** @deprecated Use backgroundVideo.mobileSrc instead */
  mobileVideo?: { src: string }
  /** Multiple images for carousel (2+ triggers crossfade) */
  images?: Array<{ src: string; alt: string }>
  layout?: "fullwidth" | "split"
  splitArrangement?: "text-left" | "image-left" | "text-top" | "image-top"
  textHAlign?: "left" | "center" | "right"
  textVAlign?: "top" | "middle" | "bottom"
  mediaType?: "image" | "video"
  textAlign?: "left" | "center" | "right"
}

interface Props {
  content: HeroBannerContent
  enableAnimations: boolean
}

export default function HeroBannerSection({ content, enableAnimations }: Props) {
  const animate = enableAnimations !== false

  // Extract new layout fields with defaults preserving current behavior
  const layout = (content.layout as string) || "fullwidth"
  const splitArrangement = (content.splitArrangement as string) || "text-left"
  const textHAlign = (content.textHAlign as string) || "center"
  const textVAlign = (content.textVAlign as string) || "middle"
  const mediaType = (content.mediaType as string) || (content.backgroundVideo?.src ? "video" : "image")
  const textAlign = (content.textAlign as string) || "left"

  if (layout === "split") {
    return <HeroBannerSplit content={content} animate={animate} splitArrangement={splitArrangement} textAlign={textAlign} mediaType={mediaType} />
  }

  return <HeroBannerFullwidth content={content} animate={animate} textHAlign={textHAlign} textVAlign={textVAlign} />
}

/* ------------------------------------------------------------------ */
/*  Fullwidth layout (default — enhanced with text position support)   */
/* ------------------------------------------------------------------ */

// flex-col section: justify-* = vertical position
const vAlignClass: Record<string, string> = {
  top: "justify-start pt-[120px]",
  middle: "justify-center",
  bottom: "justify-end pb-10 lg:pb-14",
}

// Horizontal positioning via self-align on the content div
// (items-* on flex-col parent doesn't work because children stretch to full width)
const hSelfAlign: Record<string, string> = {
  left: "self-start",
  center: "self-center",
  right: "self-end",
}

// Text alignment auto-follows horizontal position
const hAlignText: Record<string, string> = {
  left: "text-left",
  center: "text-center",
  right: "text-right",
}

function HeroBannerFullwidth({
  content,
  animate,
  textHAlign,
  textVAlign,
}: {
  content: HeroBannerContent
  animate: boolean
  textHAlign: string
  textVAlign: string
}) {
  // Legacy layout: only when position fields have NEVER been set (old heroes).
  // Once the user sets any position (even center/middle), use the dynamic system.
  const isDefaultPosition = !("textHAlign" in content) && !("textVAlign" in content) && !("layout" in content)

  // For the original default, preserve exact existing classes
  // For custom positions, use flex-col on the section so:
  //   justify-* = vertical position
  //   self-* on content div = horizontal position
  //   text alignment auto-follows horizontal position
  const sectionAlignClass = isDefaultPosition
    ? "items-end"
    : vAlignClass[textVAlign] ?? "justify-center"
  const contentContainerClass = isDefaultPosition
    ? "relative z-1 w-full pb-10 lg:pb-14"
    : cn("relative z-1 px-6 lg:px-12", hSelfAlign[textHAlign] ?? "self-center")
  const innerContainerClass = isDefaultPosition
    ? "container-standard lg:px-0 lg:ml-20 lg:max-w-none"
    : ""
  const textWrapperClass = isDefaultPosition
    ? "flex flex-col gap-8 max-w-[500px]"
    : cn("flex flex-col gap-8 max-w-[600px]", hAlignText[textHAlign] ?? "text-center")

  return (
    <SectionThemeContext.Provider value="dark">
      <section id="hero-section" className={cn(
        "relative flex min-h-screen overflow-hidden bg-black-1 -mt-[76px]",
        isDefaultPosition ? "" : "flex-col",
        sectionAlignClass,
      )}>
        {/* Background media */}
        <HeroBackgroundMedia content={content} animate={animate} />

        {/* Bottom gradient overlay */}
        {/* Desktop & tablet */}
        <div
          className="hidden sm:block absolute inset-0 pointer-events-none"
          style={{
            backgroundImage:
              "linear-gradient(195deg, rgba(13,13,13,0) 50%, rgba(13,13,13,0.5) 65%, rgb(13,13,13) 100%)",
          }}
        />
        {/* Mobile */}
        <div
          className="block sm:hidden absolute inset-0 pointer-events-none"
          style={{
            backgroundImage:
              "linear-gradient(to bottom, rgba(13,13,13, 0) 40%, rgba(13,13,13, 0.8) 60%, rgb(13,13,13) 100%)",
          }}
        />

        {/* Hero content */}
        <div className={contentContainerClass}>
          <div className={innerContainerClass}>
            <div className={textWrapperClass}>
              <HeroTextContent content={content} animate={animate} />
              <HeroButtons content={content} animate={animate} />
            </div>
          </div>
        </div>
      </section>
    </SectionThemeContext.Provider>
  )
}

/* ------------------------------------------------------------------ */
/*  Split layout (new — two-panel arrangement)                         */
/* ------------------------------------------------------------------ */

const splitFlexDirection: Record<string, string> = {
  "text-left": "md:flex-row",
  "image-left": "md:flex-row-reverse",
  "text-top": "flex-col",
  "image-top": "flex-col-reverse",
}

const splitTextAlignClass: Record<string, string> = {
  left: "text-left items-start",
  center: "text-center items-center",
  right: "text-right items-end",
}

function HeroBannerSplit({
  content,
  animate,
  splitArrangement,
  textAlign,
  mediaType,
}: {
  content: HeroBannerContent
  animate: boolean
  splitArrangement: string
  textAlign: string
  mediaType: string
}) {
  const isVertical = splitArrangement === "text-top" || splitArrangement === "image-top"
  const flexDir = splitFlexDirection[splitArrangement] ?? "md:flex-row"

  // On mobile, horizontal arrangements stack vertically (text on top)
  const mobileDir = isVertical ? "" : "flex-col"

  return (
    <SectionThemeContext.Provider value="dark">
      <section
        id="hero-section"
        className={cn(
          "relative flex min-h-[calc(100dvh-76px)] overflow-hidden bg-black-1",
          mobileDir,
          flexDir,
        )}
      >
        {/* Text panel */}
        <div
          className={cn(
            "flex flex-col justify-center gap-8 px-8 py-16 lg:px-16 lg:py-20",
            isVertical ? "w-full" : "w-full md:w-1/2",
            isVertical ? "min-h-[40dvh]" : "min-h-[50dvh] md:min-h-0",
            splitTextAlignClass[textAlign] ?? "text-left items-start",
          )}
        >
          <div className="flex flex-col gap-8 max-w-[500px]">
            <HeroTextContent content={content} animate={animate} />
            <HeroButtons content={content} animate={animate} />
          </div>
        </div>

        {/* Media panel */}
        <div
          className={cn(
            "relative overflow-hidden",
            isVertical ? "w-full min-h-[40dvh]" : "w-full md:w-1/2 min-h-[50dvh] md:min-h-0",
          )}
        >
          {mediaType === "video" && (content.backgroundVideo?.src || content.backgroundImage?.src) ? (
            <HeroVideo
              desktopSrc={content.backgroundVideo?.src ?? content.backgroundImage.src}
              mobileSrc={content.backgroundVideo?.mobileSrc ?? content.mobileVideo?.src ?? content.backgroundVideo?.src ?? content.backgroundImage.src}
              animate={animate}
            />
          ) : content.backgroundImage?.src ? (
            <Image
              src={content.backgroundImage.src}
              alt={content.backgroundImage.alt}
              fill
              priority
              className={cn("object-cover", animate && "animate-hero-fade-in-slow")}
              style={{ objectPosition: content.backgroundImage.objectPosition }}
            />
          ) : (
            <div className={cn("absolute inset-0 bg-gradient-to-br from-black-2 to-black-1", animate && "animate-hero-fade-in-slow")} />
          )}
        </div>
      </section>
    </SectionThemeContext.Provider>
  )
}

/* ------------------------------------------------------------------ */
/*  Shared sub-components                                              */
/* ------------------------------------------------------------------ */

function HeroCarousel({ images, animate }: { images: Array<{ src: string; alt: string }>; animate: boolean }) {
  const [activeIndex, setActiveIndex] = useState(0)

  useEffect(() => {
    if (images.length <= 1) return
    const timer = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % images.length)
    }, 5000)
    return () => clearInterval(timer)
  }, [images.length])

  return (
    <div className={cn("absolute inset-0", animate && "animate-hero-fade-in-slow")}>
      {images.map((img, i) => (
        <Image
          key={img.src}
          src={img.src}
          alt={img.alt}
          fill
          priority={i === 0}
          className={cn(
            "object-cover transition-opacity duration-1000",
            i === activeIndex ? "opacity-100" : "opacity-0"
          )}
        />
      ))}
    </div>
  )
}

function HeroBackgroundMedia({ content, animate }: { content: HeroBannerContent; animate: boolean }) {
  if (content.backgroundVideo?.src) {
    return (
      <HeroVideo
        desktopSrc={content.backgroundVideo.src}
        mobileSrc={content.backgroundVideo.mobileSrc ?? content.mobileVideo?.src ?? content.backgroundVideo.src}
        animate={animate}
      />
    )
  }

  // Multi-image carousel: if images array has 2+ items, render crossfade carousel
  const images = content.images
  if (images && images.length >= 2) {
    return <HeroCarousel images={images} animate={animate} />
  }

  // Single image: use images[0] if available, otherwise fall back to backgroundImage
  const singleImage = images?.[0] ?? content.backgroundImage

  if (singleImage?.src) {
    if (singleImage.src.endsWith(".mp4") || singleImage.src.endsWith(".webm")) {
      return (
        <HeroVideo
          desktopSrc={singleImage.src}
          mobileSrc={content.mobileVideo?.src ?? singleImage.src}
          animate={animate}
        />
      )
    }

    return (
      <Image
        src={singleImage.src}
        alt={singleImage.alt}
        fill
        priority
        className={cn("object-cover", animate && "animate-hero-fade-in-slow")}
        style={{ objectPosition: (singleImage as HeroBannerContent["backgroundImage"]).objectPosition }}
      />
    )
  }

  return (
    <div className={cn("absolute inset-0 bg-gradient-to-br from-black-2 to-black-1", animate && "animate-hero-fade-in-slow")} />
  )
}

function HeroTextContent({ content, animate }: { content: HeroBannerContent; animate: boolean }) {
  return (
    <div className={cn("flex flex-col gap-4", animate && "animate-hero-fade-up")}>
      <div className="flex flex-col leading-[0.8] text-white-1 drop-shadow-lg">
        <span className="text-h1">{content.heading.line1}</span>
        <span className="text-hero-accent">
          {content.heading.line2}
        </span>
      </div>

      {/* Subheading */}
      {content.subheading && (
        <div className={cn("text-[20px] lg:text-[24px] leading-[1.2] tracking-[-0.04em]", animate && "animate-hero-fade-up-delayed")}>
          {content.subheading.split("\n").map((line, i) => {
            const parts = line.split(
              /(\b(?:people find their community|disciples are raised|the Word of God is lived)\b)/,
            )
            return (
              <p key={i} className="mb-0">
                {parts.map((part, j) =>
                  /people find|disciples are|the Word of/.test(
                    part,
                  ) ? (
                    <span key={j} className="text-white-2">
                      {part}
                    </span>
                  ) : (
                    <span key={j} className="text-white-3">
                      {part}
                    </span>
                  ),
                )}
              </p>
            )
          })}
        </div>
      )}
    </div>
  )
}

function HeroButtons({ content, animate }: { content: HeroBannerContent; animate: boolean }) {
  const hasPrimary = content.primaryButton?.visible
  const hasSecondary = content.secondaryButton?.visible
  if (!hasPrimary && !hasSecondary) return null

  return (
    <div className={cn("flex flex-col sm:flex-row gap-3", animate && "animate-hero-fade-up-delayed-2")}>
      {hasPrimary && (
        <CTAButton
          label={content.primaryButton!.label}
          href={content.primaryButton!.href}
          variant="primary"
        />
      )}
      {hasSecondary && (
        <CTAButton
          label={content.secondaryButton!.label}
          href={content.secondaryButton!.href}
          variant="secondary"
        />
      )}
    </div>
  )
}

function HeroVideo({ desktopSrc, mobileSrc, animate }: { desktopSrc: string; mobileSrc: string; animate: boolean }) {
  const videoRef = useRef<HTMLVideoElement>(null)

  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    const applySrc = () => {
      const isDesktop = window.innerWidth >= LG_BREAKPOINT
      const next = isDesktop ? desktopSrc : mobileSrc
      if (video.src.endsWith(next)) return
      video.src = next
      video.load()
      video.play().catch(() => {})
    }

    applySrc()

    const mql = window.matchMedia(`(min-width: ${LG_BREAKPOINT}px)`)
    mql.addEventListener("change", applySrc)

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && video.paused) {
          video.play().catch(() => {})
        }
      },
      { threshold: 0.1 },
    )
    observer.observe(video)

    const handleEnded = () => {
      video.currentTime = 0
      video.play().catch(() => {})
    }
    video.addEventListener("ended", handleEnded)

    const handleTimeUpdate = () => {
      if (video.duration && video.currentTime >= video.duration - 0.3) {
        video.currentTime = 0
        video.play().catch(() => {})
      }
    }
    video.addEventListener("timeupdate", handleTimeUpdate)

    return () => {
      mql.removeEventListener("change", applySrc)
      observer.disconnect()
      video.removeEventListener("ended", handleEnded)
      video.removeEventListener("timeupdate", handleTimeUpdate)
    }
  }, [desktopSrc, mobileSrc])

  return (
    <video
      ref={videoRef}
      autoPlay
      muted
      playsInline
      preload="auto"
      className={cn("absolute inset-0 h-full w-full object-cover", animate && "animate-hero-fade-in-slow")}
    />
  )
}
