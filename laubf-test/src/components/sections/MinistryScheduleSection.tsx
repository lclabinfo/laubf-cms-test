/*
 * CMS SETTINGS:
 * -- Content (BASIC) --
 *   heading: string -- section heading (e.g. "Join Us" or "Children's Sunday Service")
 *   headingStyle?: 'sans' | 'script' -- heading font (default: 'sans', 'script' for cursive)
 *   description?: string -- optional text below heading
 *   scheduleLabel?: string -- label above schedule entries (e.g. "WHEN & WHERE")
 * -- Schedule (BASIC) --
 *   scheduleEntries?: { day, time, location }[] -- recurring meeting times
 *   timeValue?: string -- simple time string (e.g. "Every Sunday @ 1:30 PM")
 *   address?: string[] -- address lines
 *   directionsUrl?: string -- Google Maps link
 * -- Buttons (BASIC) --
 *   buttons?: { label, href, variant }[]
 * -- Media (BASIC) --
 *   image?: { src, alt } -- optional right-side image
 * -- Animation (ADVANCED) --
 *   enableAnimations?: boolean (default true) — toggle scroll-reveal animations
 *     Animations: left column slides in from left, right column slides in from right.
 * -- Layout (ADVANCED) --
 *   visible, colorScheme, paddingY, containerWidth
 *
 * DB SCHEMA: ministry_schedule_sections (id, heading, heading_style, description, schedule_label, time_value, directions_url, visible, color_scheme)
 * DB SCHEMA: ministry_schedule_entries (id, section_id, day, time, location, sort_order)
 * DB SCHEMA: ministry_schedule_addresses (id, section_id, line, sort_order)
 * DB SCHEMA: ministry_schedule_buttons (id, section_id, label, href, variant, sort_order)
 */
"use client";

import SectionContainer from "@/components/shared/SectionContainer";
import CTAButton from "@/components/shared/CTAButton";
import AnimateOnScroll from "@/components/shared/AnimateOnScroll";
import { themeTokens } from "@/lib/theme";
import type { MinistryScheduleSectionProps } from "@/lib/types/sections";
import { IconMapPin, IconExternalLink } from "@/components/layout/icons";
import Image from "next/image";

export default function MinistryScheduleSection(props: {
  settings: MinistryScheduleSectionProps;
}) {
  const { settings } = props;
  const { content } = settings;
  const t = themeTokens[settings.colorScheme];
  const animate = settings.enableAnimations !== false;
  const isScript = content.headingStyle === "script";
  const hasImage = !!content.image;

  return (
    <SectionContainer settings={settings}>
      <div className="flex flex-col lg:flex-row gap-10 lg:gap-16 items-start">
        {/* Left column */}
        <AnimateOnScroll animation="fade-left" enabled={animate} className={hasImage ? "w-full lg:w-[50%]" : "w-full lg:w-[40%]"}>
          {content.logo && (
            <div className="mb-6">
              <Image
                src={content.logo.src}
                alt={content.logo.alt}
                width={62}
                height={52}
                unoptimized
                className="object-contain brightness-0 invert"
              />
            </div>
          )}
          <h2
            className={`text-h2 ${t.textPrimary} mb-4`}
          >
            {content.heading}
          </h2>

          {content.description && (
            <p className={`text-body-1 ${t.textSecondary} mb-6`}>
              {content.description}
            </p>
          )}

          {/* Simple time + address layout (children variant) */}
          {content.timeValue && (
            <div className="mb-4">
              <p className={`text-h4 ${t.textMuted} mb-1`}>Time</p>
              <p className={`text-h3 font-medium ${t.textPrimary} leading-snug whitespace-pre-line`}>
                {content.timeValue}
              </p>
            </div>
          )}

          {content.address && content.address.length > 0 && (
            <div className="mb-6">
              <p className={`text-h4 ${t.textMuted} mb-1`}>Location</p>
              {content.address.map((line, i) => (
                <p key={i} className={`text-h3 font-medium ${t.textPrimary} leading-snug`}>
                  {line}
                </p>
              ))}
            </div>
          )}

          {content.directionsUrl && (
            <div className="mb-6">
              <CTAButton
                label="Get Directions"
                href={content.directionsUrl}
                variant="secondary"
                size="small"
                icon={<IconExternalLink className="ml-2 size-4" />}
              />
            </div>
          )}
        </AnimateOnScroll>

        {/* Right column */}
        <AnimateOnScroll animation="fade-right" staggerIndex={1} staggerBaseMs={150} enabled={animate} className={hasImage ? "w-full lg:w-[50%]" : "w-full lg:w-[60%]"}>
          {hasImage ? (
            <div className="relative w-full aspect-[4/3] rounded-2xl overflow-hidden">
              <Image
                src={content.image!.src}
                alt={content.image!.alt}
                fill
                className="object-cover"
                style={{ objectPosition: content.image?.objectPosition }}
              />
            </div>
          ) : (
            /* Schedule entries layout (college variant) */
            content.scheduleEntries && content.scheduleEntries.length > 0 && (
              <div>
                {content.scheduleLabel && (
                  <p className={`text-overline ${t.textMuted} mb-6`}>
                    {content.scheduleLabel}
                  </p>
                )}
                <div className="flex flex-col gap-6">
                  {content.scheduleEntries.map((entry, i) => (
                    <div key={i}>
                      <p className={`text-h3 font-medium ${t.textPrimary}`}>
                        <span className="font-medium">{entry.day}</span> @ {entry.time}
                      </p>
                      <div className="flex items-center gap-1.5 mt-1.5">
                        <IconMapPin className={`size-4 ${t.textMuted} shrink-0`} />
                        <p className={`text-body-2 ${t.textMuted}`}>{entry.location}</p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Buttons below schedule */}
                {content.buttons && content.buttons.length > 0 && (
                  <div className="flex flex-wrap gap-3 mt-8">
                    {content.buttons.map((btn, i) => (
                      <CTAButton
                        key={i}
                        label={btn.label}
                        href={btn.href}
                        variant={btn.variant}
                      />
                    ))}
                  </div>
                )}
              </div>
            )
          )}
        </AnimateOnScroll>
      </div>
    </SectionContainer>
  );
}
