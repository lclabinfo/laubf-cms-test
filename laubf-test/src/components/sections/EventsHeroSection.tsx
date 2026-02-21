/*
 * CMS SETTINGS:
 * -- Content (BASIC) --
 *   heading: string -- hero heading (e.g. "Events")
 *   subtitle: string -- supporting text
 * -- Animation (ADVANCED) --
 *   enableAnimations?: boolean (default true) — toggle entry animations
 *     Animations: heading and subtitle fade up on page load.
 * -- Layout (ADVANCED) --
 *   visible, colorScheme, paddingY, containerWidth
 *
 * DB SCHEMA: events_hero_sections (id, heading, subtitle, visible, color_scheme)
 */
"use client";

import SectionContainer from "@/components/shared/SectionContainer";
import { themeTokens } from "@/lib/theme";
import type { EventsHeroSectionProps } from "@/lib/types/sections";
import { cn } from "@/lib/utils";

export default function EventsHeroSection(props: {
  settings: EventsHeroSectionProps;
}) {
  const { settings } = props;
  const { content } = settings;
  const t = themeTokens[settings.colorScheme];
  const animate = settings.enableAnimations !== false;

  return (
    <SectionContainer settings={settings}>
      <div className="flex flex-col items-start">
        <h1 className={cn(`text-h1 ${t.textPrimary}`, animate && "animate-hero-fade-up")}>{content.heading}</h1>
        <p className={cn(`text-body-1 ${t.textSecondary} mt-4 max-w-[600px] text-balance`, animate && "animate-hero-fade-up-delayed")}>
          {content.subtitle}
        </p>
      </div>
    </SectionContainer>
  );
}
