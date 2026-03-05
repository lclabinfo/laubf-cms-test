/*
 * BibleCopyright -- Displays the legally required copyright notice for a Bible version.
 *
 * Usage:
 *   <BibleCopyright versionCode="ESV" />
 *   <BibleCopyright versionCode="NIV" variant="inline" />
 *
 * Variants:
 *   "block"  (default) -- Full copyright notice in a subtle, muted text block.
 *                          Use at the bottom of any page/section that renders Bible text.
 *   "inline" -- Short inline attribution (e.g., "(NIV)") for use after a quoted verse.
 *
 * The full notice text comes from the centralized BIBLE_COPYRIGHT_INFO registry
 * in lib/bible-versions.ts, sourced from each publisher's official permissions page.
 */

import { cn } from "@/lib/utils"
import { getBibleCopyright } from "@/lib/bible-versions"

interface BibleCopyrightProps {
  /** The Bible version code (e.g., "ESV", "NIV", "KJV") */
  versionCode: string
  /** Display variant: "block" for full notice, "inline" for short attribution */
  variant?: "block" | "inline"
  /** Additional CSS classes */
  className?: string
}

export default function BibleCopyright({
  versionCode,
  variant = "block",
  className,
}: BibleCopyrightProps) {
  const copyright = getBibleCopyright(versionCode)

  if (variant === "inline") {
    return (
      <span className={cn("text-inherit", className)}>
        {copyright.inlineAttribution}
      </span>
    )
  }

  return (
    <p
      className={cn(
        "text-[11px] leading-relaxed text-black-3 max-w-2xl",
        className
      )}
    >
      {copyright.fullNotice}
    </p>
  )
}
