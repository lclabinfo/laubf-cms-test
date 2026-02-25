/*
 * CMS SETTINGS:
 * - heading: string -- section title
 * - subheading: string -- optional description
 * - ctaLabel: string -- link text
 * - ctaHref: string -- link destination
 * - showCta: boolean -- show/hide CTA link
 */
"use client"

import { useSectionTheme } from "@/components/website/shared/theme-tokens"
import { cn } from "@/lib/utils"
import CTAButton from "./cta-button"

interface SectionHeaderProps {
  heading: string
  subheading?: string
  ctaLabel?: string
  ctaHref?: string
  showCta?: boolean
  className?: string
}

export default function SectionHeader({
  heading,
  subheading,
  ctaLabel,
  ctaHref,
  showCta = true,
  className,
}: SectionHeaderProps) {
  const tokens = useSectionTheme()

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
  )
}
