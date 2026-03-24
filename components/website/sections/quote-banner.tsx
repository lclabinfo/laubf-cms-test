import type { ReactNode } from "react"
import SectionContainer from "@/components/website/shared/section-container"
import OverlineLabel from "@/components/website/shared/overline-label"
import AnimateOnScroll from "@/components/website/shared/animate-on-scroll"
import { themeTokens, type SectionTheme } from "@/components/website/shared/theme-tokens"
import { cn } from "@/lib/utils"

/**
 * Converts leading verse numbers (e.g. "16 They are not...") into <sub> elements.
 * Matches numbers at the start of the text or after a space that precede a capital letter.
 */
function formatVerseText(text: string): ReactNode[] {
  // Split on verse numbers: a number followed by a space then a capital letter or quote
  const parts = text.split(/(\b\d{1,3}\s)(?=[A-Z\u201C\u201D"'])/g)
  const result: ReactNode[] = []
  for (let i = 0; i < parts.length; i++) {
    const part = parts[i]
    if (/^\d{1,3}\s$/.test(part)) {
      result.push(
        <sup key={i} className="text-[0.65em] opacity-50 font-medium mr-0.5 align-super">
          {part.trim()}
        </sup>
      )
    } else if (part) {
      result.push(part)
    }
  }
  return result
}

interface QuoteBannerContent {
  overline: string
  heading: string
  verse: { text: string; reference: string }
}

interface Props {
  content: QuoteBannerContent
  enableAnimations: boolean
  colorScheme?: SectionTheme
  paddingY?: "none" | "compact" | "default" | "spacious"
  containerWidth?: "standard" | "narrow" | "full"
}

export default function QuoteBannerSection({ content, enableAnimations, colorScheme = "dark", paddingY, containerWidth }: Props) {
  const animate = enableAnimations !== false
  const t = themeTokens[colorScheme]

  return (
    <SectionContainer
      colorScheme={colorScheme}
      paddingY={paddingY}
      containerWidth={containerWidth ?? "narrow"}
      bgOverride={colorScheme === "dark" ? "bg-gradient-to-b from-black-gradient to-black-1 to-[67%]" : undefined}
    >
      <div className="relative flex flex-col items-center gap-10 text-center overflow-hidden">
        {/* Spotlight beam from top center */}
        <div
          className="absolute top-[-120px] left-1/2 -translate-x-1/2 w-[926px] h-[500px] pointer-events-none"
          style={{
            background:
              "conic-gradient(from 180deg at 50% 0%, transparent 135deg, rgba(250,250,250,0.06) 160deg, rgba(250,250,250,0.12) 175deg, rgba(250,250,250,0.18) 180deg, rgba(250,250,250,0.12) 185deg, rgba(250,250,250,0.06) 200deg, transparent 225deg)",
            maskImage:
              "radial-gradient(ellipse 60% 80% at 50% 0%, black 0%, transparent 100%)",
            WebkitMaskImage:
              "radial-gradient(ellipse 60% 80% at 50% 0%, black 0%, transparent 100%)",
          }}
        />

        {/* Content */}
        <AnimateOnScroll animation="fade-up" enabled={animate} className="relative flex flex-col items-center gap-4 lg:gap-6">
          <OverlineLabel text={content.overline} className={t.textMuted} />
          <h2 className={cn("text-script-heading", t.textPrimary)}>
            {content.heading}
          </h2>
        </AnimateOnScroll>

        <AnimateOnScroll animation="fade-in" staggerIndex={1} staggerBaseMs={200} enabled={animate} className="relative flex flex-col items-center gap-4">
          <p className={cn("text-body-1 max-w-[960px] leading-[1.5]", t.textSecondary)}>
            {formatVerseText(content.verse.text)}
          </p>
          <p className={cn("text-h4", t.textMuted)}>{content.verse.reference}</p>
        </AnimateOnScroll>
      </div>
    </SectionContainer>
  )
}
