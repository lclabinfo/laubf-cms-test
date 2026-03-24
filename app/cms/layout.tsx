import type { Metadata } from "next"
import { SessionProvider } from "next-auth/react"
import { CmsThemeProvider } from "@/components/cms/theme-provider"
import { UploadQueueProvider } from "@/components/cms/upload-queue-provider"

export const metadata: Metadata = {
  title: {
    default: "Church Admin CMS",
    template: "%s | Church Admin CMS",
  },
  icons: {
    icon: "/cms-favicon.ico",
  },
}

export default function CmsRootLayout({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <CmsThemeProvider>
        <UploadQueueProvider>
          <div data-cms="" className="min-h-screen overflow-x-hidden bg-background text-foreground">
            {children}
          </div>
        </UploadQueueProvider>
      </CmsThemeProvider>
    </SessionProvider>
  )
}
