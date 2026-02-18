"use client"

import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/cms/app-sidebar"
import { TooltipProvider } from "@/components/ui/tooltip"

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
  return (
    <TooltipProvider>
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset>
          <CmsHeader />
          <main className="min-w-0 flex-1 py-5 px-6">{children}</main>
        </SidebarInset>
      </SidebarProvider>
    </TooltipProvider>
  )
}
