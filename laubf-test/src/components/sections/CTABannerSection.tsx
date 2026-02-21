/*
 * CMS SETTINGS:
 * ── Content (BASIC) ──
 *   overline: string — "New Here?"
 *   heading: string — "Visit us this Sunday"
 *   body: string — descriptive paragraph
 * ── Buttons (BASIC) ──
 *   primaryButton: { label, href, visible }
 *   secondaryButton: { label, href, visible }
 * ── Background (BASIC) ──
 *   backgroundImage: { src, alt } — shown at 10% opacity
 * ── Animation (ADVANCED) ──
 *   enableAnimations?: boolean (default true) — toggle scroll-reveal animations
 *     Animations: content fades up, buttons fade up with delay.
 * ── Layout (ADVANCED) ──
 *   paddingY, colorScheme, backgroundImageOpacity
 *
 * DB SCHEMA: cta_banner_sections (id, overline, heading, body,
 *   primary_btn_label, primary_btn_href, secondary_btn_label, secondary_btn_href,
 *   background_image_url, visible)
 */
"use client";

import { SectionThemeContext } from "@/lib/theme";
import CTAButton from "@/components/shared/CTAButton";
import AnimateOnScroll from "@/components/shared/AnimateOnScroll";
import type { CTABannerSectionProps } from "@/lib/types/sections";
import Image from "next/image";

export default function CTABannerSection(props: {
  settings: CTABannerSectionProps;
}) {
  const { settings } = props;
  if (!settings.visible) return null;

  const { content } = settings;
  const animate = settings.enableAnimations !== false;

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
  );
}
