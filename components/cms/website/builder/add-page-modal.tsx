"use client"

import { useState, useEffect, useMemo } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  FilePlus,
  Layout,
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Calendar,
  Heart,
  Info,
  Mail,
  Users,
  Database,
  Globe,
  MapPin,
} from "lucide-react"
import { cn } from "@/lib/utils"
import type { PageSummary } from "./types"

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface AddPageModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onPageCreated: (page: PageSummary) => void
}

type WizardStep = 1 | 2 | 3
type PageChoice = "blank" | "template"
type TemplateCategory = "all" | "cms" | "standard"

interface Template {
  id: string
  title: string
  description: string
  icon: React.ComponentType<{ className?: string }>
  category: "cms" | "standard"
  previewColor: string
  /** Default sections for this template (sectionType values) */
  defaultSections: string[]
}

// ---------------------------------------------------------------------------
// Template definitions
// ---------------------------------------------------------------------------

const TEMPLATES: Template[] = [
  {
    id: "ministry-hub",
    title: "Ministry Hub",
    description:
      "Full-featured ministry page connected to your CMS. Auto-populates leaders, events, and schedule.",
    icon: Users,
    category: "cms",
    previewColor: "bg-blue-100",
    defaultSections: [
      "MINISTRY_HERO",
      "MINISTRY_INTRO",
      "MEET_TEAM",
      "MINISTRY_SCHEDULE",
      "RECURRING_MEETINGS",
      "LOCATION_DETAIL",
    ],
  },
  {
    id: "bible-study",
    title: "Bible Study",
    description:
      "Scripture-focused layout tied to CMS series data. Automatically syncs latest messages.",
    icon: BookOpen,
    category: "cms",
    previewColor: "bg-amber-100",
    defaultSections: [
      "PAGE_HERO",
      "ALL_BIBLE_STUDIES",
      "QUOTE_BANNER",
      "CTA_BANNER",
    ],
  },
  {
    id: "about",
    title: "About Us",
    description:
      "Classic introduction page with history, mission statement, and value props.",
    icon: Info,
    category: "standard",
    previewColor: "bg-slate-100",
    defaultSections: [
      "PAGE_HERO",
      "ABOUT_DESCRIPTION",
      "PILLARS",
      "MEET_TEAM",
      "TIMELINE_SECTION",
      "CTA_BANNER",
    ],
  },
  {
    id: "events",
    title: "Events Listing",
    description:
      "Grid view of upcoming events with filters and calendar integration.",
    icon: Calendar,
    category: "standard",
    previewColor: "bg-rose-100",
    defaultSections: [
      "PAGE_HERO",
      "UPCOMING_EVENTS",
      "EVENT_CALENDAR",
      "CTA_BANNER",
    ],
  },
  {
    id: "giving",
    title: "Giving & Tithing",
    description:
      "Donation page with giving information and fund designations.",
    icon: Heart,
    category: "standard",
    previewColor: "bg-emerald-100",
    defaultSections: [
      "PAGE_HERO",
      "STATEMENT",
      "FAQ_SECTION",
      "CTA_BANNER",
    ],
  },
  {
    id: "contact",
    title: "Contact & Directions",
    description:
      "Map integration, contact forms, and service time information.",
    icon: Mail,
    category: "standard",
    previewColor: "bg-indigo-100",
    defaultSections: [
      "PAGE_HERO",
      "LOCATION_DETAIL",
      "FORM_SECTION",
    ],
  },
  {
    id: "im-new",
    title: "I'm New",
    description:
      "Welcome page for first-time visitors with service info and next steps.",
    icon: MapPin,
    category: "standard",
    previewColor: "bg-teal-100",
    defaultSections: [
      "TEXT_IMAGE_HERO",
      "NEWCOMER",
      "FEATURE_BREAKDOWN",
      "FAQ_SECTION",
      "LOCATION_DETAIL",
      "CTA_BANNER",
    ],
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

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function AddPageModal({
  open,
  onOpenChange,
  onPageCreated,
}: AddPageModalProps) {
  // Wizard state
  const [step, setStep] = useState<WizardStep>(1)
  const [pageChoice, setPageChoice] = useState<PageChoice | null>(null)

  // Template state
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(
    null
  )
  const [templateCategory, setTemplateCategory] =
    useState<TemplateCategory>("all")

  // Configuration state
  const [pageName, setPageName] = useState("")
  const [connectionType, setConnectionType] = useState<"existing" | "new">(
    "existing"
  )
  const [selectedMinistryId, setSelectedMinistryId] = useState("")
  const [ministries, setMinistries] = useState<
    { id: string; name: string }[]
  >([])
  const [isCreating, setIsCreating] = useState(false)

  // Derived state
  const selectedTemplate = TEMPLATES.find((t) => t.id === selectedTemplateId)
  const filteredTemplates = useMemo(
    () =>
      TEMPLATES.filter(
        (t) => templateCategory === "all" || t.category === templateCategory
      ),
    [templateCategory]
  )

  // Fetch ministries when step 3 is a CMS template
  useEffect(() => {
    if (
      step === 3 &&
      selectedTemplate?.category === "cms" &&
      ministries.length === 0
    ) {
      fetch("/api/v1/ministries")
        .then((res) => res.json())
        .then((json) => {
          if (json.success && Array.isArray(json.data)) {
            setMinistries(
              json.data.map((m: { id: string; name: string }) => ({
                id: m.id,
                name: m.name,
              }))
            )
          }
        })
        .catch(() => {
          // Silently fail -- the select will just be empty
        })
    }
  }, [step, selectedTemplate, ministries.length])

  // Reset wizard on close
  const handleClose = () => {
    setStep(1)
    setPageChoice(null)
    setSelectedTemplateId(null)
    setTemplateCategory("all")
    setPageName("")
    setConnectionType("existing")
    setSelectedMinistryId("")
    setIsCreating(false)
    onOpenChange(false)
  }

  // Step 1: Choose blank or template
  const handleTypeSelect = (choice: PageChoice) => {
    setPageChoice(choice)
    if (choice === "blank") {
      setStep(3)
    } else {
      setStep(2)
    }
  }

  // Step 2: Confirm template selection
  const handleTemplateConfirm = () => {
    if (selectedTemplateId) {
      setStep(3)
    }
  }

  // Step 3: Create the page
  const handleCreate = async () => {
    setIsCreating(true)

    try {
      // Determine title
      let finalTitle = pageName
      if (!finalTitle && selectedTemplate) {
        finalTitle = selectedTemplate.title
      }
      if (!finalTitle) {
        finalTitle = "Untitled Page"
      }

      const slug = slugify(finalTitle)

      // Build the request body
      const body: Record<string, unknown> = {
        title: finalTitle,
        slug,
        pageType: selectedTemplate?.category === "cms" ? "MINISTRY" : "STANDARD",
        layout: "FULL_WIDTH",
        isPublished: false,
        sortOrder: 99,
      }

      // Create the page
      const res = await fetch("/api/v1/pages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })
      const json = await res.json()

      if (!json.success) {
        throw new Error(json.error?.message || "Failed to create page")
      }

      const createdPage = json.data

      // If template selected, create sections for it
      if (selectedTemplate && selectedTemplate.defaultSections.length > 0) {
        for (let i = 0; i < selectedTemplate.defaultSections.length; i++) {
          await fetch(`/api/v1/pages/${slug}/sections`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              sectionType: selectedTemplate.defaultSections[i],
              sortOrder: i,
              content: {},
            }),
          })
        }
      }

      const pageSummary: PageSummary = {
        id: createdPage.id,
        slug: createdPage.slug,
        title: createdPage.title,
        pageType: createdPage.pageType,
        isHomepage: createdPage.isHomepage,
        isPublished: createdPage.isPublished,
        sortOrder: createdPage.sortOrder,
        parentId: createdPage.parentId,
      }

      onPageCreated(pageSummary)
      handleClose()
    } catch {
      // Error creating page -- keep modal open so user can retry
      setIsCreating(false)
    }
  }

  // Determine if the create button should be disabled
  const isCreateDisabled = (() => {
    if (isCreating) return true
    if (pageChoice === "blank" && !pageName.trim()) return true
    if (
      pageChoice === "template" &&
      selectedTemplate?.category === "cms" &&
      connectionType === "existing" &&
      !selectedMinistryId
    )
      return true
    if (
      pageChoice === "template" &&
      selectedTemplate?.category === "cms" &&
      connectionType === "new" &&
      !pageName.trim()
    )
      return true
    if (
      pageChoice === "template" &&
      selectedTemplate?.category !== "cms" &&
      !pageName.trim()
    )
      return true
    return false
  })()

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && handleClose()}>
      <DialogContent
        showCloseButton={step !== 2}
        className={cn(
          "transition-all duration-200 gap-0",
          step === 2
            ? "sm:max-w-5xl h-[85vh] flex flex-col p-0 overflow-hidden"
            : "sm:max-w-xl"
        )}
      >
        {/* ================================================================
            STEP 1: Choose Type
           ================================================================ */}
        {step === 1 && (
          <>
            <DialogHeader className="px-4 pt-4 pb-2">
              <DialogTitle>Create New Page</DialogTitle>
              <DialogDescription>
                Choose how you want to start building.
              </DialogDescription>
            </DialogHeader>

            <div className="p-4 pt-2 grid grid-cols-2 gap-4">
              {/* Blank Page card */}
              <button
                type="button"
                onClick={() => handleTypeSelect("blank")}
                className="flex flex-col items-center justify-center p-8 border-2 border-dashed border-border rounded-xl hover:border-primary hover:bg-primary/5 transition-all group gap-4 text-center"
              >
                <div className="size-16 rounded-full bg-muted flex items-center justify-center group-hover:bg-primary/10 transition-colors">
                  <FilePlus className="size-8 text-muted-foreground group-hover:text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg">Blank Page</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    Start from scratch with an empty canvas
                  </p>
                </div>
              </button>

              {/* Use Template card */}
              <button
                type="button"
                onClick={() => handleTypeSelect("template")}
                className="flex flex-col items-center justify-center p-8 border-2 border-border rounded-xl hover:border-primary hover:bg-primary/5 transition-all group gap-4 text-center"
              >
                <div className="size-16 rounded-full bg-secondary flex items-center justify-center group-hover:bg-primary/10 transition-colors">
                  <Layout className="size-8 text-secondary-foreground group-hover:text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg">Use Template</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    Browse pre-built layouts and structures
                  </p>
                </div>
              </button>
            </div>
          </>
        )}

        {/* ================================================================
            STEP 2: Template Gallery
           ================================================================ */}
        {step === 2 && (
          <div className="flex flex-1 h-full overflow-hidden">
            {/* Left sidebar: Template list */}
            <div className="w-[320px] shrink-0 border-r bg-muted/30 flex flex-col h-full">
              <div className="p-5 border-b bg-background shrink-0">
                <h2 className="font-bold text-lg mb-4">Select Template</h2>
                <div className="flex flex-wrap gap-2">
                  {(["all", "cms", "standard"] as const).map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setTemplateCategory(cat)}
                      className={cn(
                        "text-xs px-3 py-1.5 rounded-full capitalize transition-colors font-medium",
                        templateCategory === cat
                          ? "bg-foreground text-background"
                          : "bg-background border border-border text-muted-foreground hover:bg-muted hover:border-muted-foreground/30"
                      )}
                    >
                      {cat === "cms" ? "Data-Driven" : cat === "all" ? "All" : "Standard"}
                    </button>
                  ))}
                </div>
              </div>

              <ScrollArea className="flex-1">
                <div className="p-4 space-y-3">
                  {filteredTemplates.map((template) => (
                    <button
                      key={template.id}
                      type="button"
                      onClick={() => setSelectedTemplateId(template.id)}
                      className={cn(
                        "p-3 rounded-lg cursor-pointer transition-all border text-left flex items-start gap-3 w-full",
                        selectedTemplateId === template.id
                          ? "bg-background border-primary shadow-md ring-1 ring-primary"
                          : "bg-background border-transparent shadow-sm hover:shadow hover:border-border"
                      )}
                    >
                      <div
                        className={cn(
                          "size-10 rounded-md flex items-center justify-center shrink-0 mt-0.5",
                          template.category === "cms"
                            ? "bg-amber-500/15 text-amber-600 dark:bg-amber-500/20 dark:text-amber-400"
                            : "bg-muted text-muted-foreground"
                        )}
                      >
                        <template.icon className="size-5" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-semibold text-sm truncate">
                            {template.title}
                          </span>
                          {template.category === "cms" && (
                            <Badge
                              variant="warning"
                              className="text-[9px] px-1.5 py-0 h-4 uppercase tracking-wide"
                            >
                              CMS
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1 leading-snug">
                          {template.description}
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              </ScrollArea>
            </div>

            {/* Right area: Preview */}
            <div className="flex-1 bg-muted/20 flex flex-col relative min-w-0">
              {/* Navigation bar */}
              <div className="h-14 px-6 bg-background border-b shrink-0 flex items-center justify-between z-10">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setStep(1)
                    setSelectedTemplateId(null)
                  }}
                  className="text-muted-foreground hover:text-foreground"
                >
                  <ArrowLeft className="size-4 mr-2" /> Back
                </Button>

                <div className="flex items-center gap-3">
                  <Button variant="ghost" onClick={handleClose}>
                    Cancel
                  </Button>
                  <Button
                    onClick={handleTemplateConfirm}
                    disabled={!selectedTemplateId}
                  >
                    Use Template <ArrowRight className="size-4 ml-2" />
                  </Button>
                </div>
              </div>

              {/* Preview canvas */}
              <div className="flex-1 overflow-hidden relative p-8 flex items-center justify-center">
                {selectedTemplate ? (
                  <div className="w-full h-full max-w-4xl bg-background rounded-xl shadow-xl border overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-200">
                    {/* Browser chrome */}
                    <div className="bg-muted/50 px-4 py-3 border-b flex items-center gap-2 shrink-0">
                      <div className="flex gap-1.5">
                        <div className="size-3 rounded-full bg-red-400/80" />
                        <div className="size-3 rounded-full bg-yellow-400/80" />
                        <div className="size-3 rounded-full bg-green-400/80" />
                      </div>
                      <div className="mx-auto bg-background px-4 py-1.5 rounded-md text-xs text-muted-foreground w-1/2 text-center border shadow-sm flex items-center justify-center gap-2">
                        <Globe className="size-3" />
                        church.com/
                        {selectedTemplate.title
                          .toLowerCase()
                          .replace(/\s+/g, "-")}
                      </div>
                    </div>

                    {/* Preview content (skeleton blocks) */}
                    <div className="flex-1 overflow-y-auto relative bg-background">
                      <div className="p-12 max-w-3xl mx-auto space-y-10">
                        {/* Hero skeleton */}
                        <div
                          className={cn(
                            "w-full aspect-[21/9] rounded-xl shadow-inner",
                            selectedTemplate.previewColor
                          )}
                        />

                        {/* Content blocks skeleton */}
                        <div className="space-y-6">
                          <div className="w-3/4 h-10 bg-muted rounded-lg" />
                          <div className="space-y-3">
                            <div className="w-full h-4 bg-muted/60 rounded" />
                            <div className="w-full h-4 bg-muted/60 rounded" />
                            <div className="w-5/6 h-4 bg-muted/60 rounded" />
                          </div>
                        </div>

                        {/* Grid section skeleton */}
                        <div className="grid grid-cols-3 gap-6">
                          {[1, 2, 3].map((i) => (
                            <div
                              key={i}
                              className="aspect-square bg-muted/40 rounded-xl border border-dashed border-border"
                            />
                          ))}
                        </div>
                      </div>

                      {/* CMS overlay for data-driven templates */}
                      {selectedTemplate.category === "cms" && (
                        <div className="absolute inset-0 bg-background/60 backdrop-blur-[2px] flex items-center justify-center z-20">
                          <div className="bg-background p-8 rounded-2xl shadow-2xl border max-w-md text-center">
                            <div className="size-16 bg-amber-500/10 rounded-full flex items-center justify-center mx-auto mb-4 border border-amber-500/20">
                              <Database className="size-8 text-amber-600 dark:text-amber-400" />
                            </div>
                            <h3 className="font-bold text-xl mb-2">
                              Data-Driven Template
                            </h3>
                            <p className="text-sm text-muted-foreground leading-relaxed mb-6">
                              This layout is structurally tied to your CMS data.
                              Content is managed automatically through your
                              church management system.
                            </p>
                            <div className="flex gap-2 justify-center">
                              <span className="text-[10px] font-mono bg-muted px-2 py-1 rounded text-muted-foreground">
                                Read-only Structure
                              </span>
                              <span className="text-[10px] font-mono bg-amber-500/10 px-2 py-1 rounded text-amber-700 dark:text-amber-400">
                                Dynamic Content
                              </span>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center text-muted-foreground p-8 border-2 border-dashed border-border rounded-xl bg-muted/20">
                    <Layout className="size-16 mb-4 opacity-20" />
                    <p className="font-medium text-lg">
                      Select a template to preview
                    </p>
                    <p className="text-sm opacity-60">
                      Choose a template from the sidebar
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ================================================================
            STEP 3: Configuration
           ================================================================ */}
        {step === 3 && (
          <>
            <DialogHeader className="px-4 pt-4 pb-2">
              <DialogTitle>
                {selectedTemplate?.category === "cms"
                  ? "Connect Data Source"
                  : "Page Details"}
              </DialogTitle>
              <DialogDescription>
                {selectedTemplate?.category === "cms"
                  ? "Link this page to your Church CMS."
                  : "Name your new page."}
              </DialogDescription>
            </DialogHeader>

            <div className="p-4 py-3">
              {selectedTemplate?.category === "cms" ? (
                /* CMS template configuration */
                <div className="space-y-5">
                  {/* CMS info banner */}
                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex gap-3 dark:bg-amber-950/30 dark:border-amber-900">
                    <Database className="size-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-medium text-amber-900 dark:text-amber-200 text-sm">
                        CMS Connection Required
                      </h4>
                      <p className="text-amber-700 dark:text-amber-300 text-xs mt-1">
                        The{" "}
                        <strong>{selectedTemplate.title}</strong>{" "}
                        template requires a data source.
                      </p>
                    </div>
                  </div>

                  {/* Connection type toggle */}
                  <div className="grid grid-cols-2 gap-4">
                    <button
                      type="button"
                      onClick={() => setConnectionType("existing")}
                      className={cn(
                        "flex flex-col items-center justify-center rounded-xl border-2 p-4 transition-all cursor-pointer",
                        connectionType === "existing"
                          ? "border-primary bg-primary/5"
                          : "border-border hover:bg-muted"
                      )}
                    >
                      <Database className="mb-3 size-6 text-muted-foreground" />
                      <div className="font-semibold text-center text-sm">
                        Existing Ministry
                      </div>
                      <div className="text-xs text-muted-foreground text-center mt-1">
                        Import data from CMS
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => setConnectionType("new")}
                      className={cn(
                        "flex flex-col items-center justify-center rounded-xl border-2 p-4 transition-all cursor-pointer",
                        connectionType === "new"
                          ? "border-primary bg-primary/5"
                          : "border-border hover:bg-muted"
                      )}
                    >
                      <Globe className="mb-3 size-6 text-muted-foreground" />
                      <div className="font-semibold text-center text-sm">
                        Create New
                      </div>
                      <div className="text-xs text-muted-foreground text-center mt-1">
                        Start fresh in Builder
                      </div>
                    </button>
                  </div>

                  {/* Data source selector */}
                  <div className="pt-4 border-t">
                    {connectionType === "existing" ? (
                      <div className="space-y-2">
                        <Label>Select Ministry Source</Label>
                        <Select
                          value={selectedMinistryId}
                          onValueChange={setSelectedMinistryId}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Choose a ministry..." />
                          </SelectTrigger>
                          <SelectContent>
                            {ministries.map((m) => (
                              <SelectItem key={m.id} value={m.id}>
                                {m.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <Label>Page Name</Label>
                        <Input
                          placeholder="e.g. Young Adults Ministry"
                          value={pageName}
                          onChange={(e) => setPageName(e.target.value)}
                          autoFocus
                        />
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                /* Standard / blank page configuration */
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Page Name</Label>
                    <Input
                      placeholder="e.g. Our Mission"
                      value={pageName}
                      onChange={(e) => setPageName(e.target.value)}
                      autoFocus
                    />
                    <p className="text-xs text-muted-foreground">
                      This will be used for the page title and URL.
                    </p>
                  </div>
                </div>
              )}
            </div>

            <DialogFooter>
              <Button
                variant="ghost"
                onClick={() => {
                  if (pageChoice === "blank") {
                    setStep(1)
                  } else {
                    setStep(2)
                  }
                }}
              >
                Back
              </Button>
              <Button
                onClick={handleCreate}
                disabled={isCreateDisabled}
              >
                {isCreating
                  ? "Creating..."
                  : selectedTemplate?.category === "cms"
                    ? "Create & Connect"
                    : "Create Page"}
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
