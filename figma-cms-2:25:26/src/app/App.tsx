"use client";

import { useState, useEffect } from "react"
import { AppSidebar } from "./components/layout/AppSidebar"
import { ChurchModule } from "./components/modules/ChurchModule"
import { WebsiteModule } from "./components/modules/WebsiteModule"
import { PeopleModule } from "./components/modules/PeopleModule"
import { DashboardPage } from "./components/modules/dashboard/DashboardPage"
import {
  SidebarProvider,
  SidebarInset,
} from "./components/ui/sidebar"
import { Toaster } from "@/app/components/ui/sonner"

export default function App() {
  const [activeModule, setActiveModule] = useState("dashboard") // Default to Dashboard
  const [activePage, setActivePage] = useState("overview")
  const [initialItemId, setInitialItemId] = useState<string | null>(null)
  
  // Lift sidebar state to App to allow modules to control it
  const [sidebarOpen, setSidebarOpen] = useState(true)

  useEffect(() => {
    const handleNavigation = (e: Event) => {
        const customEvent = e as CustomEvent;
        const { module, page, itemId } = customEvent.detail;
        if (module) setActiveModule(module);
        if (page) setActivePage(page);
        if (itemId) setInitialItemId(itemId);
    };
    
    window.addEventListener('navigate', handleNavigation);
    return () => window.removeEventListener('navigate', handleNavigation);
  }, []);

  // Check if we are in full screen builder mode
  const isFullScreenBuilder = activeModule === 'website' && activePage === 'editor';

  // Function to render the active module content
  const renderContent = () => {
    switch (activeModule) {
      case "dashboard":
        return <DashboardPage />
      case "content": // Renamed from church
        return <ChurchModule 
            activePage={activePage} 
            initialItemId={initialItemId} 
            onClearInitialItem={() => setInitialItemId(null)}
            setSidebarOpen={setSidebarOpen}
        />
      case "website":
        return <WebsiteModule activePage={activePage} />
      case "people":
        return <PeopleModule activePage={activePage} />
      default:
        return (
          <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
             <div className="rounded-xl bg-muted/50 p-10 text-center">
              <h2 className="text-2xl font-bold capitalize">{activeModule} Module</h2>
              <p className="text-muted-foreground">This module is currently under development.</p>
            </div>
          </div>
        )
    }
  }

  // If in full screen builder mode, bypass the sidebar layout
  if (isFullScreenBuilder) {
    return (
      <div className="h-screen w-screen bg-slate-100 overflow-hidden">
        {renderContent()}
        <Toaster />
      </div>
    );
  }

  return (
    <SidebarProvider>
      <AppSidebar 
        activeModule={activeModule} 
        setActiveModule={setActiveModule}
        activePage={activePage}
        setActivePage={setActivePage}
        isOpen={sidebarOpen}
        setIsOpen={setSidebarOpen}
      />
      <SidebarInset>
        <div className="flex flex-1 flex-col gap-4 p-4">
          {renderContent()}
        </div>
      </SidebarInset>
      <Toaster />
    </SidebarProvider>
  )
}
