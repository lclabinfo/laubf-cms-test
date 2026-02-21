/*
 * CMS SETTINGS:
 * -- Content (BASIC) --
 *   heading: string -- section heading (Helvetica Neue Medium)
 *   showIcon: boolean -- toggles question mark icon circle above heading
 * -- FAQ Items (BASIC) --
 *   items[]: { question, answer }
 * -- Animation (ADVANCED) --
 *   enableAnimations?: boolean (default true) — toggle scroll-reveal animations
 *     Animations: icon + heading fade up, accordion items stagger in.
 * -- Layout (ADVANCED) --
 *   visible, colorScheme, paddingY, containerWidth
 *
 * DB SCHEMA: faq_sections (id, heading, show_icon, visible, color_scheme)
 * DB SCHEMA: faq_items (id, section_id, question, answer, sort_order)
 */
"use client";

import { useState } from "react";
import SectionContainer from "@/components/shared/SectionContainer";
import AnimateOnScroll from "@/components/shared/AnimateOnScroll";
import { themeTokens } from "@/lib/theme";
import type { FAQSectionProps } from "@/lib/types/sections";
import { cn } from "@/lib/utils";
import { IconQuestionMark, IconChevronDown } from "@/components/layout/icons";

export default function FAQSection(props: {
  settings: FAQSectionProps;
}) {
  const { settings } = props;
  const { content } = settings;
  const t = themeTokens[settings.colorScheme];
  const animate = settings.enableAnimations !== false;
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  function toggleItem(index: number) {
    setOpenIndex(openIndex === index ? null : index);
  }

  return (
    <SectionContainer
      settings={{
        ...settings,
        containerWidth: "narrow",
      }}
    >
      {/* Question mark icon circle */}
      <AnimateOnScroll animation="scale-up" enabled={animate}>
        {content.showIcon && (
          <div className={`w-16 h-16 rounded-full ${t.surfaceBg} border ${t.borderSubtle} flex items-center justify-center mx-auto mb-6`}>
            <IconQuestionMark className={`size-7 ${t.textPrimary}`} />
          </div>
        )}

        {/* Centered heading */}
        <h2 className={`text-h2 ${t.textPrimary} text-center mb-12`}>
          {content.heading}
        </h2>
      </AnimateOnScroll>

      {/* Accordion items */}
      <div className="flex flex-col gap-3">
        {content.items.map((item, i) => {
          const isOpen = openIndex === i;
          return (
            <div
              key={i}
              className={cn(
                `border ${t.borderSubtle} rounded-[16px] overflow-hidden transition-colors`,
                isOpen && t.surfaceBg
              )}
            >
              {/* Question button */}
              <button
                type="button"
                onClick={() => toggleItem(i)}
                className="w-full flex items-center justify-between px-8 py-5 text-left"
                aria-expanded={isOpen}
              >
                <span className={`text-body-1 font-medium ${t.textPrimary} pr-4`}>
                  {item.question}
                </span>
                <IconChevronDown
                  className={cn(
                    `size-5 ${t.textMuted} shrink-0 transition-transform duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]`,
                    isOpen && "rotate-180"
                  )}
                />
              </button>

              {/* Answer — animated with CSS grid */}
              <div
                className="grid transition-[grid-template-rows] duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]"
                style={{
                  gridTemplateRows: isOpen ? "1fr" : "0fr",
                }}
              >
                <div className="overflow-hidden">
                  <div className="px-8 pb-5">
                    <p className={`text-body-2 ${t.textSecondary} leading-relaxed`}>
                      {item.answer}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </SectionContainer>
  );
}
