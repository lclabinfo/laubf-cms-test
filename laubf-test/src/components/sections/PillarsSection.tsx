/*
 * CMS SETTINGS:
 * -- Content (BASIC) --
 *   overline: string -- label above heading (e.g. "WHAT WE DO")
 *   heading: string -- section heading (e.g. "The 3 Pillars of LA UBF")
 * -- Pillar Items (BASIC) --
 *   items[]: { title, description, images[], button? }
 *   Layout alternates: odd items = image left / text right, even = text left / image right
 *   Text alignment mirrors layout: odd = left-aligned, even = right-aligned
 * -- Animation (ADVANCED) --
 *   enableAnimations?: boolean (default true) — toggle scroll-reveal animations
 *     Animations: header fades up, pillar items alternate slide-in from left/right.
 * -- Layout (ADVANCED) --
 *   visible, colorScheme, paddingY, containerWidth
 *
 * DB SCHEMA: pillar_sections (id, overline, heading, visible, color_scheme)
 * DB SCHEMA: pillar_items (id, section_id, title, description, btn_label, btn_href, sort_order)
 * DB SCHEMA: pillar_images (id, item_id, src, alt, sort_order)
 */
"use client";

import SectionContainer from "@/components/shared/SectionContainer";
import OverlineLabel from "@/components/shared/OverlineLabel";
import CTAButton from "@/components/shared/CTAButton";
import AnimateOnScroll from "@/components/shared/AnimateOnScroll";
import { themeTokens } from "@/lib/theme";
import type { PillarsSectionProps, PillarItem } from "@/lib/types/sections";
import Image from "next/image";

function PillarImageCollage({ images }: { images: PillarItem["images"] }) {
  if (images.length === 0) return null;

  /* Single image fallback */
  if (images.length === 1) {
    return (
      <div className="relative w-full aspect-[672/400] rounded-2xl overflow-hidden">
        <Image src={images[0].src} alt={images[0].alt} fill className="object-cover" style={{ objectPosition: images[0].objectPosition }} />
      </div>
    );
  }

  /* Multi-image collage — main image fills left 60%, stacked images on right 40% */
  return (
    <div className="relative w-full aspect-[672/400] rounded-2xl overflow-hidden">
      <div className="absolute inset-0 grid grid-cols-5 grid-rows-2 gap-1.5">
        {/* Main image — spans left 3 cols and full height */}
        <div className="col-span-3 row-span-2 relative">
          <Image src={images[0].src} alt={images[0].alt} fill className="object-cover" style={{ objectPosition: images[0].objectPosition }} />
        </div>

        {/* Top-right image */}
        {images[1] && (
          <div className="col-span-2 relative">
            <Image src={images[1].src} alt={images[1].alt} fill className="object-cover" style={{ objectPosition: images[1].objectPosition }} />
          </div>
        )}

        {/* Bottom-right image */}
        {images[2] && (
          <div className="col-span-2 relative">
            <Image src={images[2].src} alt={images[2].alt} fill className="object-cover" style={{ objectPosition: images[2].objectPosition }} />
          </div>
        )}
      </div>
    </div>
  );
}

export default function PillarsSection(props: {
  settings: PillarsSectionProps;
}) {
  const { settings } = props;
  const { content } = settings;
  const t = themeTokens[settings.colorScheme];
  const animate = settings.enableAnimations !== false;

  return (
    <SectionContainer settings={settings}>
      {/* Section header */}
      <AnimateOnScroll animation="fade-up" enabled={animate} className="mb-12 lg:mb-16">
        <OverlineLabel text={content.overline} />
        <h2 className={`text-h2 ${t.textPrimary} mt-3`}>{content.heading}</h2>
      </AnimateOnScroll>

      {/* Pillar items — alternating layout */}
      <div className="flex flex-col gap-12 lg:gap-12">
        {content.items.map((item, i) => {
          const isReversed = i % 2 !== 0;

          return (
            <AnimateOnScroll
              key={i}
              animation={isReversed ? "fade-left" : "fade-right"}
              staggerIndex={i}
              staggerBaseMs={100}
              enabled={animate}
              className={`flex flex-col lg:flex-row gap-8 lg:gap-12 items-center ${
                isReversed ? "lg:flex-row-reverse" : ""
              }`}
            >
              {/* Image collage — 56% width on desktop */}
              <div className="w-full lg:w-[56%] shrink-0">
                <PillarImageCollage images={item.images} />
              </div>

              {/* Text content — 44% width on desktop */}
              <div
                className={`w-full lg:w-[44%] flex flex-col justify-center ${
                  isReversed ? "lg:items-end lg:text-right" : ""
                }`}
              >
                <div className={isReversed ? "max-w-[480px]" : "max-w-[480px]"}>
                  <h3 className={`text-h3 ${t.textPrimary} mb-3`}>{item.title}</h3>
                  <p className={`text-body-2 ${t.textPrimary} leading-relaxed`}>
                    {item.description}
                  </p>
                </div>
                {item.button && (
                  <div className="mt-6">
                    <CTAButton
                      label={item.button.label}
                      href={item.button.href}
                      variant="secondary"
                    />
                  </div>
                )}
              </div>
            </AnimateOnScroll>
          );
        })}
      </div>
    </SectionContainer>
  );
}
