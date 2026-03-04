"use client"

import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/cms/app-sidebar"
import { TooltipProvider } from "@/components/ui/tooltip"

export type CmsSessionData = {
  user: {
    id: string
    name: string
    email: string
    image: string | null
  }
  churchName: string
  churchSlug: string
  role: string
}

function CmsHeader() {
  const { state } = useSidebar()
  const label = state === "expanded" ? "Close sidebar" : "Open sidebar"

  return (
    <header className="flex h-12 shrink-0 items-center gap-2 border-b bg-background px-4">
      <div className="group/trigger flex items-center gap-2">
        <SidebarTrigger className="-ml-1" />
        <span className="text-xs text-muted-foreground/0 transition-colors group-hover/trigger:text-muted-foreground">
          {label}
        </span>
      </div>
    </header>
  )
}

export function CmsShell({ session, children }: { session: CmsSessionData; children: React.ReactNode }) {
  return (
    <TooltipProvider>
      <SidebarProvider className="h-svh">
        <AppSidebar session={session} />
        <SidebarInset className="overflow-hidden">
          <CmsHeader />
          <main className="min-w-0 min-h-0 flex-1 flex flex-col overflow-y-auto overflow-x-hidden pb-5 px-6">{children}</main>
        </SidebarInset>
      </SidebarProvider>
    </TooltipProvider>
  )
}
