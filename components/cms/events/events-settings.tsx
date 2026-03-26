"use client"

import { useState, useEffect, useCallback } from "react"
import { toast } from "sonner"
import { Loader2, Settings, Save } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

type HighlightCardsContent = {
  heading: string
  subheading: string
  ctaLabel: string
  ctaHref: string
  dataSource: string
  featuredEvents: unknown[]
  count: number
  includeRecurring: boolean
  showPastEvents: boolean
  pastEventsWindow: number
  sortOrder: string
}

const DEFAULT_CONTENT: HighlightCardsContent = {
  heading: "Upcoming Highlights",
  subheading: "",
  ctaLabel: "View All Events",
  ctaHref: "/events",
  dataSource: "featured-events",
  featuredEvents: [],
  count: 3,
  includeRecurring: false,
  showPastEvents: true,
  pastEventsWindow: 14,
  sortOrder: "asc",
}

export function EventsSettings() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [sectionId, setSectionId] = useState<string | null>(null)
  const [pageIdentifier, setPageSlug] = useState<string | null>(null)
  const [content, setContent] = useState<HighlightCardsContent>(DEFAULT_CONTENT)
  const [notFound, setNotFound] = useState(false)

  // Fetch the HIGHLIGHT_CARDS section from the homepage
  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/v1/pages/homepage-section?sectionType=HIGHLIGHT_CARDS")
        if (!res.ok) {
          if (res.status === 404) {
            setNotFound(true)
            setLoading(false)
            return
          }
          throw new Error("Failed to fetch settings")
        }
        const json = await res.json()
        const data = json.data
        setSectionId(data.sectionId)
        setPageSlug(data.pageIdentifier || data.pageId)
        const raw = data.content as Record<string, unknown>
        setContent({
          heading: (raw.heading as string) ?? DEFAULT_CONTENT.heading,
          subheading: (raw.subheading as string) ?? DEFAULT_CONTENT.subheading,
          ctaLabel: (raw.ctaLabel as string) ?? DEFAULT_CONTENT.ctaLabel,
          ctaHref: (raw.ctaHref as string) ?? DEFAULT_CONTENT.ctaHref,
          dataSource: (raw.dataSource as string) ?? DEFAULT_CONTENT.dataSource,
          featuredEvents: (raw.featuredEvents as unknown[]) ?? DEFAULT_CONTENT.featuredEvents,
          count: (raw.count as number) ?? DEFAULT_CONTENT.count,
          includeRecurring: (raw.includeRecurring as boolean) ?? DEFAULT_CONTENT.includeRecurring,
          showPastEvents: raw.showPastEvents !== undefined ? (raw.showPastEvents as boolean) : DEFAULT_CONTENT.showPastEvents,
          pastEventsWindow: (raw.pastEventsWindow as number) ?? DEFAULT_CONTENT.pastEventsWindow,
          sortOrder: (raw.sortOrder as string) ?? DEFAULT_CONTENT.sortOrder,
        })
      } catch (err) {
        console.error("Failed to load events settings:", err)
        toast.error("Failed to load featured events settings")
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const updateField = useCallback(
    <K extends keyof HighlightCardsContent>(key: K, value: HighlightCardsContent[K]) => {
      setContent((prev) => ({ ...prev, [key]: value }))
    },
    [],
  )

  const handleSave = useCallback(async () => {
    if (!sectionId || !pageIdentifier) return
    setSaving(true)
    try {
      const res = await fetch(`/api/v1/pages/${pageIdentifier}/sections/${sectionId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
      })
      if (!res.ok) throw new Error("Failed to save settings")
      toast.success("Featured events settings saved")
    } catch (err) {
      console.error("Failed to save events settings:", err)
      toast.error("Failed to save settings")
    } finally {
      setSaving(false)
    }
  }, [sectionId, pageIdentifier, content])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (notFound) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <Settings className="size-10 text-muted-foreground/40 mx-auto mb-3" />
          <h3 className="text-sm font-medium">No Featured Events Section Found</h3>
          <p className="text-muted-foreground text-xs mt-1 max-w-sm mx-auto">
            Add a &quot;Highlight Cards&quot; section to your homepage in the Website Builder to configure featured events settings here.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4 max-w-2xl">
      {/* Featured Events Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Featured Events</CardTitle>
          <CardDescription>
            Control how featured events appear on your homepage.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="space-y-1.5">
            <Label className="text-sm font-medium">Max featured events</Label>
            <Input
              type="number"
              min={1}
              max={6}
              value={content.count}
              onChange={(e) => updateField("count", parseInt(e.target.value) || 3)}
              className="w-24 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
            />
            <p className="text-xs text-muted-foreground">
              Maximum number of events to show (1-6). Empty slots are auto-filled from upcoming events.
            </p>
          </div>

          <div className="flex items-center justify-between rounded-lg border p-3">
            <div className="space-y-0.5">
              <Label className="text-sm font-medium">Include recurring events</Label>
              <p className="text-xs text-muted-foreground">
                Allow recurring events to appear in auto-fill slots.
              </p>
            </div>
            <Switch
              checked={content.includeRecurring}
              onCheckedChange={(checked) => updateField("includeRecurring", checked)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Display Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Display Settings</CardTitle>
          <CardDescription>
            Configure how events are filtered and sorted in the featured section.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="flex items-center justify-between rounded-lg border p-3">
            <div className="space-y-0.5">
              <Label className="text-sm font-medium">Show past events</Label>
              <p className="text-xs text-muted-foreground">
                Show recently ended events in the featured section.
              </p>
            </div>
            <Switch
              checked={content.showPastEvents}
              onCheckedChange={(checked) => updateField("showPastEvents", checked)}
            />
          </div>

          {content.showPastEvents && (
            <div className="space-y-1.5 pl-1">
              <Label className="text-sm font-medium">Past events window</Label>
              <Select
                value={String(content.pastEventsWindow)}
                onValueChange={(val) => updateField("pastEventsWindow", parseInt(val))}
              >
                <SelectTrigger className="w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7">Last 7 days</SelectItem>
                  <SelectItem value="14">Last 2 weeks</SelectItem>
                  <SelectItem value="30">Last 30 days</SelectItem>
                  <SelectItem value="60">Last 60 days</SelectItem>
                  <SelectItem value="90">Last 90 days</SelectItem>
                  <SelectItem value="-1">All past events</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="space-y-1.5">
            <Label className="text-sm font-medium">Sort order</Label>
            <Select
              value={content.sortOrder}
              onValueChange={(val) => updateField("sortOrder", val)}
            >
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="asc">Upcoming first</SelectItem>
                <SelectItem value="desc">Most recent first</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Section Content */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Section Content</CardTitle>
          <CardDescription>
            Customize the heading, subheading, and call-to-action for the featured events section on your homepage.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <Label className="text-sm font-medium">Heading</Label>
            <Input
              value={content.heading}
              onChange={(e) => updateField("heading", e.target.value)}
              placeholder="Upcoming Highlights"
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-sm font-medium">Subheading</Label>
            <Input
              value={content.subheading}
              onChange={(e) => updateField("subheading", e.target.value)}
              placeholder="Highlights of what's happening in our community."
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-sm font-medium">CTA Label</Label>
              <Input
                value={content.ctaLabel}
                onChange={(e) => updateField("ctaLabel", e.target.value)}
                placeholder="View All Events"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm font-medium">CTA Link</Label>
              <Input
                value={content.ctaHref}
                onChange={(e) => updateField("ctaHref", e.target.value)}
                placeholder="/events"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={saving}>
          {saving ? (
            <Loader2 className="size-4 animate-spin mr-2" />
          ) : (
            <Save className="size-4 mr-2" />
          )}
          {saving ? "Saving..." : "Save Settings"}
        </Button>
      </div>
    </div>
  )
}
