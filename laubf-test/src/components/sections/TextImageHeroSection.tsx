/*
 * CMS SETTINGS:
 * -- Content (BASIC) --
 *   overline: string -- label above heading (e.g. "WHO WE ARE")
 *   headingLine1: string -- first line in Helvetica Neue (e.g. "Christian Ministry for")
 *   headingAccent: string -- second line in DM Serif Display italic (e.g. "College Students +")
 *   description: string -- paragraph below heading
 * -- Media (BASIC) --
 *   image: { src, alt } -- full-width landscape hero image
 * -- Animation (ADVANCED) --
 *   enableAnimations?: boolean (default true) — toggle entry animations
 *     Animations: text block fades up on load, hero image scales in.
 * -- Layout (ADVANCED) --
 *   visible, colorScheme, paddingY, containerWidth
 *   textAlign: 'left' | 'center' | 'right' -- text alignment (default: 'left')
 *
 * DB SCHEMA: text_image_hero_sections (id, overline, heading_line1, heading_accent, description, image_src, image_alt, visible, color_scheme, text_align)
 */
"use client";

import SectionContainer from "@/components/shared/SectionContainer";
import { themeTokens } from "@/lib/theme";
import type { TextImageHeroSectionProps } from "@/lib/types/sections";
import { cn } from "@/lib/utils";
import Image from "next/image";

const alignmentClasses = {
  left: {
    wrapper: "",
    heading: "",
    description: "max-w-xl",
  },
  center: {
    wrapper: "text-center items-center mx-auto max-w-[680px]",
    heading: "",
    description: "max-w-[680px]",
  },
  right: {
    wrapper: "text-right items-end ml-auto",
    heading: "",
    description: "max-w-xl ml-auto",
  },
} as const;

export default function TextImageHeroSection(props: {
  settings: TextImageHeroSectionProps;
}) {
  const { settings } = props;
  const { content } = settings;
  const t = themeTokens[settings.colorScheme];
  const animate = settings.enableAnimations !== false;
  const align = settings.textAlign ?? "left";
  const a = alignmentClasses[align];

  return (
    <SectionContainer settings={settings} className="pt-12 lg:pt-16">
      {/* Text block */}
      <div className={cn(`mb-12 lg:mb-16 flex flex-col ${a.wrapper}`, animate && "animate-hero-fade-up")}>
        <p className={`text-overline ${t.textMuted} mb-4`}>{content.overline}</p>
        <h1 className={`mb-6 ${a.heading}`}>
          <span className={`text-h1 ${t.textPrimary} block`}>{content.headingLine1}</span>
          {content.headingAccent && (
            <span className={`text-display-heading ${t.textPrimary} block mt-1`}>
              {content.headingAccent}
            </span>
          )}
        </h1>
        <p className={`text-body-1 ${t.textMuted} ${a.description}`}>{content.description}</p>
      </div>

      {/* Full-width hero image */}
      <div className={cn("relative w-full aspect-[16/7] rounded-2xl overflow-hidden", animate && "animate-hero-fade-up-delayed")}>
        <Image
          src={content.image.src}
          alt={content.image.alt}
          fill
          className="object-cover"
          priority
          style={{ objectPosition: content.image.objectPosition }}
        />
      </div>
    </SectionContainer>
  );
}
