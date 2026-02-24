"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import {
  FileText,
  Navigation,
  Palette,
  Settings,
  Globe,
  LayoutDashboard,
  ChevronLeft,
  ChevronRight,
} from "lucide-react"
import { useState } from "react"

const websiteNavItems = [
  { label: "Pages", href: "/cms/website/pages", icon: FileText },
  { label: "Navigation", href: "/cms/website/navigation", icon: Navigation },
  { label: "Theme", href: "/cms/website/theme", icon: Palette },
  { label: "Settings", href: "/cms/website/settings", icon: Settings },
]

export function CmsSidebar() {
  const pathname = usePathname()
  const [collapsed, setCollapsed] = useState(false)

  return (
    <aside
      className={cn(
        "flex flex-col border-r bg-white transition-all duration-200",
        collapsed ? "w-16" : "w-60"
      )}
    >
      {/* Logo */}
      <div className="flex h-14 items-center border-b px-4">
        <Link href="/cms" className="flex items-center gap-2">
          <Globe className="h-5 w-5 shrink-0 text-neutral-700" />
          {!collapsed && (
            <span className="text-sm font-semibold tracking-tight">
              Website Builder
            </span>
          )}
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 p-3">
        {!collapsed && (
          <div className="mb-2 px-2 text-[10px] font-semibold uppercase tracking-wider text-neutral-400">
            Website
          </div>
        )}
        {websiteNavItems.map((item) => {
          const isActive = pathname.startsWith(item.href)
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                isActive
                  ? "bg-neutral-100 text-neutral-900"
                  : "text-neutral-600 hover:bg-neutral-50 hover:text-neutral-900"
              )}
            >
              <item.icon className="h-4 w-4 shrink-0" />
              {!collapsed && item.label}
            </Link>
          )
        })}
      </nav>

      {/* Collapse toggle */}
      <div className="border-t p-3">
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="flex w-full items-center justify-center rounded-md p-2 text-neutral-400 hover:bg-neutral-50 hover:text-neutral-600"
        >
          {collapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <ChevronLeft className="h-4 w-4" />
          )}
        </button>
      </div>
    </aside>
  )
}
