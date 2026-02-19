"use client"

import { useRef, useState, useCallback } from "react"
import { usePathname } from "next/navigation"
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/cms/app-sidebar"
import { TooltipProvider } from "@/components/ui/tooltip"

/**
 * Subpages are routes with a dynamic or "new" segment after the section,
 * e.g. /cms/messages/abc, /cms/events/new. The sidebar auto-collapses on
 * these pages and restores the user's preferred state when navigating back.
 */
function isSubpage(pathname: string) {
  // /cms/section/... → split gives ["", "cms", section, ...rest]
  const parts = pathname.split("/").filter(Boolean)
  // Top-level CMS pages have exactly 2 segments: ["cms", "section"]
  // Subpages have 3+: ["cms", "section", id-or-new, ...]
  // Exception: sections with static sub-routes like /cms/giving/donations
  // are NOT subpages — they're listed nav items. We detect subpages by
  // checking if the third segment looks like an id or "new".
  if (parts.length < 3) return false
  const third = parts[2]
  // "new" is always a subpage; anything else that isn't a known static
  // sub-route is treated as a dynamic [id] subpage
  if (third === "new") return true
  // Known static sub-routes that are NOT subpages:
  const staticSubRoutes = new Set([
    "donations", "payments", "reports",   // /cms/giving/*
    "directory", "members", "groups",     // /cms/people/*
    "pages", "theme", "navigation", "domains", // /cms/website/*
    "series",                             // /cms/messages/series (list page)
  ])
  if (staticSubRoutes.has(third)) return false
  // Everything else (e.g. /cms/events/e1, /cms/messages/m1) is a subpage
  return true
}

function CmsHeader() {
  const { state } = useSidebar()
  const label = state === "expanded" ? "Close sidebar" : "Open sidebar"

  return (
    <header className="flex h-12 shrink-0 items-center gap-2 border-b px-4">
      <div className="group/trigger flex items-center gap-2">
        <SidebarTrigger className="-ml-1" />
        <span className="text-xs text-muted-foreground/0 transition-colors group-hover/trigger:text-muted-foreground">
          {label}
        </span>
      </div>
    </header>
  )
}

export default function CmsLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const onSubpage = isSubpage(pathname)

  // The user's preferred sidebar state for non-subpages (true = expanded).
  const userPrefRef = useRef(true)
  const [open, setOpen] = useState(true)
  // Track the previous subpage state so we only collapse once on entry.
  const wasOnSubpageRef = useRef(false)

  // When entering a subpage, collapse once. When leaving, restore preference.
  if (onSubpage && !wasOnSubpageRef.current) {
    wasOnSubpageRef.current = true
    if (open) setOpen(false)
  } else if (!onSubpage && wasOnSubpageRef.current) {
    wasOnSubpageRef.current = false
    if (open !== userPrefRef.current) setOpen(userPrefRef.current)
  }

  const handleOpenChange = useCallback((value: boolean) => {
    if (!isSubpage(window.location.pathname)) {
      userPrefRef.current = value
    }
    setOpen(value)
  }, [])

  return (
    <TooltipProvider>
      <SidebarProvider open={open} onOpenChange={handleOpenChange}>
        <AppSidebar />
        <SidebarInset>
          <CmsHeader />
          <main className="min-w-0 flex-1 flex flex-col py-5 px-6">{children}</main>
        </SidebarInset>
      </SidebarProvider>
    </TooltipProvider>
  )
}
