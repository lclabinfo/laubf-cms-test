/*
 * CMS SETTINGS:
 * -- Content (BASIC) --
 *   heading: string — section heading (e.g. 'What is "UBF"?')
 *   acronymLines: string[] — stacked words (e.g. ["University", "Bible", "Fellowship"])
 *   description: string — paragraph describing the acronym
 * -- Button (BASIC) --
 *   button: { label, href, visible }
 * -- Animation (ADVANCED) --
 *   enableAnimations?: boolean (default true) — toggle scroll-reveal animations
 *     Animations: heading fades up, acronym letters stagger in, description fades in.
 * -- Layout (ADVANCED) --
 *   visible, colorScheme, paddingY, containerWidth
 *
 * DB SCHEMA: feature_breakdown_sections (id, heading, description, btn_label, btn_href, btn_visible, visible, color_scheme)
 * DB SCHEMA: feature_breakdown_acronym_lines (id, section_id, text, sort_order)
 */
"use client";

import SectionContainer from "@/components/shared/SectionContainer";
import CTAButton from "@/components/shared/CTAButton";
import AnimateOnScroll from "@/components/shared/AnimateOnScroll";
import { themeTokens } from "@/lib/theme";
import type { FeatureBreakdownSectionProps } from "@/lib/types/sections";
import Image from "next/image";

export default function FeatureBreakdownSection(props: {
  settings: FeatureBreakdownSectionProps;
}) {
  const { settings } = props;
  const { content } = settings;
  const t = themeTokens[settings.colorScheme];
  const animate = settings.enableAnimations !== false;

  return (
    <SectionContainer settings={settings} bgOverride="bg-brand-2" className="relative overflow-hidden !py-14 lg:!py-30">
      {/* Background watermark logo */}
      <div className="absolute right-0 top-1/2 -translate-y-1/2 opacity-[0.08] pointer-events-none">
        <Image
          src="/logo/laubf-logo-blue.svg"
          alt=""
          width={400}
          height={400}
          className="object-contain"
          aria-hidden="true"
        />
      </div>

      <div className="relative z-10 flex flex-col gap-4 lg:gap-0 mx-auto w-[80%] sm:w-full">
        {/* Heading */}
        <AnimateOnScroll animation="fade-up" enabled={animate}>
          <h2 className={`text-h2 ${t.textPrimary} mb-2 lg:mb-10`}>{content.heading}</h2>
        </AnimateOnScroll>

        <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:gap-16">
          {/* Left column — stacked acronym words with first-letter highlight */}
          <div className="flex flex-col gap-1 lg:w-[35%] shrink-0">
            {content.acronymLines.map((line, i) => (
              <span
                key={i}
                className="text-h2 lg:text-h1 leading-tight"
              >
                <span className={t.textPrimary}>{line.charAt(0)}</span>
                <span className={t.textMuted}>{line.slice(1)}</span>
              </span>
            ))}
          </div>

          {/* Right column — description + CTA */}
          <AnimateOnScroll animation="fade-right" enabled={animate} className="flex flex-col gap-8 lg:w-[65%]">
            <p className={`text-body-1 ${t.textSecondary} leading-relaxed`}>
              {content.description}
            </p>

            {content.button.visible && (
              <CTAButton
                label={content.button.label}
                href={content.button.href}
                variant="primary"
                className="self-start"
              />
            )}
          </AnimateOnScroll>
        </div>
      </div>
    </SectionContainer>
  );
}
