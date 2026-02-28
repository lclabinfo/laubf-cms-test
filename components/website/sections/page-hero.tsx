"use client"

import SectionContainer from "@/components/website/shared/section-container"
import CTAButton from "@/components/website/shared/cta-button"
import { themeTokens, type SectionTheme } from "@/components/website/shared/theme-tokens"
import { cn } from "@/lib/utils"
import Image from "next/image"

/* ---------- CSS keyframe generator for elliptical orbits ---------- */

function generateOrbitCSS(
  name: string,
  radiusX: number,
  radiusY: number,
  offsetX: number,
  offsetY: number,
  startPhase: number,
  perpOffset: number = 0
): string {
  const steps = 60
  const frames: string[] = []

  for (let i = 0; i <= steps; i++) {
    const pct = ((i / steps) * 100).toFixed(2)
    const angle = (i / steps) * 2 * Math.PI + startPhase
    const baseX = radiusX * Math.cos(angle)
    const baseY = radiusY * Math.sin(angle)

    const normalLength = Math.sqrt(
      radiusY * radiusY * Math.cos(angle) * Math.cos(angle) +
        radiusX * radiusX * Math.sin(angle) * Math.sin(angle)
    )
    const normalX = (radiusY * Math.cos(angle)) / normalLength
    const normalY = (radiusX * Math.sin(angle)) / normalLength

    const x = offsetX + baseX + normalX * perpOffset
    const y = offsetY + baseY + normalY * perpOffset

    frames.push(`${pct}%{transform:translate(${x.toFixed(1)}px,${y.toFixed(1)}px)}`)
  }

  return `@keyframes ${name}{${frames.join("")}}`
}

const PERP_OFFSETS = [-40, 60, -25, 50, -35, 45, -30, 55, -20, 40]
const ORBIT_RADIUS_X = 500
const ORBIT_RADIUS_Y = 300
const ORBIT_DURATION = 100
const MAX_IMAGES = 10

interface PageHeroContent {
  overline: string
  heading: string
  primaryButton: { label: string; href: string; visible: boolean }
  secondaryButton: { label: string; href: string; visible: boolean }
  floatingImages: { src: string; alt: string; width: number; height: number; objectPosition?: string }[]
}

interface Props {
  content: PageHeroContent
  enableAnimations: boolean
  colorScheme?: SectionTheme
  paddingY?: "none" | "compact" | "default" | "spacious"
  containerWidth?: "standard" | "narrow" | "full"
}

export default function PageHeroSection({ content, enableAnimations, colorScheme = "light", paddingY, containerWidth }: Props) {
  const t = themeTokens[colorScheme]
  const gradientColor = colorScheme === "dark" ? "rgba(13,13,13," : "rgba(250,250,250,"
  const animate = enableAnimations !== false
  const images = (content.floatingImages ?? []).slice(0, MAX_IMAGES)
  const total = images.length

  const orbitCSS = images
    .map((_, i) => {
      const phase = (i / total) * 2 * Math.PI
      const perpOffset = PERP_OFFSETS[i % PERP_OFFSETS.length]
      return generateOrbitCSS(`page-hero-orbit-${i}`, ORBIT_RADIUS_X, ORBIT_RADIUS_Y, 0, 0, phase, perpOffset)
    })
    .join("\n")

  return (
    <SectionContainer colorScheme={colorScheme} paddingY={paddingY} containerWidth={containerWidth} className="!py-0" noContainer>
      <style dangerouslySetInnerHTML={{ __html: orbitCSS }} />

      <div className="relative min-h-[calc(100dvh-76px)] w-full overflow-hidden flex items-center justify-center">
        {images.map((img, i) => (
          <div
            key={i}
            className="absolute"
            style={{
              left: "50%",
              top: "50%",
              marginLeft: -(img.width / 2),
              marginTop: -(img.height / 2),
              width: img.width,
              height: img.height,
              animation: `page-hero-orbit-${i} ${ORBIT_DURATION}s linear infinite`,
              willChange: "transform",
            }}
          >
            <Image
              src={img.src}
              alt={img.alt}
              width={img.width}
              height={img.height}
              className="w-full h-full object-cover rounded-xl"
              style={{ objectPosition: img.objectPosition }}
            />
          </div>
        ))}

        <div
          className="absolute inset-0 z-[1] pointer-events-none"
          style={{
            background: `radial-gradient(ellipse at center, transparent 55%, ${gradientColor}0.3) 70%, ${gradientColor}0.7) 80%, ${gradientColor}0.95) 90%, ${gradientColor}1) 100%)`,
          }}
        />

        <div className="relative z-10 flex flex-col items-center justify-center text-center px-4 -mt-20">
          <div className="relative flex flex-col items-center">
            <div
              className="absolute pointer-events-none z-0"
              style={{
                inset: "-80% -120%",
                background: `radial-gradient(ellipse 50% 50% at center, ${gradientColor}1) 0%, ${gradientColor}0.98) 40%, ${gradientColor}0.9) 55%, ${gradientColor}0.7) 68%, ${gradientColor}0.4) 80%, ${gradientColor}0.1) 92%, transparent 100%)`,
              }}
            />

            {content.overline && (
              <p className={cn(`relative z-10 text-h4 ${t.textPrimary} mb-3`, animate && "animate-hero-fade-up")}>
                {content.overline}
              </p>
            )}

            <h1 className={cn(`relative z-10 text-h1 ${t.textPrimary} mb-12`, animate && "animate-hero-fade-up-delayed")}>
              {content.heading}
            </h1>

            <div className={cn("relative z-10 flex flex-col sm:flex-row items-center gap-3 w-[70%] sm:w-auto", animate && "animate-hero-fade-up-delayed-2")}>
              {content.primaryButton?.visible && (
                <CTAButton
                  label={content.primaryButton.label}
                  href={content.primaryButton.href}
                  variant="primary"
                  className="w-full sm:w-auto"
                />
              )}
              {content.secondaryButton?.visible && (
                <>
                  <div className="w-full min-[480px]:hidden">
                    <CTAButton label="FAQ" href={content.secondaryButton.href} variant="secondary" className="w-full" />
                  </div>
                  <div className="hidden min-[480px]:contents">
                    <CTAButton label={content.secondaryButton.label} href={content.secondaryButton.href} variant="secondary" />
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </SectionContainer>
  )
}
