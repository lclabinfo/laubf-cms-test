"use client"

import { useState } from "react"
import { ChevronRight } from "lucide-react"
import { cn } from "@/lib/utils"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"

export interface EditorSectionProps {
  /** Section title shown in the header */
  title: string
  /** Whether this section starts open */
  defaultOpen?: boolean
  /** Optional icon to show before the title */
  icon?: React.ReactNode
  /** Content inside the collapsible section */
  children: React.ReactNode
}

/**
 * Collapsible group for organizing editor fields into logical sections.
 * Used to implement the Content / Layout / Style / Advanced drawer pattern.
 *
 * - Content: always rendered directly (no EditorSection wrapper needed)
 * - Layout, Style, Advanced: wrapped in EditorSection with defaultOpen=false
 */
export function EditorSection({
  title,
  defaultOpen = false,
  icon,
  children,
}: EditorSectionProps) {
  const [open, setOpen] = useState(defaultOpen)

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <CollapsibleTrigger asChild>
        <button
          type="button"
          className={cn(
            "flex w-full items-center gap-2 py-2.5 text-left transition-colors",
            "text-xs font-semibold uppercase tracking-wider",
            open
              ? "text-foreground"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          <ChevronRight
            className={cn(
              "size-3.5 shrink-0 transition-transform duration-200",
              open && "rotate-90"
            )}
          />
          {icon && <span className="shrink-0">{icon}</span>}
          <span>{title}</span>
        </button>
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div className="space-y-6 pb-2 pt-1">{children}</div>
      </CollapsibleContent>
    </Collapsible>
  )
}
