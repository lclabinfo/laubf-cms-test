"use client"

import { useSectionTheme } from "./theme-tokens"
import { cn } from "@/lib/utils"

interface OverlineLabelProps {
  text: string
  className?: string
}

export default function OverlineLabel({ text, className }: OverlineLabelProps) {
  const tokens = useSectionTheme()

  return (
    <span className={cn("text-overline", tokens.textMuted, className)}>
      {text}
    </span>
  )
}
