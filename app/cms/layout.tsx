import { CmsThemeProvider } from "@/components/cms/theme-provider"

export default function CmsRootLayout({ children }: { children: React.ReactNode }) {
  return (
    <CmsThemeProvider>
      <div data-cms="" className="min-h-screen bg-background text-foreground">
        {children}
      </div>
    </CmsThemeProvider>
  )
}
