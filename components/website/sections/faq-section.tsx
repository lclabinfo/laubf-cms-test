"use client"

import { useState } from "react"
import SectionContainer from "@/components/website/shared/section-container"
import { themeTokens, type SectionTheme } from "@/components/website/shared/theme-tokens"
import { cn } from "@/lib/utils"
import { IconQuestionMark, IconChevronDown } from "@/components/website/shared/icons"

interface FAQItem {
  question: string
  answer: string
}

interface FAQContent {
  heading: string
  showIcon?: boolean
  items: FAQItem[]
}

interface Props {
  content: FAQContent
  enableAnimations: boolean
  colorScheme?: SectionTheme
}

export default function FAQSection({ content, enableAnimations, colorScheme = "light" }: Props) {
  const t = themeTokens[colorScheme]
  const animate = enableAnimations !== false
  const [openIndex, setOpenIndex] = useState<number | null>(null)

  function toggleItem(index: number) {
    setOpenIndex(openIndex === index ? null : index)
  }

  return (
    <SectionContainer colorScheme={colorScheme} containerWidth="narrow">
      {/* Question mark icon circle */}
      <div className={cn(animate && "animate-hero-fade-up")}>
        {content.showIcon && (
          <div className={`w-16 h-16 rounded-full ${t.surfaceBg} border ${t.borderSubtle} flex items-center justify-center mx-auto mb-6`}>
            <IconQuestionMark className={`size-7 ${t.textPrimary}`} />
          </div>
        )}

        {/* Centered heading */}
        <h2 className={`text-h2 ${t.textPrimary} text-center mb-12`}>
          {content.heading}
        </h2>
      </div>

      {/* Accordion items */}
      <div className="flex flex-col gap-3">
        {content.items.map((item, i) => {
          const isOpen = openIndex === i
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
          )
        })}
      </div>
    </SectionContainer>
  )
}
