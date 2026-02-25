"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import {
  Globe,
  Plus,
  FilePlus,
  Home,
  Info,
  Calendar,
  BookOpen,
  Heart,
  Mail,
  MapPin,
  Users,
  Mic,
  Sparkles,
  ArrowRight,
  Loader2,
  Layers,
  LayoutTemplate,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { SECTION_CATALOG } from "./section-catalog"

// ---------------------------------------------------------------------------
// Template definitions
// ---------------------------------------------------------------------------

interface Template {
  id: string
  title: string
  description: string
  icon: React.ComponentType<{ className?: string }>
  color: string // Tailwind bg class for the icon container
  iconColor: string // Tailwind text class for the icon
  /** Default sections for this template (sectionType values) */
  defaultSections: string[]
  pageType: "STANDARD" | "MINISTRY" | "LANDING"
  featured?: boolean
}

const TEMPLATES: Template[] = [
  {
    id: "home",
    title: "Home",
    description: "A welcoming landing page with hero, highlights, events, and call-to-action sections.",
    icon: Home,
    color: "bg-blue-500/10",
    iconColor: "text-blue-500",
    defaultSections: [
      "HERO_BANNER",
      "MEDIA_TEXT",
      "HIGHLIGHT_CARDS",
      "SPOTLIGHT_MEDIA",
      "ACTION_CARD_GRID",
      "PHOTO_GALLERY",
      "CTA_BANNER",
    ],
    pageType: "LANDING",
    featured: true,
  },
  {
    id: "about",
    title: "About Us",
    description: "Share your story, mission, values, and team with visitors.",
    icon: Info,
    color: "bg-slate-500/10",
    iconColor: "text-slate-400",
    defaultSections: [
      "PAGE_HERO",
      "ABOUT_DESCRIPTION",
      "PILLARS",
      "MEET_TEAM",
      "TIMELINE_SECTION",
      "CTA_BANNER",
    ],
    pageType: "STANDARD",
  },
  {
    id: "events",
    title: "Events",
    description: "Showcase upcoming events with calendar view and filters.",
    icon: Calendar,
    color: "bg-rose-500/10",
    iconColor: "text-rose-400",
    defaultSections: [
      "EVENTS_HERO",
      "UPCOMING_EVENTS",
      "EVENT_CALENDAR",
      "CTA_BANNER",
    ],
    pageType: "STANDARD",
  },
  {
    id: "messages",
    title: "Messages",
    description: "Feature your latest sermon with a full message archive.",
    icon: Mic,
    color: "bg-purple-500/10",
    iconColor: "text-purple-400",
    defaultSections: [
      "PAGE_HERO",
      "SPOTLIGHT_MEDIA",
      "ALL_MESSAGES",
    ],
    pageType: "STANDARD",
  },
  {
    id: "bible-study",
    title: "Bible Study",
    description: "A scripture-focused page with study materials and resources.",
    icon: BookOpen,
    color: "bg-amber-500/10",
    iconColor: "text-amber-400",
    defaultSections: [
      "PAGE_HERO",
      "ALL_BIBLE_STUDIES",
      "QUOTE_BANNER",
      "CTA_BANNER",
    ],
    pageType: "STANDARD",
  },
  {
    id: "ministry-hub",
    title: "Ministry Hub",
    description: "Detailed ministry page with leaders, schedule, and location info.",
    icon: Users,
    color: "bg-cyan-500/10",
    iconColor: "text-cyan-400",
    defaultSections: [
      "MINISTRY_HERO",
      "MINISTRY_INTRO",
      "MEET_TEAM",
      "MINISTRY_SCHEDULE",
      "RECURRING_MEETINGS",
      "LOCATION_DETAIL",
    ],
    pageType: "MINISTRY",
  },
  {
    id: "giving",
    title: "Giving",
    description: "Donation page with giving information and FAQ section.",
    icon: Heart,
    color: "bg-emerald-500/10",
    iconColor: "text-emerald-400",
    defaultSections: [
      "PAGE_HERO",
      "STATEMENT",
      "FAQ_SECTION",
      "CTA_BANNER",
    ],
    pageType: "STANDARD",
  },
  {
    id: "contact",
    title: "Contact",
    description: "Help visitors find you with directions, service times, and a contact form.",
    icon: Mail,
    color: "bg-indigo-500/10",
    iconColor: "text-indigo-400",
    defaultSections: [
      "PAGE_HERO",
      "LOCATION_DETAIL",
      "FORM_SECTION",
    ],
    pageType: "STANDARD",
  },
  {
    id: "im-new",
    title: "I'm New",
    description: "Welcome first-time visitors with next steps and what to expect.",
    icon: MapPin,
    color: "bg-teal-500/10",
    iconColor: "text-teal-400",
    defaultSections: [
      "TEXT_IMAGE_HERO",
      "NEWCOMER",
      "FEATURE_BREAKDOWN",
      "FAQ_SECTION",
      "LOCATION_DETAIL",
      "CTA_BANNER",
    ],
    pageType: "STANDARD",
  },
]

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "")
}

function getSectionDefaultContent(sectionType: string): Record<string, unknown> {
  const catalogItem = SECTION_CATALOG.find((item) => item.type === sectionType)
  return catalogItem?.defaultContent ?? {}
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function BuilderEmptyState() {
  const router = useRouter()
  const [isCreating, setIsCreating] = useState(false)
  const [creatingTemplateId, setCreatingTemplateId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  // Blank page dialog state
  const [blankDialogOpen, setBlankDialogOpen] = useState(false)
  const [blankPageName, setBlankPageName] = useState("")

  const handleCreateFromTemplate = async (template: Template) => {
    if (isCreating) return
    setIsCreating(true)
    setCreatingTemplateId(template.id)
    setError(null)

    try {
      const title = template.title
      const slug = slugify(title)

      // Create the page
      const res = await fetch("/api/v1/pages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          slug,
          pageType: template.pageType,
          layout: "FULL_WIDTH",
          isPublished: false,
          isHomepage: template.id === "home",
          sortOrder: template.id === "home" ? 0 : 99,
        }),
      })
      const json = await res.json()

      if (!json.success) {
        throw new Error(json.error?.message || "Failed to create page")
      }

      const createdPage = json.data

      // Create sections from template
      for (let i = 0; i < template.defaultSections.length; i++) {
        const sectionType = template.defaultSections[i]
        await fetch(`/api/v1/pages/${slug}/sections`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            sectionType,
            sortOrder: i,
            content: getSectionDefaultContent(sectionType),
          }),
        })
      }

      // Navigate to the new page in the builder
      router.push(`/cms/website/builder/${createdPage.id}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong")
      setIsCreating(false)
      setCreatingTemplateId(null)
    }
  }

  const handleCreateBlank = async () => {
    if (isCreating || !blankPageName.trim()) return
    setIsCreating(true)
    setCreatingTemplateId("blank")
    setError(null)

    try {
      const title = blankPageName.trim()
      const slug = slugify(title)

      const res = await fetch("/api/v1/pages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          slug,
          pageType: "STANDARD",
          layout: "FULL_WIDTH",
          isPublished: false,
          sortOrder: 99,
        }),
      })
      const json = await res.json()

      if (!json.success) {
        throw new Error(json.error?.message || "Failed to create page")
      }

      router.push(`/cms/website/builder/${json.data.id}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong")
      setIsCreating(false)
      setCreatingTemplateId(null)
    }
  }

  const homeTemplate = TEMPLATES.find((t) => t.id === "home")!
  const otherTemplates = TEMPLATES.filter((t) => t.id !== "home")

  return (
    <div className="flex h-full w-full items-center justify-center overflow-y-auto p-6">
      <div className="w-full max-w-4xl space-y-10 py-12">
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="mx-auto flex size-16 items-center justify-center rounded-2xl bg-primary/10 ring-1 ring-primary/20">
            <Globe className="size-8 text-primary" />
          </div>
          <div className="space-y-2">
            <h1 className="text-2xl font-bold tracking-tight">
              Build your church website
            </h1>
            <p className="mx-auto max-w-md text-sm text-muted-foreground leading-relaxed">
              Start with a template to get up and running quickly, or create a
              blank page and build from scratch.
            </p>
          </div>
        </div>

        {/* Error message */}
        {error && (
          <div className="mx-auto max-w-md rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-center text-sm text-destructive">
            {error}
          </div>
        )}

        {/* Featured: Home page */}
        <div>
          <button
            type="button"
            disabled={isCreating}
            onClick={() => handleCreateFromTemplate(homeTemplate)}
            className={cn(
              "w-full text-left rounded-xl border bg-card p-0 ring-1 ring-foreground/10 transition-all",
              "hover:ring-primary/40 hover:shadow-lg hover:shadow-primary/5",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
              "disabled:opacity-60 disabled:pointer-events-none",
              "group/featured cursor-pointer"
            )}
          >
            <div className="flex items-center gap-6 p-6">
              {/* Icon */}
              <div className={cn(
                "flex size-14 shrink-0 items-center justify-center rounded-xl transition-colors",
                homeTemplate.color,
                "group-hover/featured:bg-blue-500/20"
              )}>
                {creatingTemplateId === "home" ? (
                  <Loader2 className="size-7 animate-spin text-blue-500" />
                ) : (
                  <Home className="size-7 text-blue-500" />
                )}
              </div>

              {/* Text */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2.5 mb-1">
                  <span className="text-base font-semibold">Home Page</span>
                  <Badge variant="info" className="text-[10px] uppercase tracking-wider px-2 py-0">
                    Recommended
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {homeTemplate.description}
                </p>
                <div className="mt-3 flex items-center gap-1.5 text-xs text-muted-foreground/70">
                  <Layers className="size-3" />
                  <span>{homeTemplate.defaultSections.length} sections</span>
                </div>
              </div>

              {/* Arrow */}
              <div className="shrink-0 flex items-center justify-center size-10 rounded-lg bg-primary/10 text-primary opacity-0 group-hover/featured:opacity-100 transition-opacity">
                <ArrowRight className="size-5" />
              </div>
            </div>
          </button>
        </div>

        {/* Template grid */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <LayoutTemplate className="size-4 text-muted-foreground" />
              <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                Page Templates
              </h2>
            </div>
            <span className="text-xs text-muted-foreground">
              {otherTemplates.length} templates
            </span>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {otherTemplates.map((template) => {
              const Icon = template.icon
              const isThisCreating = creatingTemplateId === template.id

              return (
                <button
                  key={template.id}
                  type="button"
                  disabled={isCreating}
                  onClick={() => handleCreateFromTemplate(template)}
                  className={cn(
                    "group/card flex items-start gap-3.5 rounded-xl border bg-card p-4 text-left ring-1 ring-foreground/10 transition-all cursor-pointer",
                    "hover:ring-primary/40 hover:shadow-md hover:shadow-primary/5",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
                    "disabled:opacity-60 disabled:pointer-events-none",
                  )}
                >
                  {/* Icon */}
                  <div className={cn(
                    "flex size-10 shrink-0 items-center justify-center rounded-lg transition-colors",
                    template.color,
                  )}>
                    {isThisCreating ? (
                      <Loader2 className={cn("size-5 animate-spin", template.iconColor)} />
                    ) : (
                      <Icon className={cn("size-5", template.iconColor)} />
                    )}
                  </div>

                  {/* Text */}
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm">{template.title}</div>
                    <p className="mt-0.5 text-xs text-muted-foreground leading-relaxed line-clamp-2">
                      {template.description}
                    </p>
                    <div className="mt-2 flex items-center gap-1.5 text-[11px] text-muted-foreground/60">
                      <Layers className="size-3" />
                      <span>{template.defaultSections.length} sections</span>
                    </div>
                  </div>
                </button>
              )
            })}

            {/* Blank page card */}
            <button
              type="button"
              disabled={isCreating}
              onClick={() => setBlankDialogOpen(true)}
              className={cn(
                "group/card flex items-start gap-3.5 rounded-xl border-2 border-dashed bg-transparent p-4 text-left transition-all cursor-pointer",
                "hover:border-primary/40 hover:bg-primary/5",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
                "disabled:opacity-60 disabled:pointer-events-none",
              )}
            >
              {/* Icon */}
              <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-muted/50 transition-colors group-hover/card:bg-primary/10">
                {creatingTemplateId === "blank" ? (
                  <Loader2 className="size-5 animate-spin text-muted-foreground" />
                ) : (
                  <Plus className="size-5 text-muted-foreground group-hover/card:text-primary" />
                )}
              </div>

              {/* Text */}
              <div className="flex-1 min-w-0">
                <div className="font-medium text-sm text-muted-foreground group-hover/card:text-foreground">
                  Blank Page
                </div>
                <p className="mt-0.5 text-xs text-muted-foreground/70 leading-relaxed line-clamp-2">
                  Start from scratch with an empty canvas.
                </p>
              </div>
            </button>
          </div>
        </div>

        {/* Helpful tip */}
        <div className="flex items-start gap-3 rounded-lg border border-border/50 bg-muted/30 px-4 py-3 mx-auto max-w-2xl">
          <Sparkles className="size-4 shrink-0 mt-0.5 text-muted-foreground/60" />
          <p className="text-xs text-muted-foreground leading-relaxed">
            Each template comes pre-loaded with sections you can customize.
            You can always add, remove, or reorder sections later in the builder.
          </p>
        </div>
      </div>

      {/* Blank page name dialog */}
      <Dialog open={blankDialogOpen} onOpenChange={setBlankDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FilePlus className="size-5 text-muted-foreground" />
              Create Blank Page
            </DialogTitle>
            <DialogDescription>
              Give your new page a name. You can change this later.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2 py-2">
            <Label htmlFor="blank-page-name">Page Name</Label>
            <Input
              id="blank-page-name"
              placeholder="e.g. Our Mission"
              value={blankPageName}
              onChange={(e) => setBlankPageName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && blankPageName.trim()) {
                  handleCreateBlank()
                }
              }}
              autoFocus
            />
            <p className="text-xs text-muted-foreground">
              This will be used for the page title and URL.
            </p>
          </div>
          <DialogFooter>
            <Button
              variant="ghost"
              onClick={() => {
                setBlankDialogOpen(false)
                setBlankPageName("")
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreateBlank}
              disabled={!blankPageName.trim() || isCreating}
            >
              {creatingTemplateId === "blank" ? (
                <>
                  <Loader2 className="size-4 animate-spin mr-2" />
                  Creating...
                </>
              ) : (
                "Create Page"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
