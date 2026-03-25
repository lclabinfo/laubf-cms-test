"use client"

import { useEffect, useRef, useState } from "react"
import { SectionThemeContext } from "@/components/website/shared/theme-context"
import { themeTokens, isDarkScheme, type SectionTheme } from "@/components/website/shared/theme-tokens"
import CTAButton from "@/components/website/shared/cta-button"
import { cn } from "@/lib/utils"
import Image from "next/image"

const MOBILE_BREAKPOINT = 640
const isVideoUrl = (s: string) => /\.(mp4|webm|mov|ogg)(\?|$)/i.test(s)

interface HeroBannerContent {
  heading: { line1: string; line2: string }
  subheading?: string
  primaryButton?: { label: string; href: string; visible: boolean }
  secondaryButton?: { label: string; href: string; visible: boolean }
  backgroundImage: { src: string; alt: string; objectPosition?: string }
  backgroundVideo?: { src: string; mobileSrc?: string }
  /** Multiple images for carousel (2+ triggers crossfade) */
  images?: Array<{ src: string; alt: string }>
  layout?: "fullwidth" | "split" | "contained"
  splitArrangement?: "text-left" | "image-left" | "text-top" | "image-top"
  textHAlign?: "left" | "center" | "right"
  textVAlign?: "top" | "middle" | "bottom"
  mediaType?: "image" | "video"
  /** @deprecated use backgroundImage for contained layout */
  containedImage?: { src: string; alt: string }
  textAlign?: "left" | "center" | "right"
  overlayType?: "gradient" | "solid" | "none"
  overlayOpacity?: number
  /** Seconds between carousel crossfades (default 5) */
  carouselSpeed?: number
}

// Map DB ColorScheme to SectionTheme context + background class
const colorSchemeMap: Record<string, { theme: SectionTheme; bg: string }> = {
  DARK:  { theme: "dark",  bg: "bg-black-1" },
  dark:  { theme: "dark",  bg: "bg-black-1" },
  LIGHT: { theme: "light", bg: "bg-white-1" },
  light: { theme: "light", bg: "bg-white-1" },
  BRAND: { theme: "brand", bg: "bg-[var(--ws-color-primary,#1a1a2e)]" },
  brand: { theme: "brand", bg: "bg-[var(--ws-color-primary,#1a1a2e)]" },
  MUTED: { theme: "muted", bg: "bg-neutral-100" },
  muted: { theme: "muted", bg: "bg-neutral-100" },
}

interface Props {
  content: HeroBannerContent
  enableAnimations: boolean
  colorScheme?: string
}

export default function HeroBannerSection({ content, enableAnimations, colorScheme }: Props) {
  const animate = enableAnimations !== false
  const resolved = colorSchemeMap[colorScheme ?? "DARK"] ?? colorSchemeMap.DARK

  // Extract new layout fields with defaults preserving current behavior
  const layout = (content.layout as string) || "fullwidth"
  const splitArrangement = (content.splitArrangement as string) || "text-left"
  const textHAlign = (content.textHAlign as string) || "center"
  const textVAlign = (content.textVAlign as string) || "middle"
  const mediaType = (content.mediaType as string) || (content.backgroundVideo?.src ? "video" : isVideoUrl(content.backgroundImage?.src ?? "") ? "video" : "image")
  const textAlign = (content.textAlign as string) || "left"
  const overlayType = (content.overlayType as string) || "gradient"
  const overlayOpacity = (content.overlayOpacity as number) ?? 0.6

  if (layout === "contained") {
    return <HeroBannerContained content={content} animate={animate} splitArrangement={splitArrangement} textAlign={textAlign} mediaType={mediaType} theme={resolved.theme} bgClass={resolved.bg} />
  }

  if (layout === "split") {
    return <HeroBannerSplit content={content} animate={animate} splitArrangement={splitArrangement} textAlign={textAlign} mediaType={mediaType} theme={resolved.theme} bgClass={resolved.bg} />
  }

  return <HeroBannerFullwidth content={content} animate={animate} textHAlign={textHAlign} textVAlign={textVAlign} mediaType={mediaType} overlayType={overlayType} overlayOpacity={overlayOpacity} theme={resolved.theme} bgClass={resolved.bg} />
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

// Inner container classes per horizontal position
// left: matches legacy layout (container-standard with left margin offset)
// center/right: centered or right-aligned with standard container padding
const hInnerContainer: Record<string, string> = {
  left: "container-standard lg:px-0 lg:ml-20 lg:max-w-none",
  center: "container-standard flex justify-center",
  right: "container-standard lg:px-0 lg:mr-20 lg:ml-auto lg:max-w-none flex justify-end",
}

// Text + button alignment auto-follows horizontal position
const hAlignText: Record<string, string> = {
  left: "text-left items-start",
  center: "text-center items-center",
  right: "text-right items-end",
}

function HeroBannerFullwidth({
  content,
  animate,
  textHAlign,
  textVAlign,
  mediaType,
  overlayType,
  overlayOpacity,
  theme,
  bgClass,
}: {
  content: HeroBannerContent
  animate: boolean
  textHAlign: string
  textVAlign: string
  mediaType: string
  overlayType: string
  overlayOpacity: number
  theme: SectionTheme
  bgClass: string
}) {
  // Legacy layout: only when position fields have NEVER been set (old heroes).
  // Once the user sets any position (even center/middle), use the dynamic system.
  const isDefaultPosition = !("textHAlign" in content) && !("textVAlign" in content) && !("layout" in content)

  const sectionAlignClass = isDefaultPosition
    ? "items-end"
    : vAlignClass[textVAlign] ?? "justify-center"
  const contentContainerClass = isDefaultPosition
    ? "relative z-1 w-full pb-10 lg:pb-14"
    : "relative z-1 w-full"
  const innerContainerClass = isDefaultPosition
    ? "container-standard lg:px-0 lg:ml-20 lg:max-w-none"
    : hInnerContainer[textHAlign] ?? hInnerContainer.center
  const textWrapperClass = isDefaultPosition
    ? "flex flex-col gap-8 max-w-[500px]"
    : cn("flex flex-col gap-8 max-w-[500px]", hAlignText[textHAlign] ?? "text-center")

  return (
    <SectionThemeContext.Provider value={theme}>
      <section id="hero-section" className={cn(
        "relative flex min-h-dvh overflow-hidden -mt-[76px]",
        bgClass,
        isDefaultPosition ? "" : "flex-col",
        sectionAlignClass,
      )}>
        {/* Background media */}
        <HeroBackgroundMedia content={content} animate={animate} mediaType={mediaType} theme={theme} />

        {/* Overlay */}
        <HeroOverlay
          overlayType={overlayType}
          overlayOpacity={overlayOpacity}
          textHAlign={isDefaultPosition ? "left" : textHAlign}
          textVAlign={isDefaultPosition ? "bottom" : textVAlign}
          theme={theme}
        />

        {/* Hero content */}
        <div className={contentContainerClass}>
          <div className={innerContainerClass}>
            <div className={textWrapperClass}>
              <HeroTextContent content={content} animate={animate} theme={theme} />
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
  theme,
  bgClass,
}: {
  content: HeroBannerContent
  animate: boolean
  splitArrangement: string
  textAlign: string
  mediaType: string
  theme: SectionTheme
  bgClass: string
}) {
  const isVertical = splitArrangement === "text-top" || splitArrangement === "image-top"
  const flexDir = splitFlexDirection[splitArrangement] ?? "md:flex-row"

  // On mobile, horizontal arrangements stack vertically (text on top)
  const mobileDir = isVertical ? "" : "flex-col"

  return (
    <SectionThemeContext.Provider value={theme}>
      <section
        id="hero-section"
        className={cn(
          "relative flex min-h-[calc(100dvh-76px)] overflow-hidden",
          bgClass,
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
            <HeroTextContent content={content} animate={animate} theme={theme} />
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
              mobileSrc={content.backgroundVideo?.mobileSrc || content.backgroundVideo?.src || content.backgroundImage.src}
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
            <div className={cn("absolute inset-0 bg-gradient-to-br", isDarkScheme(theme) ? "from-black-2 to-black-1" : "from-neutral-200 to-white", animate && "animate-hero-fade-in-slow")} />
          )}
        </div>
      </section>
    </SectionThemeContext.Provider>
  )
}

/* ------------------------------------------------------------------ */
/*  Contained layout (floating image next to text, color scheme bg)    */
/* ------------------------------------------------------------------ */

function HeroBannerContained({
  content,
  animate,
  splitArrangement,
  textAlign,
  mediaType,
  theme,
  bgClass,
}: {
  content: HeroBannerContent
  animate: boolean
  splitArrangement: string
  textAlign: string
  mediaType: string
  theme: SectionTheme
  bgClass: string
}) {
  const isVertical = splitArrangement === "text-top" || splitArrangement === "image-top"
  const flexDir = splitFlexDirection[splitArrangement] ?? "md:flex-row"
  const mobileDir = isVertical ? "" : "flex-col"

  const imageSrc = content.images?.[0]?.src ?? content.backgroundImage?.src
  const imageAlt = content.images?.[0]?.alt ?? content.backgroundImage?.alt ?? ""

  return (
    <SectionThemeContext.Provider value={theme}>
      <section
        id="hero-section"
        className={cn(
          "relative flex min-h-[calc(100dvh-76px)] overflow-visible",
          bgClass,
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
            <HeroTextContent content={content} animate={animate} theme={theme} />
            <HeroButtons content={content} animate={animate} />
          </div>
        </div>

        {/* Media panel — contained / floating */}
        <div
          className={cn(
            "relative flex items-center justify-center",
            isVertical ? "w-full min-h-[50dvh]" : "w-full md:w-1/2 min-h-[50dvh] md:min-h-0",
          )}
        >
          {mediaType === "video" && (content.backgroundVideo?.src || content.backgroundImage?.src) ? (
            <div className={cn(
              "relative w-full h-full min-h-[400px] rounded-xl overflow-hidden",
              animate && "animate-hero-fade-in-slow",
            )}>
              <HeroVideo
                desktopSrc={content.backgroundVideo?.src ?? content.backgroundImage.src}
                mobileSrc={content.backgroundVideo?.mobileSrc || content.backgroundVideo?.src || content.backgroundImage.src}
                animate={false}
              />
            </div>
          ) : imageSrc ? (
            <div className="relative w-full h-full min-h-[400px]">
              <Image
                src={imageSrc}
                alt={imageAlt}
                fill
                priority
                className={cn("object-contain p-6 lg:p-10 drop-shadow-xl", animate && "animate-hero-fade-in-slow")}
              />
            </div>
          ) : (
            <div className={cn(
              "w-full h-full min-h-[300px] m-6 rounded-2xl border-2 border-dashed border-white/10",
              animate && "animate-hero-fade-in-slow",
            )} />
          )}
        </div>
      </section>
    </SectionThemeContext.Provider>
  )
}

/* ------------------------------------------------------------------ */
/*  Shared sub-components                                              */
/* ------------------------------------------------------------------ */

/**
 * Gradient/solid overlay for fullwidth hero.
 *
 * The dark side of the gradient is ALWAYS where the text is, so text remains
 * readable against the background image/video. The clear side is opposite.
 *
 * Opacity scaling:
 *   50% slider ≈ original seeded look (clear→0.5→1.0)
 *   100% = fully opaque black everywhere
 *   0% = no overlay
 */
function HeroOverlay({
  overlayType,
  overlayOpacity,
  textHAlign,
  textVAlign,
  theme,
}: {
  overlayType: string
  overlayOpacity: number
  textHAlign: string
  textVAlign: string
  theme: SectionTheme
}) {
  if (overlayType === "none") return null

  // Brand uses the church's primary color for a tinted overlay
  // Dark uses black, Light uses white
  const overlayRgb = theme === "brand"
    ? "var(--ws-color-primary-rgb, 13,13,13)"
    : isDarkScheme(theme) ? "13,13,13" : "255,255,255"

  if (overlayType === "solid") {
    return (
      <div
        className="absolute inset-0 pointer-events-none"
        style={{ backgroundColor: `rgba(${overlayRgb},${overlayOpacity})` }}
      />
    )
  }

  // --- Gradient overlay ---
  // Match the original laubf-test gradient pattern:
  //   Desktop diagonal: clear 50% → mid 65% → opaque 100%
  //   Mobile vertical:  clear 40% → mid 60% → opaque 100%
  // The slider scales the opacity at each stop but keeps the same spatial coverage.
  const midOpacity = overlayOpacity
  const endOpacity = Math.min(1, overlayOpacity * 2)
  const c = (a: number) => `rgba(${overlayRgb},${a})`

  // Center/middle: radial gradient — dark in the center where text sits
  if (textHAlign === "center" && textVAlign === "middle") {
    return (
      <>
        <div
          className="hidden sm:block absolute inset-0 pointer-events-none"
          style={{
            backgroundImage: `radial-gradient(ellipse at center, ${c(endOpacity)} 0%, ${c(midOpacity * 0.6)} 35%, ${c(0)} 65%)`,
          }}
        />
        <div
          className="block sm:hidden absolute inset-0 pointer-events-none"
          style={{
            backgroundImage: `radial-gradient(ellipse at center 60%, ${c(endOpacity)} 0%, ${c(midOpacity * 0.5)} 30%, ${c(0)} 60%)`,
          }}
        />
      </>
    )
  }

  // Center horizontal + top/bottom: vertical gradient, dark toward text
  if (textHAlign === "center") {
    const toText = textVAlign === "top" ? "to top" : "to bottom"
    return (
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: `linear-gradient(${toText}, ${c(0)} 40%, ${c(midOpacity)} 65%, ${c(endOpacity)} 100%)`,
        }}
      />
    )
  }

  // Left/right + middle: horizontal gradient, dark toward text side
  if (textVAlign === "middle") {
    const toText = textHAlign === "left" ? "to left" : "to right"
    return (
      <>
        <div
          className="hidden sm:block absolute inset-0 pointer-events-none"
          style={{
            backgroundImage: `linear-gradient(${toText}, ${c(0)} 45%, ${c(midOpacity)} 70%, ${c(endOpacity)} 100%)`,
          }}
        />
        <div
          className="block sm:hidden absolute inset-0 pointer-events-none"
          style={{
            backgroundImage: `linear-gradient(to bottom, ${c(0)} 40%, ${c(midOpacity)} 65%, ${c(endOpacity)} 100%)`,
          }}
        />
      </>
    )
  }

  // Diagonal: dark corner = where text is, clear corner = opposite
  // CSS gradient angle points TO the dark end.
  // left+bottom → dark at bottom-left → gradient goes "to bottom left" ≈ 195deg
  // right+bottom → dark at bottom-right → 135deg (mirrored)
  // left+top → dark at top-left → 315deg (mirrored vertically)
  // right+top → dark at top-right → 45deg (mirrored both)
  const angleMap: Record<string, Record<string, number>> = {
    left:  { top: 315, bottom: 195 },
    right: { top: 45,  bottom: 135 },
  }
  const angle = angleMap[textHAlign]?.[textVAlign] ?? 225

  return (
    <>
      {/* Desktop & tablet — matches original: clear 50%, mid 65%, opaque 100% */}
      <div
        className="hidden sm:block absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: `linear-gradient(${angle}deg, ${c(0)} 50%, ${c(midOpacity)} 65%, ${c(endOpacity)} 100%)`,
        }}
      />
      {/* Mobile: vertical toward bottom — matches original: clear 40%, mid 60%, opaque 100% */}
      <div
        className="block sm:hidden absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: `linear-gradient(to bottom, ${c(0)} 40%, ${c(midOpacity * 1.6)} 60%, ${c(endOpacity)} 100%)`,
        }}
      />
    </>
  )
}

function HeroCarousel({ images, animate, speed = 5 }: { images: Array<{ src: string; alt: string }>; animate: boolean; speed?: number }) {
  const [activeIndex, setActiveIndex] = useState(0)

  useEffect(() => {
    if (images.length <= 1) return
    const ms = Math.max(speed, 1) * 1000
    const timer = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % images.length)
    }, ms)
    return () => clearInterval(timer)
  }, [images.length, speed])

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

function HeroBackgroundMedia({ content, animate, mediaType, theme }: { content: HeroBannerContent; animate: boolean; mediaType: string; theme: SectionTheme }) {
  const fallbackGradient = isDarkScheme(theme)
    ? "from-black-2 to-black-1"
    : "from-neutral-200 to-white"
  // If user explicitly chose "image", skip video rendering even if backgroundVideo exists
  if (mediaType === "image") {
    const images = content.images
    if (images && images.length >= 2) {
      return <HeroCarousel images={images} animate={animate} speed={content.carouselSpeed} />
    }
    const singleImage = images?.[0] ?? content.backgroundImage
    if (singleImage?.src && !singleImage.src.endsWith(".mp4") && !singleImage.src.endsWith(".webm")) {
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
      <div className={cn("absolute inset-0 bg-gradient-to-br", fallbackGradient, animate && "animate-hero-fade-in-slow")} />
    )
  }

  // Video mode: render video if available
  const desktopVideoSrc = content.backgroundVideo?.src || (isVideoUrl(content.backgroundImage?.src ?? "") ? content.backgroundImage.src : "")
  if (desktopVideoSrc) {
    return (
      <HeroVideo
        desktopSrc={desktopVideoSrc}
        mobileSrc={content.backgroundVideo?.mobileSrc || desktopVideoSrc}
        animate={animate}
      />
    )
  }

  // Fallback: check for video in images/backgroundImage
  const images = content.images
  if (images && images.length >= 2) {
    return <HeroCarousel images={images} animate={animate} speed={content.carouselSpeed} />
  }

  const singleImage = images?.[0] ?? content.backgroundImage

  if (singleImage?.src) {
    if (singleImage.src.endsWith(".mp4") || singleImage.src.endsWith(".webm")) {
      return (
        <HeroVideo
          desktopSrc={singleImage.src}
          mobileSrc={singleImage.src}
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
    <div className={cn("absolute inset-0 bg-gradient-to-br", fallbackGradient, animate && "animate-hero-fade-in-slow")} />
  )
}

function HeroTextContent({ content, animate, theme }: { content: HeroBannerContent; animate: boolean; theme: SectionTheme }) {
  const t = themeTokens[theme]
  return (
    <div className={cn("flex flex-col gap-4", animate && "animate-hero-fade-up")}>
      <div className={cn("flex flex-col leading-[0.8] drop-shadow-lg", t.textPrimary)}>
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
                    <span key={j} className={t.textSecondary}>
                      {part}
                    </span>
                  ) : (
                    <span key={j} className={t.textMuted}>
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
      const isDesktop = window.innerWidth >= MOBILE_BREAKPOINT
      const next = isDesktop ? desktopSrc : mobileSrc
      if (video.src.endsWith(next)) return
      video.src = next
      video.load()
      video.play().catch(() => {})
    }

    applySrc()

    const mql = window.matchMedia(`(min-width: ${MOBILE_BREAKPOINT}px)`)
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
