"use client"

import { motion, useAnimationControls } from "motion/react"
import { useEffect, useState } from "react"
import SectionContainer from "@/components/website/shared/section-container"
import OverlineLabel from "@/components/website/shared/overline-label"
import CTAButton from "@/components/website/shared/cta-button"
import { themeTokens, type SectionTheme } from "@/components/website/shared/theme-tokens"
import Image from "next/image"

interface SectionImage {
  src: string
  alt: string
  objectPosition?: string
}

interface MediaTextContent {
  overline: string
  heading: string
  body: string
  button: { label: string; href: string; visible: boolean }
  images: SectionImage[]
  rotationSpeed?: number
}

interface Props {
  content: MediaTextContent
  enableAnimations: boolean
  colorScheme?: SectionTheme
  paddingY?: "none" | "compact" | "default" | "spacious"
  containerWidth?: "standard" | "narrow" | "full"
}

/* ---------- Constants ---------- */

const MAX_ROTATION_SPACING = 20
const MAX_IMAGES = 14
const RADIUS = 650
const CIRCLE_CENTER_X = -350
const CIRCLE_CENTER_Y = 286.5
const HOVER_SLOWDOWN = 5

const MOBILE_ITEM_W = 280
const MOBILE_ITEM_H = 240
const MOBILE_GAP = 16
const MOBILE_SCROLL_DURATION = 30

/* ---------- Desktop: Circular rotating wheel ---------- */

function RotatingWheel({
  images,
  speed,
}: {
  images: SectionImage[]
  speed: number
}) {
  const [isPaused, setIsPaused] = useState(false)
  const controls = useAnimationControls()

  const shouldRotate = images.length >= 3

  const minImagesNeeded = Math.min(
    Math.ceil(360 / MAX_ROTATION_SPACING),
    MAX_IMAGES
  )

  const carouselImages = shouldRotate
    ? Array.from(
        { length: minImagesNeeded },
        (_, i) => images[i % images.length]
      )
    : images

  const totalImages = carouselImages.length
  const angleStep = 360 / totalImages

  useEffect(() => {
    if (!shouldRotate) return
    controls.start({
      rotate: -360,
      transition: {
        duration: isPaused ? speed * HOVER_SLOWDOWN : speed,
        ease: "linear",
        repeat: Infinity,
      },
    })
  }, [isPaused, shouldRotate, controls, speed])

  useEffect(() => {
    if (shouldRotate) {
      controls.start({
        rotate: -360,
        transition: {
          duration: speed,
          ease: "linear",
          repeat: Infinity,
        },
      })
    }
  }, [])

  return (
    <div
      className="h-[573px] absolute -right-[30px] top-0 w-[600px]"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      <motion.div
        className="absolute inset-0"
        style={{
          transformOrigin: `${CIRCLE_CENTER_X}px ${CIRCLE_CENTER_Y}px`,
        }}
        animate={controls}
        initial={{ rotate: 0 }}
      >
        {carouselImages.map((img, index) => {
          const angle = index * angleStep
          const angleRad = (angle * Math.PI) / 180
          const x = CIRCLE_CENTER_X + Math.cos(angleRad) * RADIUS
          const y = CIRCLE_CENTER_Y + Math.sin(angleRad) * RADIUS

          return (
            <div
              key={index}
              className="absolute"
              style={{
                left: `${x}px`,
                top: `${y}px`,
                transform: `translate(-50%, -50%) rotate(${angle}deg)`,
              }}
            >
              <div className="h-[192px] relative rounded-lg w-[338px] overflow-hidden">
                {img.src ? (
                  <Image
                    src={img.src}
                    alt={img.alt}
                    fill
                    className="object-cover"
                    style={{ objectPosition: img.objectPosition }}
                  />
                ) : (
                  <div className="absolute inset-0 bg-white-2" />
                )}
              </div>
            </div>
          )
        })}
      </motion.div>
    </div>
  )
}

/* ---------- Mobile: Horizontal scrolling carousel ---------- */

function MobileCarousel({
  images,
  themeColor,
}: {
  images: SectionImage[]
  themeColor: string
}) {
  const duplicated = [...images, ...images, ...images]

  return (
    <div className="h-[240px] overflow-hidden relative w-full">
      <div
        className="absolute left-0 top-0 bottom-0 w-[60px] z-10 pointer-events-none"
        style={{
          background: `linear-gradient(to right, ${themeColor}, transparent)`,
        }}
      />
      <div
        className="absolute right-0 top-0 bottom-0 w-[60px] z-10 pointer-events-none"
        style={{
          background: `linear-gradient(to left, ${themeColor}, transparent)`,
        }}
      />

      <motion.div
        className="flex gap-4 absolute"
        animate={{
          x: [0, -1 * images.length * (MOBILE_ITEM_W + MOBILE_GAP)],
        }}
        transition={{
          duration: MOBILE_SCROLL_DURATION,
          ease: "linear",
          repeat: Infinity,
        }}
      >
        {duplicated.map((img, index) => (
          <div
            key={index}
            className="h-[240px] w-[280px] rounded-lg overflow-hidden flex-shrink-0"
          >
            {img.src ? (
              <Image
                src={img.src}
                alt={img.alt}
                width={MOBILE_ITEM_W}
                height={MOBILE_ITEM_H}
                className="w-full h-full object-cover"
                style={{ objectPosition: img.objectPosition }}
              />
            ) : (
              <div className="w-full h-full bg-white-2" />
            )}
          </div>
        ))}
      </motion.div>
    </div>
  )
}

/* ---------- Main Section ---------- */

export default function MediaTextSection({ content, colorScheme = "dark", paddingY, containerWidth }: Props) {
  const t = themeTokens[colorScheme]
  const speed = content.rotationSpeed ?? 50

  const themeColor =
    colorScheme === "dark"
      ? "rgb(13, 13, 13)"
      : "rgb(250, 250, 250)"

  const vignetteGradient =
    colorScheme === "dark"
      ? "linear-gradient(rgb(13,13,13) 5%, rgba(13,13,13,0.5) 25%, rgba(13,13,13,0) 50%, rgba(13,13,13,0.5) 75%, rgb(13,13,13) 97.5%)"
      : "linear-gradient(rgb(250,250,250) 0%, rgba(250,250,250,0.5) 24.5%, rgba(250,250,250,0) 50%, rgba(250,250,250,0.5) 75%, rgb(250,250,250) 100%)"

  return (
    <SectionContainer colorScheme={colorScheme} paddingY={paddingY} containerWidth={containerWidth} className="py-0!" noContainer>
      {/* Desktop layout */}
      <div className="hidden md:grid grid-cols-[4fr_5fr] w-full overflow-hidden pr-10">
        <div className="relative overflow-hidden h-[573px]">
          <RotatingWheel images={content.images} speed={speed} />
          <div
            className="absolute inset-0 pointer-events-none z-10"
            style={{ backgroundImage: vignetteGradient }}
          />
        </div>

        <div
          className="flex flex-col justify-center gap-8 pl-8 py-24"
          style={{ paddingRight: "max(2rem, calc((100vw - 1200px) / 2))" }}
        >
          <div className="flex flex-col gap-6">
            <div className="flex flex-col gap-3">
              <OverlineLabel text={content.overline} />
              <h2 className={`text-h2 ${t.textPrimary} max-w-[656px] text-balance`}>
                {content.heading}
              </h2>
            </div>
            <p className={`text-body-1 ${t.textSecondary} max-w-[656px]`}>
              {content.body}
            </p>
          </div>

          {content.button.visible && (
            <CTAButton
              label={content.button.label}
              href={content.button.href}
              variant="secondary"
              className="self-start"
            />
          )}
        </div>
      </div>

      {/* Mobile layout */}
      <div className="flex md:hidden flex-col gap-8 py-16 px-4">
        <div className="flex flex-col gap-6">
          <div className="flex flex-col gap-3">
            <OverlineLabel text={content.overline} />
            <h2 className={`text-h2 ${t.textPrimary} text-balance`}>
              {content.heading}
            </h2>
          </div>
          <p className={`text-body-1 ${t.textSecondary}`}>
            {content.body}
          </p>
        </div>

        {content.button.visible && (
          <CTAButton
            label={content.button.label}
            href={content.button.href}
            variant="secondary"
            className="self-start"
          />
        )}

        <MobileCarousel images={content.images} themeColor={themeColor} />
      </div>
    </SectionContainer>
  )
}
