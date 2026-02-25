"use client"

import { useState, useEffect, useCallback } from "react"
import {
  SaveIcon,
  Loader2Icon,
  RotateCcwIcon,
  ChevronDownIcon,
  AlertTriangleIcon,
  CheckCircle2Icon,
  XCircleIcon,
  CheckIcon,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { cn } from "@/lib/utils"

/* -------------------------------------------------------------------------- */
/*  Types                                                                     */
/* -------------------------------------------------------------------------- */

interface ThemeCustomizationData {
  id?: string
  churchId?: string
  themeId?: string
  primaryColor: string | null
  secondaryColor: string | null
  backgroundColor: string | null
  textColor: string | null
  headingColor: string | null
  headingFont: string | null
  bodyFont: string | null
  baseFontSize: number | null
  customCss: string | null
  // Read-only theme info
  theme?: {
    id: string
    name: string
    slug: string
  }
}

/* -------------------------------------------------------------------------- */
/*  Font options                                                              */
/* -------------------------------------------------------------------------- */

const HEADING_FONTS = [
  "Inter",
  "DM Serif Display",
  "Playfair Display",
  "Lora",
  "Merriweather",
  "Montserrat",
  "Raleway",
  "Poppins",
  "Oswald",
  "PT Serif",
]

const BODY_FONTS = [
  "Inter",
  "Open Sans",
  "Roboto",
  "Lato",
  "Source Sans 3",
  "Nunito",
  "Work Sans",
  "IBM Plex Sans",
  "PT Sans",
  "Libre Franklin",
]

const FONT_SIZES = [
  { value: "14", label: "14px" },
  { value: "15", label: "15px" },
  { value: "16", label: "16px (default)" },
  { value: "17", label: "17px" },
  { value: "18", label: "18px" },
]

const CURATED_PAIRINGS = [
  {
    name: "Classic & Modern",
    heading: "DM Serif Display",
    body: "Inter",
  },
  {
    name: "Elegant & Clean",
    heading: "Playfair Display",
    body: "Source Sans 3",
  },
  {
    name: "Modern & Friendly",
    heading: "Montserrat",
    body: "Open Sans",
  },
  {
    name: "Warm & Readable",
    heading: "Lora",
    body: "Nunito",
  },
  {
    name: "Bold & Professional",
    heading: "Oswald",
    body: "Lato",
  },
  {
    name: "Traditional & Contemporary",
    heading: "Merriweather",
    body: "Roboto",
  },
]

const COLOR_FIELDS = [
  { field: "primaryColor" as const, label: "Primary Color" },
  { field: "secondaryColor" as const, label: "Secondary Color" },
  { field: "backgroundColor" as const, label: "Background Color" },
  { field: "textColor" as const, label: "Text Color" },
  { field: "headingColor" as const, label: "Heading Color" },
]

/* -------------------------------------------------------------------------- */
/*  Page Component                                                            */
/* -------------------------------------------------------------------------- */

export default function WebsiteThemePage() {
  const [theme, setTheme] = useState<ThemeCustomizationData | null>(null)
  const [originalTheme, setOriginalTheme] = useState<ThemeCustomizationData | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saveStatus, setSaveStatus] = useState<"idle" | "success" | "error">("idle")
  const [cssOpen, setCssOpen] = useState(false)

  useEffect(() => {
    fetch("/api/v1/theme")
      .then((r) => r.json())
      .then((json) => {
        if (json.data) {
          setTheme(json.data)
          setOriginalTheme(json.data)
        }
      })
      .finally(() => setLoading(false))
  }, [])

  const updateField = useCallback(
    <K extends keyof ThemeCustomizationData>(
      field: K,
      value: ThemeCustomizationData[K],
    ) => {
      setTheme((prev) => (prev ? { ...prev, [field]: value } : prev))
    },
    [],
  )

  async function handleSave() {
    if (!theme) return
    setSaving(true)
    setSaveStatus("idle")
    try {
      const excludeKeys = new Set(["id", "churchId", "themeId", "theme"])
      const payload = Object.fromEntries(
        Object.entries(theme).filter(([k]) => !excludeKeys.has(k)),
      )
      const res = await fetch("/api/v1/theme", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
      if (!res.ok) throw new Error("Save failed")
      const json = await res.json()
      if (json.data) {
        setTheme(json.data)
        setOriginalTheme(json.data)
      }
      setSaveStatus("success")
      setTimeout(() => setSaveStatus("idle"), 3000)
    } catch {
      setSaveStatus("error")
      setTimeout(() => setSaveStatus("idle"), 4000)
    } finally {
      setSaving(false)
    }
  }

  function handleReset() {
    if (originalTheme) {
      setTheme({ ...originalTheme })
    }
  }

  function applyPairing(heading: string, body: string) {
    setTheme((prev) =>
      prev ? { ...prev, headingFont: heading, bodyFont: body } : prev,
    )
  }

  /* --- Loading skeleton --------------------------------------------------- */
  if (loading) {
    return (
      <div className="flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <Skeleton className="h-7 w-32" />
            <Skeleton className="h-4 w-64" />
          </div>
          <div className="flex gap-2">
            <Skeleton className="h-9 w-20" />
            <Skeleton className="h-9 w-20" />
          </div>
        </div>
        <div className="flex flex-col lg:flex-row gap-6">
          <div className="flex-1 space-y-6">
            <Skeleton className="h-64 w-full rounded-xl" />
            <Skeleton className="h-48 w-full rounded-xl" />
          </div>
          <Skeleton className="h-64 w-full lg:w-80 rounded-xl" />
        </div>
      </div>
    )
  }

  if (!theme) {
    return (
      <div className="flex flex-col gap-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Theme</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Customize your website&apos;s appearance
          </p>
        </div>
        <div className="rounded-xl border bg-card p-8 text-center">
          <p className="text-muted-foreground text-sm">
            No theme customization found. Please set up a theme first.
          </p>
        </div>
      </div>
    )
  }

  const isCurrentPairing = (heading: string, body: string) =>
    theme.headingFont === heading && theme.bodyFont === body

  /* --- Render ------------------------------------------------------------- */
  return (
    <div className="flex flex-col gap-6 flex-1 min-h-0">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Theme</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Customize your website&apos;s appearance
          </p>
        </div>
        <div className="flex items-center gap-2">
          {saveStatus === "success" && (
            <span className="flex items-center gap-1.5 text-sm text-emerald-600">
              <CheckCircle2Icon className="size-4" />
              Saved
            </span>
          )}
          {saveStatus === "error" && (
            <span className="flex items-center gap-1.5 text-sm text-destructive">
              <XCircleIcon className="size-4" />
              Failed to save
            </span>
          )}
          <Button variant="outline" onClick={handleReset}>
            <RotateCcwIcon className="size-4" />
            Reset
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? (
              <Loader2Icon className="size-4 animate-spin" />
            ) : (
              <SaveIcon className="size-4" />
            )}
            {saving ? "Saving..." : "Save"}
          </Button>
        </div>
      </div>

      {/* Two-column layout */}
      <div className="flex flex-col lg:flex-row flex-1 gap-6 min-h-0">
        {/* Left: Settings form */}
        <div className="flex-1 min-w-0 overflow-y-auto space-y-6 p-0.5 -m-0.5">
          {/* Card 1: Colors */}
          <section className="rounded-xl border bg-card">
            <div className="px-5 py-3 border-b">
              <h2 className="text-sm font-semibold">Colors</h2>
            </div>
            <div className="p-5 space-y-4">
              {COLOR_FIELDS.map(({ field, label }) => (
                <div key={field} className="flex items-center gap-3">
                  <Label className="w-32 text-sm shrink-0">{label}</Label>
                  <input
                    type="color"
                    value={theme[field] ?? "#000000"}
                    onChange={(e) => updateField(field, e.target.value)}
                    className="h-9 w-14 rounded border cursor-pointer bg-transparent"
                  />
                  <Input
                    value={theme[field] ?? ""}
                    onChange={(e) =>
                      updateField(field, e.target.value || null)
                    }
                    placeholder="#000000"
                    className="w-28 font-mono text-sm"
                  />
                </div>
              ))}
            </div>
          </section>

          {/* Card 2: Typography */}
          <section className="rounded-xl border bg-card">
            <div className="px-5 py-3 border-b">
              <h2 className="text-sm font-semibold">Typography</h2>
            </div>
            <div className="p-5 space-y-4">
              <div className="space-y-2">
                <Label htmlFor="headingFont">Heading Font</Label>
                <Select
                  value={theme.headingFont ?? ""}
                  onValueChange={(val) => updateField("headingFont", val || null)}
                >
                  <SelectTrigger id="headingFont">
                    <SelectValue placeholder="Select a heading font" />
                  </SelectTrigger>
                  <SelectContent>
                    {HEADING_FONTS.map((font) => (
                      <SelectItem key={font} value={font}>
                        {font}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="bodyFont">Body Font</Label>
                <Select
                  value={theme.bodyFont ?? ""}
                  onValueChange={(val) => updateField("bodyFont", val || null)}
                >
                  <SelectTrigger id="bodyFont">
                    <SelectValue placeholder="Select a body font" />
                  </SelectTrigger>
                  <SelectContent>
                    {BODY_FONTS.map((font) => (
                      <SelectItem key={font} value={font}>
                        {font}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="baseFontSize">Base Font Size</Label>
                <Select
                  value={theme.baseFontSize?.toString() ?? "16"}
                  onValueChange={(val) =>
                    updateField("baseFontSize", parseInt(val, 10))
                  }
                >
                  <SelectTrigger id="baseFontSize">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {FONT_SIZES.map(({ value, label }) => (
                      <SelectItem key={value} value={value}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Preview of current fonts */}
              {(theme.headingFont || theme.bodyFont) && (
                <div className="rounded-lg border p-4 bg-muted/30 space-y-2 mt-2">
                  <p className="text-xs text-muted-foreground">Preview</p>
                  {theme.headingFont && (
                    <p
                      className="text-lg font-bold"
                      style={{ fontFamily: theme.headingFont }}
                    >
                      Heading: {theme.headingFont}
                    </p>
                  )}
                  {theme.bodyFont && (
                    <p
                      className="text-sm"
                      style={{ fontFamily: theme.bodyFont }}
                    >
                      Body text in {theme.bodyFont}. The quick brown fox jumps
                      over the lazy dog.
                    </p>
                  )}
                </div>
              )}
            </div>
          </section>

          {/* Card 3: Curated Pairings */}
          <section className="rounded-xl border bg-card">
            <div className="px-5 py-3 border-b">
              <h2 className="text-sm font-semibold">Curated Font Pairings</h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                Click a pairing to apply it
              </p>
            </div>
            <div className="p-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {CURATED_PAIRINGS.map((pairing) => {
                  const isActive = isCurrentPairing(
                    pairing.heading,
                    pairing.body,
                  )
                  return (
                    <button
                      key={pairing.name}
                      onClick={() =>
                        applyPairing(pairing.heading, pairing.body)
                      }
                      className={cn(
                        "rounded-lg border p-4 text-left transition-colors hover:bg-muted/50 relative",
                        isActive &&
                          "border-primary bg-primary/5 ring-1 ring-primary",
                      )}
                    >
                      {isActive && (
                        <div className="absolute top-2 right-2">
                          <CheckIcon className="size-4 text-primary" />
                        </div>
                      )}
                      <p className="text-xs text-muted-foreground mb-2">
                        {pairing.name}
                      </p>
                      <p
                        className="text-base font-bold leading-tight"
                        style={{ fontFamily: pairing.heading }}
                      >
                        {pairing.heading}
                      </p>
                      <p
                        className="text-sm text-muted-foreground mt-1"
                        style={{ fontFamily: pairing.body }}
                      >
                        {pairing.body}
                      </p>
                    </button>
                  )
                })}
              </div>
            </div>
          </section>

          {/* Card 4: Custom CSS (Advanced) */}
          <Collapsible open={cssOpen} onOpenChange={setCssOpen}>
            <section className="rounded-xl border bg-card">
              <CollapsibleTrigger asChild>
                <button className="flex w-full items-center justify-between px-5 py-3 border-b hover:bg-muted/50 transition-colors">
                  <h2 className="text-sm font-semibold">Custom CSS</h2>
                  <ChevronDownIcon
                    className={cn(
                      "size-4 text-muted-foreground transition-transform duration-200",
                      cssOpen && "rotate-180",
                    )}
                  />
                </button>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <div className="p-5 space-y-3">
                  <div className="flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3 text-amber-800 dark:border-amber-900 dark:bg-amber-950/50 dark:text-amber-200">
                    <AlertTriangleIcon className="size-4 shrink-0" />
                    <p className="text-xs">
                      Changes here can break your website&apos;s styling. Use
                      with caution.
                    </p>
                  </div>
                  <Textarea
                    value={theme.customCss ?? ""}
                    onChange={(e) =>
                      updateField("customCss", e.target.value || null)
                    }
                    placeholder="/* Custom CSS overrides */"
                    rows={8}
                    className="font-mono text-sm"
                  />
                </div>
              </CollapsibleContent>
            </section>
          </Collapsible>
        </div>

        {/* Right: Preview placeholder */}
        <div className="w-full lg:w-80 shrink-0">
          <section className="rounded-xl border bg-card sticky top-0">
            <div className="px-5 py-3 border-b">
              <h2 className="text-sm font-semibold">Preview</h2>
            </div>
            <div className="p-5">
              <div className="rounded-lg border border-dashed p-6 text-center space-y-3">
                <div className="mx-auto size-12 rounded-full bg-muted flex items-center justify-center">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="size-6 text-muted-foreground"
                  >
                    <rect width="18" height="18" x="3" y="3" rx="2" />
                    <path d="m9 8 6 4-6 4Z" />
                  </svg>
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-medium">Live preview coming soon</p>
                  <p className="text-xs text-muted-foreground">
                    Save your changes and visit your website to see them.
                  </p>
                </div>
              </div>

              {/* Quick color swatches */}
              <div className="mt-4 space-y-2">
                <p className="text-xs text-muted-foreground font-medium">
                  Current colors
                </p>
                <div className="flex gap-2 flex-wrap">
                  {COLOR_FIELDS.map(({ field, label }) => {
                    const color = theme[field]
                    if (!color) return null
                    return (
                      <div
                        key={field}
                        className="flex items-center gap-1.5"
                        title={label}
                      >
                        <div
                          className="size-5 rounded border"
                          style={{ backgroundColor: color }}
                        />
                        <span className="text-xs text-muted-foreground font-mono">
                          {color}
                        </span>
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Quick font info */}
              {(theme.headingFont || theme.bodyFont) && (
                <div className="mt-4 space-y-2">
                  <p className="text-xs text-muted-foreground font-medium">
                    Current fonts
                  </p>
                  <div className="space-y-1 text-xs">
                    {theme.headingFont && (
                      <p>
                        <span className="text-muted-foreground">Heading:</span>{" "}
                        {theme.headingFont}
                      </p>
                    )}
                    {theme.bodyFont && (
                      <p>
                        <span className="text-muted-foreground">Body:</span>{" "}
                        {theme.bodyFont}
                      </p>
                    )}
                    {theme.baseFontSize && (
                      <p>
                        <span className="text-muted-foreground">Size:</span>{" "}
                        {theme.baseFontSize}px
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}
