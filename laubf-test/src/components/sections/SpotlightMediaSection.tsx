/*
 * CMS SETTINGS:
 * ── Content (BASIC) ──
 *   sectionHeading: string — "This Week's Message"
 *   sermon.slug: string — link to sermon detail page
 *   sermon.title: string — sermon series/title name
 *   sermon.speaker: string — pastor name
 *   sermon.date: string — formatted date
 *   sermon.series: string — service type
 *   sermon.thumbnailUrl: string — video thumbnail
 *   sermon.videoUrl: string — YouTube/Vimeo embed URL
 * ── Animation (ADVANCED) ──
 *   enableAnimations?: boolean (default true) — toggle scroll-reveal animations
 *     Animations: heading + metadata fade up, video thumbnail scales in.
 * ── Layout (ADVANCED) ──
 *   paddingY, colorScheme
 *
 * DB SCHEMA: sermons (id, slug, title, speaker, date, series, video_url,
 *   thumbnail_url, featured, created_at)
 */
"use client";

import SectionContainer from "@/components/shared/SectionContainer";
import VideoThumbnail from "@/components/shared/VideoThumbnail";
import AnimateOnScroll from "@/components/shared/AnimateOnScroll";
import { themeTokens } from "@/lib/theme";
import type { SpotlightMediaSectionProps } from "@/lib/types/sections";
import Link from "next/link";

export default function SpotlightMediaSection(props: {
  settings: SpotlightMediaSectionProps;
}) {
  const { settings } = props;
  const { content } = settings;
  const { sermon } = content;
  const t = themeTokens[settings.colorScheme];
  const animate = settings.enableAnimations !== false;

  const sermonHref = sermon.slug ? `/messages/${sermon.slug}` : undefined;

  return (
    <SectionContainer settings={settings}>
      <div className="flex flex-col gap-10">
        {/* Section heading + title */}
        <AnimateOnScroll animation="fade-up" enabled={animate} className="flex flex-col gap-2">
          <span className={`text-body-1 ${t.textSecondary}`}>
            {content.sectionHeading}
          </span>
          <h2 className={`text-h2 text-balance ${t.textPrimary}`}>
            {sermon.title}
          </h2>
        </AnimateOnScroll>

        {/* Speaker + metadata */}
        <AnimateOnScroll animation="fade-up" staggerIndex={1} enabled={animate} className="flex flex-col gap-1">
          <span className={`text-h4 ${t.textPrimary}`}>{sermon.speaker}</span>
          <span className={`text-h4 ${t.textMuted} uppercase`}>
            {sermon.series} &bull; {sermon.date}
          </span>
        </AnimateOnScroll>

        {/* Video player */}
        <AnimateOnScroll animation="scale-up" staggerIndex={2} enabled={animate}>
          {sermonHref ? (
            <Link href={sermonHref} className="block">
              <VideoThumbnail
                data={{
                  id: "sermon-video",
                  title: sermon.title,
                  thumbnailUrl: sermon.thumbnailUrl,
                  videoUrl: sermon.videoUrl,
                }}
                size="featured"
              />
            </Link>
          ) : (
            <VideoThumbnail
              data={{
                id: "sermon-video",
                title: sermon.title,
                thumbnailUrl: sermon.thumbnailUrl,
                videoUrl: sermon.videoUrl,
              }}
              size="featured"
            />
          )}
        </AnimateOnScroll>
      </div>
    </SectionContainer>
  );
}
