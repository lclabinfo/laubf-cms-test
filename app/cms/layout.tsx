import { SessionProvider } from "next-auth/react"
import { CmsThemeProvider } from "@/components/cms/theme-provider"

export default function CmsRootLayout({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <CmsThemeProvider>
        <div data-cms="" className="min-h-screen overflow-x-hidden bg-background text-foreground">
          {children}
        </div>
      </CmsThemeProvider>
    </SessionProvider>
  )
}
