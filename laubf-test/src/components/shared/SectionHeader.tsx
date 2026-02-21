/*
 * CMS SETTINGS:
 * - heading: string — section title
 * - subheading: string — optional description
 * - ctaLabel: string — link text
 * - ctaHref: string — link destination
 * - showCta: boolean — show/hide CTA link
 */
"use client";

import { useSectionTheme } from "@/lib/theme";
import type { SectionHeaderProps } from "@/lib/types/shared";
import { cn } from "@/lib/utils";
import CTAButton from "./CTAButton";

export default function SectionHeader({
  heading,
  subheading,
  ctaLabel,
  ctaHref,
  showCta = true,
  className,
}: SectionHeaderProps) {
  const tokens = useSectionTheme();

  return (
    <div className={cn("flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between", className)}>
      <div className="flex flex-col gap-2">
        <h2 className={cn("text-h2", tokens.textPrimary)}>{heading}</h2>
        {subheading && (
          <p className={cn("text-body-1", tokens.textSecondary)}>
            {subheading}
          </p>
        )}
      </div>
      {showCta && ctaLabel && ctaHref && (
        <CTAButton
          label={ctaLabel}
          href={ctaHref}
          variant="secondary"
          size="default"
          className="shrink-0 self-start lg:self-center"
        />
      )}
    </div>
  );
}
