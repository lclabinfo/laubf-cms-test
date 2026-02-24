import type { Metadata } from "next"
import { CmsSidebar } from "@/components/cms/cms-sidebar"

export const metadata: Metadata = {
  title: {
    default: "CMS",
    template: "%s | CMS",
  },
}

export default function CmsLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="font-sans antialiased" style={{ background: "hsl(0 0% 100%)", color: "hsl(0 0% 3.9%)" }}>
        <div className="flex h-screen overflow-hidden">
          <CmsSidebar />
          <main className="flex-1 overflow-y-auto bg-[hsl(0,0%,98%)]">
            <div className="p-6 lg:p-8">{children}</div>
          </main>
        </div>
      </body>
    </html>
  )
}
