/*
 * CMS SETTINGS:
 * -- Content (BASIC) --
 *   overline: string — small label above heading (e.g. "New here?")
 *   heading: string — main heading (Helvetica Neue Medium)
 * -- Buttons (BASIC) --
 *   primaryButton: { label, href, visible }
 *   secondaryButton: { label, href, visible }
 * -- Media (BASIC) --
 *   floatingImages[]: { src, alt, width, height } — max 10, auto-distributed on orbit
 * -- Animation (ADVANCED) --
 *   enableAnimations?: boolean (default true) — toggle entry animations
 *     Animations: center content fades up with staggered delays while
 *     orbiting images continue their motion loop.
 * -- Layout (ADVANCED) --
 *   visible, colorScheme, paddingY, containerWidth
 *
 * DB SCHEMA: page_hero_sections (id, overline, heading, primary_btn_label, primary_btn_href, primary_btn_visible, secondary_btn_label, secondary_btn_href, secondary_btn_visible, visible, color_scheme)
 * DB SCHEMA: page_hero_floating_images (id, section_id, src, alt, width, height, sort_order)
 */
"use client";

import SectionContainer from "@/components/shared/SectionContainer";
import CTAButton from "@/components/shared/CTAButton";
import { themeTokens } from "@/lib/theme";
import type { PageHeroSectionProps } from "@/lib/types/sections";
import { cn } from "@/lib/utils";
import Image from "next/image";

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
  const steps = 60;
  const frames: string[] = [];

  for (let i = 0; i <= steps; i++) {
    const pct = ((i / steps) * 100).toFixed(2);
    const angle = (i / steps) * 2 * Math.PI + startPhase;
    const baseX = radiusX * Math.cos(angle);
    const baseY = radiusY * Math.sin(angle);

    const normalLength = Math.sqrt(
      radiusY * radiusY * Math.cos(angle) * Math.cos(angle) +
        radiusX * radiusX * Math.sin(angle) * Math.sin(angle)
    );
    const normalX = (radiusY * Math.cos(angle)) / normalLength;
    const normalY = (radiusX * Math.sin(angle)) / normalLength;

    const x = offsetX + baseX + normalX * perpOffset;
    const y = offsetY + baseY + normalY * perpOffset;

    frames.push(`${pct}%{transform:translate(${x.toFixed(1)}px,${y.toFixed(1)}px)}`);
  }

  return `@keyframes ${name}{${frames.join("")}}`;
}

/* ---------- Perpendicular offsets for natural variation ---------- */

const PERP_OFFSETS = [-40, 60, -25, 50, -35, 45, -30, 55, -20, 40];

const ORBIT_RADIUS_X = 500;
const ORBIT_RADIUS_Y = 300;
const ORBIT_DURATION = 100; // seconds per full revolution
const MAX_IMAGES = 10;

export default function PageHeroSection(props: {
  settings: PageHeroSectionProps;
}) {
  const { settings } = props;
  const { content } = settings;
  const t = themeTokens[settings.colorScheme];
  const gradientColor =
    settings.colorScheme === "dark"
      ? "rgba(13,13,13,"
      : "rgba(250,250,250,";

  const animate = settings.enableAnimations !== false;
  const images = content.floatingImages.slice(0, MAX_IMAGES);
  const total = images.length;

  // Generate CSS @keyframes for each orbiting image
  const orbitCSS = images
    .map((_, i) => {
      const phase = (i / total) * 2 * Math.PI;
      const perpOffset = PERP_OFFSETS[i % PERP_OFFSETS.length];
      return generateOrbitCSS(
        `page-hero-orbit-${i}`,
        ORBIT_RADIUS_X,
        ORBIT_RADIUS_Y,
        0,
        0,
        phase,
        perpOffset
      );
    })
    .join("\n");

  return (
    <SectionContainer settings={settings} className="!py-0" noContainer>
      {/* Inject orbit keyframes — CSS animations run on compositor thread,
          start immediately on first paint with zero JS / hydration cost */}
      <style dangerouslySetInnerHTML={{ __html: orbitCSS }} />

      <div className="relative min-h-[calc(100dvh-76px)] w-full overflow-hidden flex items-center justify-center">
        {/* Orbiting images */}
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

        {/* Radial gradient overlay — fades images only at outer edges */}
        <div
          className="absolute inset-0 z-[1] pointer-events-none"
          style={{
            background: `radial-gradient(ellipse at center, transparent 55%, ${gradientColor}0.3) 70%, ${gradientColor}0.7) 80%, ${gradientColor}0.95) 90%, ${gradientColor}1) 100%)`,
          }}
        />

        {/* Center content */}
        <div className="relative z-10 flex flex-col items-center justify-center text-center px-4 -mt-20">
          <div className="relative flex flex-col items-center">
            {/* Radial glow — sized relative to this content block via inset stretch */}
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

            <h1
              className={cn(`relative z-10 text-h1 ${t.textPrimary} mb-12`, animate && "animate-hero-fade-up-delayed")}
            >
              {content.heading}
            </h1>

            <div className={cn("relative z-10 flex flex-col sm:flex-row items-center gap-3 w-[70%] sm:w-auto", animate && "animate-hero-fade-up-delayed-2")}>
              {content.primaryButton.visible && (
                <CTAButton
                  label={content.primaryButton.label}
                  href={content.primaryButton.href}
                  variant="primary"
                  className="w-full sm:w-auto"
                />
              )}
              {content.secondaryButton.visible && (
                <>
                  <div className="w-full min-[480px]:hidden">
                    <CTAButton
                      label="FAQ"
                      href={content.secondaryButton.href}
                      variant="secondary"
                      className="w-full"
                    />
                  </div>
                  <div className="hidden min-[480px]:contents">
                    <CTAButton
                      label={content.secondaryButton.label}
                      href={content.secondaryButton.href}
                      variant="secondary"
                    />
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </SectionContainer>
  );
}
