"use client"

import { X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import type { BuilderTool } from "./types"

interface BuilderDrawerProps {
  activeTool: BuilderTool
  title: string
  onClose: () => void
  children?: React.ReactNode
}

export function BuilderDrawer({
  activeTool,
  title,
  onClose,
  children,
}: BuilderDrawerProps) {
  return (
    <div
      className={cn(
        "bg-background border-r flex flex-col shrink-0 overflow-hidden transition-all duration-300 ease-in-out",
        activeTool ? "w-[320px] opacity-100" : "w-0 opacity-0",
      )}
    >
      {activeTool && (
        <>
          {/* Header */}
          <div className="h-14 border-b flex items-center justify-between px-4 bg-muted/30 shrink-0">
            <h3 className="font-semibold text-xs uppercase tracking-wider text-foreground">
              {title}
            </h3>
            <Button
              variant="ghost"
              size="icon-xs"
              className="rounded-full text-muted-foreground"
              onClick={onClose}
            >
              <X className="size-3.5" />
            </Button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto overflow-x-hidden">
            {children ?? (
              <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
                <p>Coming soon</p>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}
