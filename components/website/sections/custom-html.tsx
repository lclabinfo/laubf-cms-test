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
}

export default function CustomHtmlSection({ content, colorScheme = "light" }: Props) {
  return (
    <SectionContainer colorScheme={colorScheme}>
      <div dangerouslySetInnerHTML={{ __html: content.html }} />
    </SectionContainer>
  )
}
