"use client";

import { WebsiteOverviewPage } from "./website/overview/WebsiteOverviewPage"
import { WebsiteThemesPage } from "./website/overview/WebsiteThemesPage"
import { Builder } from "./website/pages/Builder"

interface WebsiteModuleProps {
  activePage: string
}

export function WebsiteModule({ activePage }: WebsiteModuleProps) {
  switch (activePage) {
    case "overview":
      return <WebsiteOverviewPage />
    case "themes":
      return <WebsiteThemesPage />
    case "editor":
      // Pass a default page or load the last edited one
      // For now, we load a mock page structure that Builder will use
      return (
          <Builder 
              page={{ id: '4', title: 'LBCC Campus', status: 'published' }} 
              onBack={() => {
                  // Return to themes page when exiting builder
                  window.dispatchEvent(new CustomEvent('navigate', { 
                      detail: { module: 'website', page: 'themes' } 
                  }));
              }} 
          />
      );
    default:
      return <WebsiteOverviewPage />
  }
}
