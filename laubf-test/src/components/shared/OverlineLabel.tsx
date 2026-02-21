/*
 * CMS SETTINGS:
 * - text: string — overline label text (auto-uppercased via CSS)
 */
"use client";

import { useSectionTheme } from "@/lib/theme";
import type { OverlineLabelProps } from "@/lib/types/shared";
import { cn } from "@/lib/utils";

export default function OverlineLabel({ text, className }: OverlineLabelProps) {
  const tokens = useSectionTheme();

  return (
    <span className={cn("text-overline", tokens.textMuted, className)}>
      {text}
    </span>
  );
}
