"use client"

import SectionContainer from "@/components/website/shared/section-container"
import type { SectionTheme } from "@/components/website/shared/theme-tokens"

interface CustomEmbedContent {
  embedUrl: string
  title?: string
  aspectRatio?: string
}

interface Props {
  content: CustomEmbedContent
  enableAnimations: boolean
  colorScheme?: SectionTheme
  paddingY?: "none" | "compact" | "default" | "spacious"
  containerWidth?: "standard" | "narrow" | "full"
}

export default function CustomEmbedSection({ content, colorScheme = "light", paddingY, containerWidth }: Props) {
  return (
    <SectionContainer colorScheme={colorScheme} paddingY={paddingY} containerWidth={containerWidth}>
      <div className="relative w-full" style={{ aspectRatio: content.aspectRatio ?? "16/9" }}>
        <iframe
          src={content.embedUrl}
          title={content.title ?? "Embedded content"}
          className="w-full h-full rounded-2xl"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      </div>
    </SectionContainer>
  )
}
