"use client"

import SectionContainer from "@/components/website/shared/section-container"
import type { SectionTheme } from "@/components/website/shared/theme-tokens"

interface CustomHtmlContent {
  html: string
}

interface Props {
  content: CustomHtmlContent
  enableAnimations: boolean
  colorScheme?: SectionTheme
  paddingY?: "none" | "compact" | "default" | "spacious"
  containerWidth?: "standard" | "narrow" | "full"
}

export default function CustomHtmlSection({ content, colorScheme = "light", paddingY, containerWidth }: Props) {
  return (
    <SectionContainer colorScheme={colorScheme} paddingY={paddingY} containerWidth={containerWidth}>
      <div dangerouslySetInnerHTML={{ __html: content.html }} />
    </SectionContainer>
  )
}
