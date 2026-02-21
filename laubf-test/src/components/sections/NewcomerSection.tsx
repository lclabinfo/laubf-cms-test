/*
 * CMS SETTINGS:
 * -- Content (BASIC) --
 *   heading: string — section heading (e.g. "Are you a newcomer?")
 *   description: string — section description
 *   buttonLabel: string — CTA button text
 *   buttonHref: string — CTA button link
 * -- Layout (ADVANCED) --
 *   visible, colorScheme, paddingY, containerWidth
 *
 * DB SCHEMA: newcomer_sections (id, heading, description, btn_label, btn_href, visible, color_scheme)
 */
"use client";

import Image from "next/image";
import { Users } from "lucide-react";
import SectionContainer from "@/components/shared/SectionContainer";
import CTAButton from "@/components/shared/CTAButton";
import AnimateOnScroll from "@/components/shared/AnimateOnScroll";
import { themeTokens } from "@/lib/theme";
import type { NewcomerSectionProps } from "@/lib/types/sections";

export default function NewcomerSection(props: {
  settings: NewcomerSectionProps;
}) {
  const { settings } = props;
  const { content } = settings;
  const t = themeTokens[settings.colorScheme];
  const animate = settings.enableAnimations !== false;

  return (
    <SectionContainer settings={settings}>
      <div className="flex flex-col items-center gap-16 lg:gap-20">
        <AnimateOnScroll
          animation="fade-up"
          enabled={animate}
          className="flex flex-col items-center gap-10 text-center max-w-[640px] mx-auto"
        >
          {/* Icon + text group */}
          <div className="flex flex-col items-center gap-4 w-full">
            <Users className={`size-12 ${t.textMuted}`} strokeWidth={1.5} />
            <div className="flex flex-col items-center gap-5 w-full">
              <h2 className={`text-h2 ${t.textPrimary}`}>{content.heading}</h2>
              <p className={`text-body-1 ${t.textSecondary}`}>
                {content.description}
              </p>
            </div>
          </div>

          <CTAButton
            label={content.buttonLabel}
            href={content.buttonHref}
            variant="primary"
            theme={settings.colorScheme === "dark" ? "dark" : "light"}
          />
        </AnimateOnScroll>

        {content.image && (
          <AnimateOnScroll animation="fade-up" enabled={animate} className="w-full">
            <div className="relative w-full h-[240px] md:h-[320px] lg:h-[400px] rounded-xl overflow-hidden">
              <Image
                src={content.image.src}
                alt={content.image.alt}
                fill
                className="object-cover"
                style={{ objectPosition: content.image.objectPosition ?? "center" }}
              />
            </div>
          </AnimateOnScroll>
        )}
      </div>
    </SectionContainer>
  );
}
