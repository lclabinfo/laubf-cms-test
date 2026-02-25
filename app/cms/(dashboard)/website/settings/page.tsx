"use client"

import { useState, useEffect, useCallback } from "react"
import Image from "next/image"
import {
  SaveIcon,
  Loader2Icon,
  PlusIcon,
  TrashIcon,
  ChevronDownIcon,
  AlertTriangleIcon,
  CheckCircle2Icon,
  XCircleIcon,
  ImageIcon,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
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

interface ServiceTime {
  day: string
  time: string
  label: string
}

interface SiteSettingsData {
  id?: string
  churchId?: string
  siteName: string
  tagline: string | null
  description: string | null
  logoUrl: string | null
  logoAlt: string | null
  faviconUrl: string | null
  ogImageUrl: string | null
  contactEmail: string | null
  contactPhone: string | null
  contactAddress: string | null
  facebookUrl: string | null
  instagramUrl: string | null
  youtubeUrl: string | null
  twitterUrl: string | null
  tiktokUrl: string | null
  spotifyUrl: string | null
  podcastUrl: string | null
  serviceTimes: ServiceTime[] | null
  googleAnalyticsId: string | null
  metaPixelId: string | null
  enableBlog: boolean
  enableGiving: boolean
  enableMemberLogin: boolean
  enablePrayerRequests: boolean
  enableAnnouncements: boolean
  enableSearch: boolean
  customHeadHtml: string | null
  customBodyHtml: string | null
  maintenanceMode: boolean
  maintenanceMessage: string | null
}

const DAYS_OF_WEEK = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
]

/* -------------------------------------------------------------------------- */
/*  Page Component                                                            */
/* -------------------------------------------------------------------------- */

export default function SiteSettingsPage() {
  const [settings, setSettings] = useState<SiteSettingsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saveStatus, setSaveStatus] = useState<"idle" | "success" | "error">("idle")
  const [advancedOpen, setAdvancedOpen] = useState(false)

  useEffect(() => {
    fetch("/api/v1/site-settings")
      .then((r) => r.json())
      .then((json) => {
        if (json.data) {
          setSettings({
            ...json.data,
            serviceTimes: json.data.serviceTimes ?? [],
          })
        } else {
          // No settings exist yet, start with defaults
          setSettings({
            siteName: "",
            tagline: null,
            description: null,
            logoUrl: null,
            logoAlt: null,
            faviconUrl: null,
            ogImageUrl: null,
            contactEmail: null,
            contactPhone: null,
            contactAddress: null,
            facebookUrl: null,
            instagramUrl: null,
            youtubeUrl: null,
            twitterUrl: null,
            tiktokUrl: null,
            spotifyUrl: null,
            podcastUrl: null,
            serviceTimes: [],
            googleAnalyticsId: null,
            metaPixelId: null,
            enableBlog: false,
            enableGiving: false,
            enableMemberLogin: false,
            enablePrayerRequests: false,
            enableAnnouncements: false,
            enableSearch: true,
            customHeadHtml: null,
            customBodyHtml: null,
            maintenanceMode: false,
            maintenanceMessage: null,
          })
        }
      })
      .finally(() => setLoading(false))
  }, [])

  const updateField = useCallback(
    <K extends keyof SiteSettingsData>(field: K, value: SiteSettingsData[K]) => {
      setSettings((prev) => (prev ? { ...prev, [field]: value } : prev))
    },
    [],
  )

  async function handleSave() {
    if (!settings) return
    setSaving(true)
    setSaveStatus("idle")
    try {
      const payload = Object.fromEntries(
        Object.entries(settings).filter(([k]) => k !== "id" && k !== "churchId"),
      )
      const res = await fetch("/api/v1/site-settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
      if (!res.ok) throw new Error("Save failed")
      setSaveStatus("success")
      setTimeout(() => setSaveStatus("idle"), 3000)
    } catch {
      setSaveStatus("error")
      setTimeout(() => setSaveStatus("idle"), 4000)
    } finally {
      setSaving(false)
    }
  }

  /* --- Loading skeleton --------------------------------------------------- */
  if (loading) {
    return (
      <div className="flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <Skeleton className="h-7 w-40" />
            <Skeleton className="h-4 w-72" />
          </div>
          <Skeleton className="h-9 w-24" />
        </div>
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-48 w-full rounded-xl" />
        ))}
      </div>
    )
  }

  if (!settings) return null

  const serviceTimes: ServiceTime[] = settings.serviceTimes ?? []

  /* --- Service time helpers ----------------------------------------------- */
  function addServiceTime() {
    updateField("serviceTimes", [
      ...serviceTimes,
      { day: "Sunday", time: "10:00", label: "" },
    ])
  }

  function removeServiceTime(index: number) {
    updateField(
      "serviceTimes",
      serviceTimes.filter((_, i) => i !== index),
    )
  }

  function updateServiceTime(index: number, field: keyof ServiceTime, value: string) {
    const updated = serviceTimes.map((st, i) =>
      i === index ? { ...st, [field]: value } : st,
    )
    updateField("serviceTimes", updated)
  }

  /* --- Render ------------------------------------------------------------- */
  return (
    <div className="flex flex-col gap-6 flex-1 min-h-0">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Site Settings</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Configure your website&apos;s global settings
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

      {/* Scrollable form */}
      <div className="overflow-y-auto space-y-6 p-0.5 -m-0.5">
        {/* Card 1: General */}
        <section className="rounded-xl border bg-card">
          <div className="px-5 py-3 border-b">
            <h2 className="text-sm font-semibold">General</h2>
          </div>
          <div className="p-5 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="siteName">Site Name</Label>
              <Input
                id="siteName"
                value={settings.siteName}
                onChange={(e) => updateField("siteName", e.target.value)}
                placeholder="My Church"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="tagline">Tagline</Label>
              <Input
                id="tagline"
                value={settings.tagline ?? ""}
                onChange={(e) =>
                  updateField("tagline", e.target.value || null)
                }
                placeholder="A short tagline for your church"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={settings.description ?? ""}
                onChange={(e) =>
                  updateField("description", e.target.value || null)
                }
                placeholder="A brief description of your church"
                rows={3}
              />
            </div>
          </div>
        </section>

        {/* Card 2: Branding */}
        <section className="rounded-xl border bg-card">
          <div className="px-5 py-3 border-b">
            <h2 className="text-sm font-semibold">Branding</h2>
          </div>
          <div className="p-5 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="logoUrl">Logo URL</Label>
              <Input
                id="logoUrl"
                value={settings.logoUrl ?? ""}
                onChange={(e) =>
                  updateField("logoUrl", e.target.value || null)
                }
                placeholder="https://example.com/logo.png"
              />
              {settings.logoUrl && (
                <div className="mt-2 flex items-center gap-3 rounded-lg border p-3 bg-muted/50">
                  <ImageIcon className="size-4 text-muted-foreground shrink-0" />
                  <Image
                    src={settings.logoUrl}
                    alt={settings.logoAlt ?? "Logo preview"}
                    width={200}
                    height={40}
                    className="h-10 w-auto max-w-[200px] object-contain"
                    unoptimized
                    onError={(e) => {
                      ;(e.target as HTMLImageElement).style.display = "none"
                    }}
                  />
                </div>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="logoAlt">Logo Alt Text</Label>
              <Input
                id="logoAlt"
                value={settings.logoAlt ?? ""}
                onChange={(e) =>
                  updateField("logoAlt", e.target.value || null)
                }
                placeholder="Church logo"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="faviconUrl">Favicon URL</Label>
              <Input
                id="faviconUrl"
                value={settings.faviconUrl ?? ""}
                onChange={(e) =>
                  updateField("faviconUrl", e.target.value || null)
                }
                placeholder="https://example.com/favicon.ico"
              />
              {settings.faviconUrl && (
                <div className="mt-2 flex items-center gap-3 rounded-lg border p-3 bg-muted/50">
                  <ImageIcon className="size-4 text-muted-foreground shrink-0" />
                  <Image
                    src={settings.faviconUrl}
                    alt="Favicon preview"
                    width={24}
                    height={24}
                    className="h-6 w-6 object-contain"
                    unoptimized
                    onError={(e) => {
                      ;(e.target as HTMLImageElement).style.display = "none"
                    }}
                  />
                </div>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="ogImageUrl">OG Image URL</Label>
              <Input
                id="ogImageUrl"
                value={settings.ogImageUrl ?? ""}
                onChange={(e) =>
                  updateField("ogImageUrl", e.target.value || null)
                }
                placeholder="https://example.com/og-image.jpg"
              />
              {settings.ogImageUrl && (
                <div className="mt-2 flex items-center gap-3 rounded-lg border p-3 bg-muted/50">
                  <ImageIcon className="size-4 text-muted-foreground shrink-0" />
                  <Image
                    src={settings.ogImageUrl}
                    alt="OG image preview"
                    width={300}
                    height={80}
                    className="h-20 w-auto max-w-[300px] object-contain"
                    unoptimized
                    onError={(e) => {
                      ;(e.target as HTMLImageElement).style.display = "none"
                    }}
                  />
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Card 3: Contact Information */}
        <section className="rounded-xl border bg-card">
          <div className="px-5 py-3 border-b">
            <h2 className="text-sm font-semibold">Contact Information</h2>
          </div>
          <div className="p-5 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="contactEmail">Email</Label>
              <Input
                id="contactEmail"
                type="email"
                value={settings.contactEmail ?? ""}
                onChange={(e) =>
                  updateField("contactEmail", e.target.value || null)
                }
                placeholder="info@mychurch.org"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="contactPhone">Phone</Label>
              <Input
                id="contactPhone"
                type="tel"
                value={settings.contactPhone ?? ""}
                onChange={(e) =>
                  updateField("contactPhone", e.target.value || null)
                }
                placeholder="(555) 123-4567"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="contactAddress">Address</Label>
              <Textarea
                id="contactAddress"
                value={settings.contactAddress ?? ""}
                onChange={(e) =>
                  updateField("contactAddress", e.target.value || null)
                }
                placeholder="123 Main St, City, State 12345"
                rows={2}
              />
            </div>
          </div>
        </section>

        {/* Card 4: Social Media */}
        <section className="rounded-xl border bg-card">
          <div className="px-5 py-3 border-b">
            <h2 className="text-sm font-semibold">Social Media</h2>
          </div>
          <div className="p-5 space-y-4">
            {(
              [
                { field: "facebookUrl", label: "Facebook URL", placeholder: "https://facebook.com/yourchurch" },
                { field: "instagramUrl", label: "Instagram URL", placeholder: "https://instagram.com/yourchurch" },
                { field: "youtubeUrl", label: "YouTube URL", placeholder: "https://youtube.com/@yourchurch" },
                { field: "twitterUrl", label: "Twitter/X URL", placeholder: "https://x.com/yourchurch" },
                { field: "tiktokUrl", label: "TikTok URL", placeholder: "https://tiktok.com/@yourchurch" },
                { field: "spotifyUrl", label: "Spotify URL", placeholder: "https://open.spotify.com/show/..." },
                { field: "podcastUrl", label: "Podcast URL", placeholder: "https://podcasts.apple.com/..." },
              ] as const
            ).map(({ field, label, placeholder }) => (
              <div key={field} className="space-y-2">
                <Label htmlFor={field}>{label}</Label>
                <Input
                  id={field}
                  value={(settings[field] as string) ?? ""}
                  onChange={(e) =>
                    updateField(field, e.target.value || null)
                  }
                  placeholder={placeholder}
                />
              </div>
            ))}
          </div>
        </section>

        {/* Card 5: Service Times */}
        <section className="rounded-xl border bg-card">
          <div className="px-5 py-3 border-b flex items-center justify-between">
            <h2 className="text-sm font-semibold">Service Times</h2>
            <Button variant="outline" size="sm" onClick={addServiceTime}>
              <PlusIcon className="size-4" />
              Add Service Time
            </Button>
          </div>
          <div className="p-5">
            {serviceTimes.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                No service times configured. Click &quot;Add Service Time&quot; to get started.
              </p>
            ) : (
              <div className="space-y-3">
                {serviceTimes.map((st, index) => (
                  <div
                    key={index}
                    className="flex flex-col sm:flex-row items-start sm:items-end gap-3 rounded-lg border p-3"
                  >
                    <div className="space-y-1.5 flex-1 min-w-0">
                      <Label className="text-xs text-muted-foreground">Day</Label>
                      <Select
                        value={st.day}
                        onValueChange={(val) =>
                          updateServiceTime(index, "day", val)
                        }
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {DAYS_OF_WEEK.map((day) => (
                            <SelectItem key={day} value={day}>
                              {day}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs text-muted-foreground">Time</Label>
                      <Input
                        type="time"
                        value={st.time}
                        onChange={(e) =>
                          updateServiceTime(index, "time", e.target.value)
                        }
                        className="w-32"
                      />
                    </div>
                    <div className="space-y-1.5 flex-1 min-w-0">
                      <Label className="text-xs text-muted-foreground">Label</Label>
                      <Input
                        value={st.label}
                        onChange={(e) =>
                          updateServiceTime(index, "label", e.target.value)
                        }
                        placeholder="e.g. Sunday Worship"
                      />
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-muted-foreground hover:text-destructive shrink-0"
                      onClick={() => removeServiceTime(index)}
                      aria-label="Remove service time"
                    >
                      <TrashIcon className="size-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* Card 6: Features */}
        <section className="rounded-xl border bg-card">
          <div className="px-5 py-3 border-b">
            <h2 className="text-sm font-semibold">Features</h2>
          </div>
          <div className="p-5 space-y-4">
            {(
              [
                { field: "enableBlog", label: "Blog", description: "Enable blog posts on your website" },
                { field: "enableGiving", label: "Online Giving", description: "Allow online donations" },
                { field: "enableMemberLogin", label: "Member Login", description: "Allow members to log in to the website" },
                { field: "enablePrayerRequests", label: "Prayer Requests", description: "Accept prayer requests from visitors" },
                { field: "enableAnnouncements", label: "Announcements", description: "Show announcements on the website" },
                { field: "enableSearch", label: "Search", description: "Enable site-wide search" },
              ] as const
            ).map(({ field, label, description }) => (
              <div key={field} className="flex items-center justify-between gap-4">
                <div className="space-y-0.5">
                  <Label htmlFor={field} className="text-sm font-medium">
                    {label}
                  </Label>
                  <p className="text-xs text-muted-foreground">{description}</p>
                </div>
                <Switch
                  id={field}
                  checked={settings[field] as boolean}
                  onCheckedChange={(checked) =>
                    updateField(field, checked)
                  }
                />
              </div>
            ))}
          </div>
        </section>

        {/* Card 7: SEO & Analytics */}
        <section className="rounded-xl border bg-card">
          <div className="px-5 py-3 border-b">
            <h2 className="text-sm font-semibold">SEO & Analytics</h2>
          </div>
          <div className="p-5 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="googleAnalyticsId">Google Analytics ID</Label>
              <Input
                id="googleAnalyticsId"
                value={settings.googleAnalyticsId ?? ""}
                onChange={(e) =>
                  updateField("googleAnalyticsId", e.target.value || null)
                }
                placeholder="G-XXXXXXXXXX"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="metaPixelId">Facebook/Meta Pixel ID</Label>
              <Input
                id="metaPixelId"
                value={settings.metaPixelId ?? ""}
                onChange={(e) =>
                  updateField("metaPixelId", e.target.value || null)
                }
                placeholder="1234567890"
              />
            </div>
          </div>
        </section>

        {/* Card 8: Maintenance Mode */}
        <section className="rounded-xl border bg-card">
          <div className="px-5 py-3 border-b">
            <h2 className="text-sm font-semibold">Maintenance Mode</h2>
          </div>
          <div className="p-5 space-y-4">
            <div className="flex items-center justify-between gap-4">
              <div className="space-y-0.5">
                <Label htmlFor="maintenanceMode" className="text-sm font-medium">
                  Enable Maintenance Mode
                </Label>
                <p className="text-xs text-muted-foreground">
                  When enabled, visitors will see a maintenance page instead of your website
                </p>
              </div>
              <Switch
                id="maintenanceMode"
                checked={settings.maintenanceMode}
                onCheckedChange={(checked) =>
                  updateField("maintenanceMode", checked)
                }
              />
            </div>
            {settings.maintenanceMode && (
              <>
                <div className="flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3 text-amber-800 dark:border-amber-900 dark:bg-amber-950/50 dark:text-amber-200">
                  <AlertTriangleIcon className="size-4 shrink-0" />
                  <p className="text-xs">
                    Your website is currently in maintenance mode. Visitors cannot access it.
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="maintenanceMessage">Maintenance Message</Label>
                  <Textarea
                    id="maintenanceMessage"
                    value={settings.maintenanceMessage ?? ""}
                    onChange={(e) =>
                      updateField("maintenanceMessage", e.target.value || null)
                    }
                    placeholder="We're making some improvements. Please check back soon!"
                    rows={3}
                  />
                </div>
              </>
            )}
          </div>
        </section>

        {/* Card 9: Advanced */}
        <Collapsible open={advancedOpen} onOpenChange={setAdvancedOpen}>
          <section className="rounded-xl border bg-card">
            <CollapsibleTrigger asChild>
              <button className="flex w-full items-center justify-between px-5 py-3 border-b hover:bg-muted/50 transition-colors">
                <h2 className="text-sm font-semibold">Advanced</h2>
                <ChevronDownIcon
                  className={cn(
                    "size-4 text-muted-foreground transition-transform duration-200",
                    advancedOpen && "rotate-180",
                  )}
                />
              </button>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <div className="p-5 space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="customHeadHtml">Custom Head HTML</Label>
                  <p className="text-xs text-muted-foreground">
                    Code injected into the &lt;head&gt; tag. Use for analytics scripts, meta tags, etc.
                  </p>
                  <Textarea
                    id="customHeadHtml"
                    value={settings.customHeadHtml ?? ""}
                    onChange={(e) =>
                      updateField("customHeadHtml", e.target.value || null)
                    }
                    placeholder="<!-- Custom head HTML -->"
                    rows={4}
                    className="font-mono text-sm"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="customBodyHtml">Custom Body HTML</Label>
                  <p className="text-xs text-muted-foreground">
                    Code injected before the closing &lt;/body&gt; tag. Use for chat widgets, tracking pixels, etc.
                  </p>
                  <Textarea
                    id="customBodyHtml"
                    value={settings.customBodyHtml ?? ""}
                    onChange={(e) =>
                      updateField("customBodyHtml", e.target.value || null)
                    }
                    placeholder="<!-- Custom body HTML -->"
                    rows={4}
                    className="font-mono text-sm"
                  />
                </div>
              </div>
            </CollapsibleContent>
          </section>
        </Collapsible>
      </div>
    </div>
  )
}
