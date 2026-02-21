/*
 * CMS SETTINGS:
 * - visible: boolean — toggles entire section rendering
 * - colorScheme: 'dark' | 'light' — sets theme context for all children
 * - paddingY: 'compact' | 'default' | 'spacious' — vertical spacing preset
 * - containerWidth: 'standard' | 'narrow' | 'full' — content width
 */
"use client";

import { SectionThemeContext, themeTokens } from "@/lib/theme";
import type { BaseSectionSettings } from "@/lib/types/sections";
import { cn } from "@/lib/utils";

const paddingYMap = {
  compact: "py-16 lg:py-20",
  default: "py-24 lg:py-30",
  spacious: "py-32 lg:py-40",
  none: "py-0",
} as const;

interface SectionContainerProps {
  settings: BaseSectionSettings;
  bgOverride?: string;
  children: React.ReactNode;
  className?: string;
  as?: "section" | "footer" | "div";
  containerClassName?: string;
  noContainer?: boolean;
}

export default function SectionContainer({
  settings,
  bgOverride,
  children,
  className,
  as: Tag = "section",
  containerClassName,
  noContainer,
}: SectionContainerProps) {
  if (!settings.visible) return null;

  const theme = settings.colorScheme;
  const tokens = themeTokens[theme];
  const bgClass = bgOverride ?? tokens.bg;
  const paddingClass = paddingYMap[settings.paddingY ?? "default"];

  return (
    <SectionThemeContext.Provider value={theme}>
      <Tag id={settings.id} className={cn(bgClass, paddingClass, className)}>
        {noContainer ? (
          children
        ) : (
          <div
            className={cn(
              settings.containerWidth === "narrow"
                ? "container-narrow"
                : settings.containerWidth === "full"
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
  );
}
