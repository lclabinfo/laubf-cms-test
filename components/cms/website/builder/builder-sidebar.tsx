"use client"

import { Plus, FileText, Palette, Image as ImageIcon, Lock } from "lucide-react"
import { cn } from "@/lib/utils"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import type { BuilderTool } from "./types"
import type { PageType } from "@/lib/db/types"

interface BuilderSidebarProps {
  activeTool: BuilderTool
  onToolClick: (tool: BuilderTool) => void
  pageType: PageType
}

const tools: {
  id: BuilderTool
  icon: typeof Plus
  label: string
  lockedOnTemplates?: boolean
  disabledMessage?: string
}[] = [
  {
    id: "add",
    icon: Plus,
    label: "Add Section",
    lockedOnTemplates: true,
    disabledMessage: "Custom sections cannot be added to this system template.",
  },
  { id: "pages", icon: FileText, label: "Pages & Menu" },
  { id: "design", icon: Palette, label: "Design" },
  { id: "media", icon: ImageIcon, label: "Media" },
]

export function BuilderSidebar({
  activeTool,
  onToolClick,
  pageType,
}: BuilderSidebarProps) {
  const isLockedTemplate = pageType === "MINISTRY" || pageType === "CAMPUS"

  return (
    <div className="w-[60px] bg-background border-r flex flex-col items-center py-4 gap-3 z-30 shrink-0 h-full">
      <TooltipProvider delayDuration={0}>
        {tools.map((tool) => {
          const isDisabled = !!(tool.lockedOnTemplates && isLockedTemplate)
          const Icon = isDisabled && tool.id === "add" ? Lock : tool.icon

          return (
            <Tooltip key={tool.id}>
              <TooltipTrigger asChild>
                <span tabIndex={0} className="outline-none rounded-lg">
                  <button
                    onClick={() =>
                      !isDisabled &&
                      onToolClick(
                        activeTool === tool.id ? null : (tool.id as BuilderTool),
                      )
                    }
                    disabled={isDisabled}
                    className={cn(
                      "w-10 h-10 rounded-lg flex items-center justify-center transition-all duration-200 relative",
                      isDisabled
                        ? "text-muted-foreground/40 cursor-not-allowed bg-muted/30"
                        : activeTool === tool.id
                          ? "bg-blue-50 text-blue-600 shadow-sm"
                          : "text-muted-foreground hover:bg-muted hover:text-foreground",
                    )}
                  >
                    <Icon className="size-5" strokeWidth={1.5} />
                  </button>
                </span>
              </TooltipTrigger>
              <TooltipContent side="right" sideOffset={8}>
                {isDisabled ? (
                  <div className="space-y-1">
                    <p className="font-semibold text-xs uppercase tracking-wider opacity-70">
                      System Template
                    </p>
                    <p className="text-xs">{tool.disabledMessage}</p>
                  </div>
                ) : (
                  <p className="text-xs">{tool.label}</p>
                )}
              </TooltipContent>
            </Tooltip>
          )
        })}
      </TooltipProvider>
    </div>
  )
}
