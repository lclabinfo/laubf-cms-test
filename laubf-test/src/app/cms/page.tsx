import Link from "next/link"
import { FileText, Navigation, Palette, Settings } from "lucide-react"

const quickLinks = [
  {
    title: "Pages",
    description: "Manage website pages and content structure",
    href: "/cms/website/pages",
    icon: FileText,
  },
  {
    title: "Navigation",
    description: "Configure menus and navigation structure",
    href: "/cms/website/navigation",
    icon: Navigation,
  },
  {
    title: "Theme",
    description: "Customize colors, typography, and styling",
    href: "/cms/website/theme",
    icon: Palette,
  },
  {
    title: "Settings",
    description: "Site identity, contact info, and features",
    href: "/cms/website/settings",
    icon: Settings,
  },
]

export default function CmsDashboard() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Website Builder</h1>
        <p className="text-sm text-neutral-500 mt-1">
          Manage your website pages, navigation, theme, and settings.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {quickLinks.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="flex items-start gap-4 rounded-lg border bg-white p-5 transition-colors hover:bg-neutral-50 hover:border-neutral-300"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-md bg-neutral-100">
              <item.icon className="h-5 w-5 text-neutral-600" />
            </div>
            <div>
              <h3 className="font-semibold text-sm">{item.title}</h3>
              <p className="text-xs text-neutral-500 mt-0.5">{item.description}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
