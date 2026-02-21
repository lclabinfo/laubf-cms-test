/*
 * CMS SETTINGS:
 * -- Content (BASIC) --
 *   overline: string -- label above heading (e.g. "SUNDAY SERVICE")
 *   heading: string -- section heading
 *   description: string -- optional intro text
 * -- Media (BASIC) --
 *   imageSrc: string -- static image displayed alongside timeline
 *   imageAlt: string -- alt text for the image
 *   videoUrl: string -- (optional) YouTube embed URL for vertical/shorts video
 * -- Timeline (BASIC) --
 *   items[]: { time, title, description }
 * -- Animation (ADVANCED) --
 *   enableAnimations?: boolean (default true) — toggle scroll-reveal animations
 *     Animations: header fades up, image slides in from left, timeline items stagger up.
 * -- Layout (ADVANCED) --
 *   visible, colorScheme, paddingY, containerWidth
 *
 * DB SCHEMA: timeline_sections (id, overline, heading, description, image_src, image_alt, video_url, visible, color_scheme)
 * DB SCHEMA: timeline_items (id, section_id, time, title, description, sort_order)
 */
"use client";

import SectionContainer from "@/components/shared/SectionContainer";
import OverlineLabel from "@/components/shared/OverlineLabel";
import AnimateOnScroll from "@/components/shared/AnimateOnScroll";
import { themeTokens } from "@/lib/theme";
import type { TimelineSectionProps } from "@/lib/types/sections";
import Image from "next/image";

export default function TimelineSection(props: {
  settings: TimelineSectionProps;
}) {
  const { settings } = props;
  const { content } = settings;
  const t = themeTokens[settings.colorScheme];
  const animate = settings.enableAnimations !== false;

  return (
    <SectionContainer settings={settings}>
      {/* Header area */}
      <AnimateOnScroll animation="fade-up" enabled={animate} className="mb-12">
        <OverlineLabel text={content.overline} className="text-brand-1" />
        <h2 className={`text-h2 ${t.textPrimary} mt-3`}>
          {content.heading}
        </h2>
        {content.description && (
          <p className={`text-body-1 ${t.textSecondary} mt-3 max-w-2xl`}>
            {content.description}
          </p>
        )}
      </AnimateOnScroll>

      {/* Two-column layout: image left, timeline right */}
      <div className="flex flex-col lg:flex-row gap-12 lg:gap-16">
        {/* Left column -- image */}
        <AnimateOnScroll animation="fade-left" enabled={animate} className="lg:w-[40%] shrink-0">
          {content.imageSrc ? (
            <div className="relative aspect-[3/4] w-full max-h-[500px] rounded-2xl overflow-hidden">
              <Image
                src={content.imageSrc}
                alt={content.imageAlt || ""}
                fill
                className="object-cover"
              />
            </div>
          ) : content.videoUrl ? (
            <div className="aspect-[9/16] max-h-[500px] w-full rounded-2xl overflow-hidden">
              <iframe
                src={content.videoUrl}
                title="Sunday service video"
                className="w-full h-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
          ) : null}
        </AnimateOnScroll>

        {/* Right column -- timeline items */}
        <div className="lg:w-[60%] flex items-center">
          <div className="w-full">
            {content.items.map((item, i) => {
              const isLast = i === content.items.length - 1;
              return (
                <div
                  key={i}
                  className={`relative pl-10 ${isLast ? "pb-0" : "pb-10"}`}
                >
                  {/* Filled dot marker */}
                  <div className="absolute left-0 top-1 w-3 h-3 rounded-full bg-brand-1" />

                  {/* Vertical connecting line */}
                  {!isLast && (
                    <div className={`absolute left-[5px] top-4 bottom-0 w-px ${t.textPrimary} opacity-15`} />
                  )}

                  {/* Item content */}
                  <p className={`text-body-2 ${t.textMuted} mb-1`}>
                    {item.time}
                  </p>
                  <h3 className={`text-h3 ${t.textPrimary} mb-2`}>{item.title}</h3>
                  <p className={`text-body-2 ${t.textSecondary} max-w-lg`}>{item.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </SectionContainer>
  );
}
