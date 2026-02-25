"use client"

import { useRouter } from "next/navigation"
import {
  ArrowLeft,
  Monitor,
  Tablet,
  Smartphone,
  Save,
  Globe,
  GlobeLock,
  Loader2,
  Undo2,
  Redo2,
  Check,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"
import type { DeviceMode, BuilderPage, PageSummary } from "./types"

interface BuilderTopbarProps {
  page: BuilderPage
  allPages: PageSummary[]
  deviceMode: DeviceMode
  onDeviceChange: (mode: DeviceMode) => void
  onSave: () => void
  onPublishToggle: () => void
  onTitleChange: (title: string) => void
  onUndo: () => void
  onRedo: () => void
  canUndo: boolean
  canRedo: boolean
  isDirty: boolean
  isSaving: boolean
  saveState: "idle" | "saving" | "saved"
}

const deviceOptions: { mode: DeviceMode; icon: typeof Monitor; label: string }[] = [
  { mode: "desktop", icon: Monitor, label: "Desktop" },
  { mode: "tablet", icon: Tablet, label: "Tablet" },
  { mode: "mobile", icon: Smartphone, label: "Mobile" },
]

export function BuilderTopbar({
  page,
  allPages,
  deviceMode,
  onDeviceChange,
  onSave,
  onPublishToggle,
  onUndo,
  onRedo,
  canUndo,
  canRedo,
  isDirty,
  isSaving,
  saveState,
}: BuilderTopbarProps) {
  const router = useRouter()

  return (
    <div className="h-14 border-b bg-background flex items-center justify-between px-4 shrink-0 z-40">
      {/* Left section: Back + Page title */}
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={() => router.push("/cms/website/pages")}
          className="text-muted-foreground"
        >
          <ArrowLeft className="size-4" />
        </Button>

        <div className="h-5 w-px bg-border" />

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="font-medium text-sm gap-1.5">
              {page.title}
              {page.isHomepage && (
                <span className="text-[10px] font-medium bg-amber-500/15 text-amber-600 dark:bg-amber-500/20 dark:text-amber-400 px-1.5 py-0.5 rounded-full">
                  Home
                </span>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-56">
            {allPages.map((p) => (
              <DropdownMenuItem
                key={p.id}
                onClick={() => {
                  if (p.id !== page.id) {
                    router.push(`/cms/website/builder/${p.id}`)
                  }
                }}
                className={cn(
                  p.id === page.id && "bg-accent font-medium",
                )}
              >
                <span className="flex-1 truncate">{p.title}</span>
                {p.isHomepage && (
                  <span className="text-[10px] font-medium bg-amber-500/15 text-amber-600 dark:bg-amber-500/20 dark:text-amber-400 px-1.5 py-0.5 rounded-full ml-2">
                    Home
                  </span>
                )}
                {!p.isPublished && (
                  <span className="text-[10px] font-medium bg-muted text-muted-foreground px-1.5 py-0.5 rounded-full ml-1">
                    Draft
                  </span>
                )}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Center: Undo/Redo + Device preview toggle */}
      <div className="flex items-center gap-2">
        <TooltipProvider>
          <div className="flex items-center gap-0.5">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={onUndo}
                  disabled={!canUndo}
                  className="text-muted-foreground disabled:opacity-30"
                >
                  <Undo2 className="size-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom" sideOffset={4}>
                Undo (Ctrl+Z)
              </TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={onRedo}
                  disabled={!canRedo}
                  className="text-muted-foreground disabled:opacity-30"
                >
                  <Redo2 className="size-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom" sideOffset={4}>
                Redo (Ctrl+Shift+Z)
              </TooltipContent>
            </Tooltip>
          </div>
        </TooltipProvider>

        <div className="h-5 w-px bg-border" />

        <div className="flex items-center gap-1 bg-muted rounded-lg p-1">
          {deviceOptions.map(({ mode, icon: Icon, label }) => (
            <Button
              key={mode}
              variant="ghost"
              size="icon-sm"
              onClick={() => onDeviceChange(mode)}
              className={cn(
                "rounded-md transition-all",
                deviceMode === mode
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground",
              )}
              title={label}
            >
              <Icon className="size-4" />
            </Button>
          ))}
        </div>
      </div>

      {/* Right: Save + Publish */}
      <div className="flex items-center gap-2">
        {isDirty && saveState === "idle" && (
          <span className="text-xs text-amber-600 font-medium mr-1">
            Unsaved changes
          </span>
        )}

        <Button
          variant={isDirty && saveState === "idle" ? "default" : "outline"}
          size="sm"
          onClick={onSave}
          disabled={isSaving || !isDirty}
          className={cn("gap-1.5 relative transition-all")}
        >
          {saveState === "saving" ? (
            <Loader2 className="size-3.5 animate-spin" />
          ) : saveState === "saved" ? (
            <Check className="size-3.5 text-green-500" />
          ) : (
            <span className="relative inline-flex">
              <Save className="size-3.5" />
              {isDirty && (
                <span className="absolute -top-1 -right-1 size-2 rounded-full bg-amber-500" />
              )}
            </span>
          )}
          {saveState === "saving"
            ? "Saving..."
            : saveState === "saved"
              ? "Saved"
              : "Save"}
        </Button>

        <Button
          variant={page.isPublished ? "outline" : "default"}
          size="sm"
          onClick={onPublishToggle}
          className="gap-1.5"
        >
          {page.isPublished ? (
            <>
              <GlobeLock className="size-3.5" />
              Unpublish
            </>
          ) : (
            <>
              <Globe className="size-3.5" />
              Publish
            </>
          )}
        </Button>
      </div>
    </div>
  )
}
