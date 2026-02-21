/*
 * CMS SETTINGS:
 * -- Content (BASIC) --
 *   logoSrc: string -- centered logo image above heading
 *   heading: string -- section heading (e.g. "About UBF")
 *   description: string -- long centered paragraph
 * -- Media (BASIC) --
 *   videoUrl: string -- YouTube embed URL
 *   videoTitle: string -- accessible title for iframe
 * -- Animation (ADVANCED) --
 *   enableAnimations?: boolean (default true) — toggle scroll-reveal animations
 *     Animations: logo + heading + description fade up, video scales in.
 * -- Layout (ADVANCED) --
 *   visible, colorScheme, paddingY, containerWidth
 *
 * DB SCHEMA: about_description_sections (id, logo_src, heading, description, video_url, video_title, visible, color_scheme)
 */
"use client";

import SectionContainer from "@/components/shared/SectionContainer";
import AnimateOnScroll from "@/components/shared/AnimateOnScroll";
import { themeTokens } from "@/lib/theme";
import type { AboutDescriptionSectionProps } from "@/lib/types/sections";
import Image from "next/image";

export default function AboutDescriptionSection(props: {
  settings: AboutDescriptionSectionProps;
}) {
  const { settings } = props;
  const { content } = settings;
  const t = themeTokens[settings.colorScheme];
  const animate = settings.enableAnimations !== false;

  return (
    <SectionContainer settings={settings}>
      {/* Centered header with logo */}
      <AnimateOnScroll animation="fade-up" enabled={animate} className="flex flex-col items-center text-center max-w-[840px] mx-auto">
        {/* Logo */}
        <div className="mb-5">
          <Image
            src={content.logoSrc}
            alt=""
            width={120}
            height={100}
            className="object-contain"
          />
        </div>

        {/* Heading */}
        <h2 className={`text-h2 ${t.textPrimary} mb-8`}>{content.heading}</h2>

        {/* Description */}
        <p className={`text-body-1 ${t.textSecondary} leading-relaxed`}>
          {content.description}
        </p>
      </AnimateOnScroll>

      {/* Video embed */}
      {content.videoUrl && (
        <AnimateOnScroll animation="scale-up" staggerIndex={1} staggerBaseMs={200} enabled={animate} className="mt-12 lg:mt-16 max-w-[854px] mx-auto">
          <div className="relative aspect-video rounded-2xl overflow-hidden">
            <iframe
              src={content.videoUrl}
              title={content.videoTitle || "Video"}
              className="w-full h-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
        </AnimateOnScroll>
      )}
    </SectionContainer>
  );
}
