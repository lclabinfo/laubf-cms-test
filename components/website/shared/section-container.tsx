/*
 * CMS SETTINGS:
 * - visible: boolean -- toggles entire section rendering
 * - colorScheme: 'dark' | 'light' -- sets theme context for all children
 * - paddingY: 'compact' | 'default' | 'spacious' -- vertical spacing preset
 * - containerWidth: 'standard' | 'narrow' | 'full' -- content width
 */
"use client"

import { SectionThemeContext, themeTokens, type SectionTheme } from "./theme-tokens"
import { cn } from "@/lib/utils"

const paddingYMap = {
  compact: "py-16 lg:py-20",
  default: "py-24 lg:py-30",
  spacious: "py-32 lg:py-40",
  none: "py-0",
} as const

interface SectionContainerProps {
  colorScheme: SectionTheme
  paddingY?: "none" | "compact" | "default" | "spacious"
  containerWidth?: "standard" | "narrow" | "full"
  visible?: boolean
  id?: string
  bgOverride?: string
  children: React.ReactNode
  className?: string
  as?: "section" | "footer" | "div"
  containerClassName?: string
  noContainer?: boolean
}

export default function SectionContainer({
  colorScheme,
  paddingY = "default",
  containerWidth = "standard",
  visible = true,
  id,
  bgOverride,
  children,
  className,
  as: Tag = "section",
  containerClassName,
  noContainer,
}: SectionContainerProps) {
  if (!visible) return null

  const tokens = themeTokens[colorScheme]
  const bgClass = bgOverride ?? tokens.bg
  const paddingClass = paddingYMap[paddingY]

  return (
    <SectionThemeContext.Provider value={colorScheme}>
      <Tag id={id} className={cn(bgClass, paddingClass, className)}>
        {noContainer ? (
          children
        ) : (
          <div
            className={cn(
              containerWidth === "narrow"
                ? "container-narrow"
                : containerWidth === "full"
                  ? "w-full"
                  : "container-standard",
              containerClassName
            )}
          >
            {children}
          </div>
        )}
      </Tag>
    </SectionThemeContext.Provider>
  )
}
