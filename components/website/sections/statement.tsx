"use client"

import { useRef, useState, useEffect, useCallback } from "react"
import { motion } from "motion/react"
import SectionContainer from "@/components/website/shared/section-container"
import { themeTokens, type SectionTheme } from "@/components/website/shared/theme-tokens"

const STICKY_TOP = 180

interface StatementParagraph {
  text: string
  isBold?: boolean
}

function StatementContent({
  leadIn,
  paragraphs,
  colorScheme,
}: {
  leadIn: string
  paragraphs: StatementParagraph[]
  colorScheme: string
}) {
  const [activeIndex, setActiveIndex] = useState(0)
  const containerRef = useRef<HTMLDivElement>(null)

  const activeColor = colorScheme === "dark" ? "#fafafa" : "#0d0d0d"
  const mutedColor = colorScheme === "dark" ? "#9e9e9e" : "#9e9e9e"

  const handleScroll = useCallback(() => {
    if (!containerRef.current) return

    const items = containerRef.current.querySelectorAll("[data-stmt-index]")
    if (items.length === 0) return

    let closestIndex = 0
    let closestDistance = Infinity

    items.forEach((item) => {
      const index = Number(item.getAttribute("data-stmt-index"))
      const rect = item.getBoundingClientRect()

      if (rect.bottom > 0 && rect.top < window.innerHeight) {
        const distance = Math.abs(rect.top - STICKY_TOP)

        if (
          distance < closestDistance ||
          (distance === closestDistance && rect.top >= STICKY_TOP)
        ) {
          closestDistance = distance
          closestIndex = index
        }
      }
    })

    setActiveIndex(closestIndex)
  }, [])

  useEffect(() => {
    handleScroll()
    window.addEventListener("scroll", handleScroll, { passive: true })
    return () => window.removeEventListener("scroll", handleScroll)
  }, [handleScroll])

  return (
    <div className="flex flex-col lg:flex-row gap-8 lg:gap-12">
      {/* Left column — sticky lead-in */}
      <div className="lg:w-[320px] shrink-0 lg:sticky lg:top-[180px] lg:self-start">
        <h3 className="text-h2 text-black-1">
          {leadIn}
        </h3>
      </div>

      {/* Right column — scrollable statements */}
      <div ref={containerRef} className="flex-1 flex flex-col gap-10">
        {paragraphs.map((para, i) => (
          <motion.p
            key={i}
            data-stmt-index={i}
            animate={{ color: i === activeIndex ? activeColor : mutedColor }}
            transition={{ duration: 0.3 }}
            className="text-h3 leading-[1.2]"
          >
            {para.text}
          </motion.p>
        ))}
      </div>
    </div>
  )
}

interface StatementContent_ {
  overline: string
  heading: string
  leadIn: string
  showIcon?: boolean
  paragraphs: StatementParagraph[]
}

interface Props {
  content: StatementContent_
  enableAnimations: boolean
  colorScheme?: SectionTheme
}

export default function StatementSection({ content, enableAnimations, colorScheme = "light" }: Props) {
  const t = themeTokens[colorScheme]

  return (
    <SectionContainer colorScheme={colorScheme}>
      {/* Header — centered */}
      <div className="flex flex-col items-center text-center mb-16 lg:mb-20">
        {content.showIcon && (
          <div
            className="mb-6 w-[67px] h-[92px] bg-black-3 opacity-85"
            role="img"
            aria-hidden="true"
            style={{
              maskImage: "url(/images/compressed/compressed-cross.png)",
              maskSize: "contain",
              maskRepeat: "no-repeat",
              maskPosition: "center",
              WebkitMaskImage: "url(/images/compressed/compressed-cross.png)",
              WebkitMaskSize: "contain",
              WebkitMaskRepeat: "no-repeat",
              WebkitMaskPosition: "center",
            }}
          />
        )}
        <p className={`text-h4 ${t.textMuted} mb-2`}>{content.overline}</p>
        <h2 className={`text-h2 ${t.textPrimary}`}>{content.heading}</h2>
      </div>

      {/* Two-column scroll-tracked content */}
      <StatementContent
        leadIn={content.leadIn}
        paragraphs={content.paragraphs}
        colorScheme={colorScheme}
      />
    </SectionContainer>
  )
}
