/*
 * CMS SETTINGS:
 * -- Content (BASIC) --
 *   heading: string — section heading
 *   description: string — section description
 * -- Cards (BASIC) --
 *   cards[]: { icon, title, description, buttonLabel, buttonHref, buttonVariant }
 * -- Animation (ADVANCED) --
 *   enableAnimations?: boolean (default true) — toggle scroll-reveal animations
 *     Animations: header fades up, pathway cards stagger in.
 * -- Layout (ADVANCED) --
 *   visible, colorScheme, paddingY, containerWidth
 *
 * DB SCHEMA: pathway_card_sections (id, heading, description, visible, color_scheme)
 * DB SCHEMA: pathway_card_items (id, section_id, icon, title, description, btn_label, btn_href, btn_variant, sort_order)
 */
"use client";

import SectionContainer from "@/components/shared/SectionContainer";
import CTAButton from "@/components/shared/CTAButton";
import AnimateOnScroll from "@/components/shared/AnimateOnScroll";
import { themeTokens } from "@/lib/theme";
import type { PathwayCardSectionProps } from "@/lib/types/sections";
import {
  IconBookOpen,
  IconGraduationCap,
  IconCalendar,
  IconArrowRight,
} from "@/components/layout/icons";
import type { ComponentType, SVGProps } from "react";

type IconComponent = ComponentType<SVGProps<SVGSVGElement>>;

const iconMap: Record<string, IconComponent> = {
  "book-open": IconBookOpen,
  "graduation-cap": IconGraduationCap,
  calendar: IconCalendar,
};

export default function PathwayCardSection(props: {
  settings: PathwayCardSectionProps;
}) {
  const { settings } = props;
  const { content } = settings;
  const t = themeTokens[settings.colorScheme];
  const animate = settings.enableAnimations !== false;

  return (
    <SectionContainer settings={settings}>
      <div className="flex flex-col items-center gap-16">
        {/* Section header */}
        <AnimateOnScroll animation="fade-up" enabled={animate} className="flex flex-col items-center gap-5 text-center max-w-3xl mx-auto">
          <h2 className={`text-h2 ${t.textPrimary}`}>{content.heading}</h2>
          <p className={`text-body-1 ${t.textSecondary}`}>{content.description}</p>
        </AnimateOnScroll>

        {/* Cards grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10 lg:gap-14 w-full">
          {content.cards.map((card, i) => {
            const Icon = iconMap[card.icon];

            return (
              <AnimateOnScroll
                key={i}
                animation="fade-up"
                staggerIndex={i}
                staggerBaseMs={120}
                enabled={animate}
                className="flex flex-col items-center text-center gap-5"
              >
                {/* Icon */}
                {Icon && (
                  <div className="flex items-center justify-center w-10 h-10">
                    <Icon className={`w-10 h-10 ${t.textPrimary}`} />
                  </div>
                )}

                {/* Title */}
                <h3 className={`text-h3 font-medium ${t.textPrimary}`}>
                  {card.title}
                </h3>

                {/* Description */}
                <p className={`text-body-2 ${t.textSecondary}`}>{card.description}</p>

                {/* CTA button */}
                <div className="mt-auto pt-3">
                  <CTAButton
                    label={card.buttonLabel}
                    href={card.buttonHref}
                    variant={card.buttonVariant}
                    icon={
                      card.buttonVariant === "secondary" ? (
                        <IconArrowRight className="ml-2 size-4" />
                      ) : undefined
                    }
                  />
                </div>
              </AnimateOnScroll>
            );
          })}
        </div>
      </div>
    </SectionContainer>
  );
}
