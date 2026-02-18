"use client"

import { usePathname } from "next/navigation"
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/cms/app-sidebar"
import { TooltipProvider } from "@/components/ui/tooltip"

const pageTitles: Record<string, string> = {
  "/cms/dashboard": "Dashboard",
  "/cms/church-profile": "Church Settings",
  "/cms/messages": "Messages",
  "/cms/events": "Events",
  "/cms/media": "Media",
  "/cms/website/pages": "Pages",
  "/cms/website/navigation": "Navigation",
  "/cms/website/theme": "Theme",
  "/cms/website/domains": "Domains",
  "/cms/app/notifications": "Notifications",
  "/cms/app/announcements": "Announcements",
  "/cms/app/mobile": "Mobile App",
  "/cms/app/integrations": "Integrations",
  "/cms/giving/donations": "Donations",
  "/cms/giving/payments": "Payments",
  "/cms/giving/reports": "Reports",
  "/cms/people/members": "Members",
  "/cms/people/groups": "Groups",
  "/cms/people/directory": "Directory",
}

export default function CmsLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const pageTitle = pageTitles[pathname] ?? ""

  return (
    <TooltipProvider>
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset>
          <header className="flex h-12 shrink-0 items-center gap-2 border-b px-4">
            <SidebarTrigger className="-ml-1" />
            {pageTitle && (
              <h1 className="text-sm font-medium">{pageTitle}</h1>
            )}
          </header>
          <main className="flex-1 p-6">{children}</main>
        </SidebarInset>
      </SidebarProvider>
    </TooltipProvider>
  )
}
