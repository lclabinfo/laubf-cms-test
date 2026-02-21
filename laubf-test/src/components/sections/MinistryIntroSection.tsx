/*
 * CMS SETTINGS:
 * -- Content (BASIC) --
 *   overline: string -- label above heading (e.g. "INTRODUCTION")
 *   heading: string -- section heading (e.g. "Adult Ministry", "CBF")
 *   description: string -- body paragraph
 * -- Media (BASIC) --
 *   image?: { src, alt } -- if present, renders two-column layout (image left, text right)
 * -- Animation (ADVANCED) --
 *   enableAnimations?: boolean (default true) — toggle scroll-reveal animations
 *     Animations: image slides in from left, text fades up from right.
 * -- Layout (ADVANCED) --
 *   visible, colorScheme, paddingY, containerWidth
 *
 * DB SCHEMA: ministry_intro_sections (id, overline, heading, description, image_src, image_alt, visible, color_scheme)
 */
"use client";

import SectionContainer from "@/components/shared/SectionContainer";
import AnimateOnScroll from "@/components/shared/AnimateOnScroll";
import { themeTokens } from "@/lib/theme";
import type { MinistryIntroSectionProps } from "@/lib/types/sections";
import Image from "next/image";

export default function MinistryIntroSection(props: {
  settings: MinistryIntroSectionProps;
}) {
  const { settings } = props;
  const { content } = settings;
  const t = themeTokens[settings.colorScheme];
  const animate = settings.enableAnimations !== false;
  const hasSideImage = !!content.image;

  if (hasSideImage) {
    return (
      <SectionContainer settings={settings}>
        <div className="flex flex-col lg:flex-row gap-10 lg:gap-16 items-center">
          {/* Left — image */}
          <AnimateOnScroll animation="fade-left" enabled={animate} className="w-full lg:w-[45%] shrink-0">
            <div className="relative w-full aspect-[4/3] rounded-2xl overflow-hidden">
              <Image
                src={content.image!.src}
                alt={content.image!.alt}
                fill
                className="object-cover"
                style={{ objectPosition: content.image?.objectPosition }}
              />
            </div>
          </AnimateOnScroll>

          {/* Right — text */}
          <AnimateOnScroll animation="fade-right" staggerIndex={1} staggerBaseMs={150} enabled={animate} className="w-full lg:w-[55%]">
            <p className={`text-h4 font-normal ${t.textMuted} mb-3`}>
              {content.overline}
            </p>
            <h2 className={`text-h2 ${t.textPrimary} mb-5`}>
              {content.heading}
            </h2>
            <p className={`text-body-1 ${t.textSecondary} leading-relaxed whitespace-pre-line`}>
              {content.description}
            </p>
          </AnimateOnScroll>
        </div>
      </SectionContainer>
    );
  }

  /* Single-column variant (no image) */
  return (
    <SectionContainer settings={settings}>
      <AnimateOnScroll animation="fade-up" enabled={animate} className="max-w-3xl">
        <p className={`text-h4 font-normal ${t.textMuted} mb-3`}>
          {content.overline}
        </p>
        <h2 className={`text-h2 ${t.textPrimary} mb-5`}>
          {content.heading}
        </h2>
        <p className={`text-body-1 ${t.textSecondary} leading-relaxed whitespace-pre-line`}>
          {content.description}
        </p>
      </AnimateOnScroll>
    </SectionContainer>
  );
}
