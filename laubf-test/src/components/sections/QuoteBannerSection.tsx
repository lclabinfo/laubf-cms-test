/*
 * CMS SETTINGS:
 * ── Theme (BASIC) ──
 *   overline: string — "2026 SPIRITUAL DIRECTION"
 * ── Heading (BASIC) ──
 *   heading: string — rendered in strude script font ("Not of the World")
 * ── Verse (BASIC) ──
 *   verse.text: string — Bible verse text
 *   verse.reference: string — "John 17:16-18"
 * ── Animation (ADVANCED) ──
 *   enableAnimations?: boolean (default true) — toggle scroll-reveal animations
 *     Animations: overline + heading fade up, verse text fades in.
 * ── Background (ADVANCED) ──
 *   backgroundStyle: 'gradient' | 'solid'
 * ── Layout (ADVANCED) ──
 *   paddingY, colorScheme
 *
 * DB SCHEMA: quote_banner_sections (id, overline, heading, verse_text,
 *   verse_reference, visible, background_style)
 */
"use client";

import SectionContainer from "@/components/shared/SectionContainer";
import OverlineLabel from "@/components/shared/OverlineLabel";
import AnimateOnScroll from "@/components/shared/AnimateOnScroll";
import type { QuoteBannerSectionProps } from "@/lib/types/sections";

export default function QuoteBannerSection(props: {
  settings: QuoteBannerSectionProps;
}) {
  const { settings } = props;
  const { content } = settings;
  const animate = settings.enableAnimations !== false;

  return (
    <SectionContainer
      settings={{
        ...settings,
        containerWidth: "narrow",
      }}
      bgOverride="bg-gradient-to-b from-black-gradient to-black-1 to-[67%]"
    >
      <div className="relative flex flex-col items-center gap-10 text-center overflow-hidden">
        {/* Spotlight beam from top center */}
        <div
          className="absolute top-[-120px] left-1/2 -translate-x-1/2 w-[926px] h-[500px] pointer-events-none"
          style={{
            background:
              "conic-gradient(from 180deg at 50% 0%, transparent 135deg, rgba(250,250,250,0.06) 160deg, rgba(250,250,250,0.12) 175deg, rgba(250,250,250,0.18) 180deg, rgba(250,250,250,0.12) 185deg, rgba(250,250,250,0.06) 200deg, transparent 225deg)",
            maskImage:
              "radial-gradient(ellipse 60% 80% at 50% 0%, black 0%, transparent 100%)",
            WebkitMaskImage:
              "radial-gradient(ellipse 60% 80% at 50% 0%, black 0%, transparent 100%)",
          }}
        />

        {/* Content */}
        <AnimateOnScroll animation="fade-up" enabled={animate} className="relative flex flex-col items-center gap-4 lg:gap-6">
          <OverlineLabel text={content.overline} className="text-white-3" />
          <h2 className="text-script-heading text-white-1">
            {content.heading}
          </h2>
        </AnimateOnScroll>

        <AnimateOnScroll animation="fade-in" staggerIndex={1} staggerBaseMs={200} enabled={animate} className="relative flex flex-col items-center gap-4">
          <p className="text-body-1 text-white-2 max-w-[960px] leading-[1.5]">
            {content.verse.text}
          </p>
          <p className="text-h4 text-white-3">{content.verse.reference}</p>
        </AnimateOnScroll>
      </div>
    </SectionContainer>
  );
}
