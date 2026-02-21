/*
 * CMS SETTINGS:
 * -- Content (BASIC) --
 *   overline: string -- label above content (e.g. "WHEN & WHERE")
 *   timeLabel: string -- label for time row (e.g. "Time")
 *   timeValue: string -- display value (e.g. "Every Sunday\n@ 11 AM")
 *   locationLabel: string -- label for location row (e.g. "Location")
 *   address[]: string[] -- address lines
 *   directionsUrl: string -- Google Maps link
 *   directionsLabel: string -- button text for directions CTA
 * -- Media (BASIC) --
 *   images[]: { src, alt } -- location photos
 * -- Animation (ADVANCED) --
 *   enableAnimations?: boolean (default true) — toggle scroll-reveal animations
 *     Animations: info column slides in from left, image slides in from right.
 * -- Layout (ADVANCED) --
 *   visible, colorScheme, paddingY, containerWidth
 *
 * DB SCHEMA: location_detail_sections (id, overline, time_label, time_value, location_label, directions_url, directions_label, visible, color_scheme)
 * DB SCHEMA: location_detail_addresses (id, section_id, line, sort_order)
 * DB SCHEMA: location_detail_images (id, section_id, src, alt, sort_order)
 */
"use client";

import SectionContainer from "@/components/shared/SectionContainer";
import OverlineLabel from "@/components/shared/OverlineLabel";
import CTAButton from "@/components/shared/CTAButton";
import AnimateOnScroll from "@/components/shared/AnimateOnScroll";
import { themeTokens } from "@/lib/theme";
import { IconExternalLink } from "@/components/layout/icons";
import type { LocationDetailSectionProps } from "@/lib/types/sections";
import Image from "next/image";

export default function LocationDetailSection(props: {
  settings: LocationDetailSectionProps;
}) {
  const { settings } = props;
  const { content } = settings;
  const t = themeTokens[settings.colorScheme];
  const animate = settings.enableAnimations !== false;

  return (
    <SectionContainer settings={settings}>
      <div className="flex flex-col lg:flex-row gap-12 lg:gap-16 items-start">
        {/* Left column -- info */}
        <AnimateOnScroll animation="fade-left" enabled={animate} className="lg:w-[40%]">
          <OverlineLabel text={content.overline} />

          {/* Time block */}
          <div className="mt-8">
            <p className={`text-h4 ${t.textMuted} mb-2`}>
              {content.timeLabel}
            </p>
            <p className={`text-h2 font-medium ${t.textPrimary} leading-tight`}>
              Every Sunday
              <br />
              @ 11 AM
            </p>
          </div>

          {/* Location block */}
          <div className="mt-8">
            <p className={`text-h4 ${t.textMuted} mb-2`}>
              {content.locationLabel}
            </p>
            <div>
              {content.address.map((line, i) => (
                <p key={i} className={`text-h3 font-medium ${t.textPrimary} leading-snug`}>
                  {line}
                </p>
              ))}
            </div>
          </div>

          {/* Directions CTA */}
          <div className="mt-8">
            <CTAButton
              label={content.directionsLabel}
              href={content.directionsUrl}
              variant="secondary"
              icon={<IconExternalLink className="ml-2 size-4" />}
            />
          </div>
        </AnimateOnScroll>

        {/* Right column -- single image */}
        <AnimateOnScroll animation="fade-right" staggerIndex={1} staggerBaseMs={150} enabled={animate} className="lg:w-[60%]">
          {content.images[0] && (
            <div className="rounded-2xl overflow-hidden relative aspect-[16/10]">
              <Image
                src={content.images[0].src}
                alt={content.images[0].alt}
                fill
                className="object-cover"
                style={{ objectPosition: content.images[0]?.objectPosition }}
              />
            </div>
          )}
        </AnimateOnScroll>
      </div>
    </SectionContainer>
  );
}
