"use client"

import { useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Save,
  Globe,
  Mail,
  Share2,
  BarChart3,
  ToggleLeft,
  Code,
  AlertTriangle,
} from "lucide-react"

interface SiteSettingsData {
  id: string
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
  serviceTimes: unknown
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

export default function SiteSettingsPage() {
  const [settings, setSettings] = useState<SiteSettingsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    siteName: "",
    tagline: "",
    description: "",
    logoUrl: "",
    logoAlt: "",
    faviconUrl: "",
    ogImageUrl: "",
    contactEmail: "",
    contactPhone: "",
    contactAddress: "",
    facebookUrl: "",
    instagramUrl: "",
    youtubeUrl: "",
    twitterUrl: "",
    tiktokUrl: "",
    spotifyUrl: "",
    podcastUrl: "",
    serviceTimes: "[]",
    googleAnalyticsId: "",
    metaPixelId: "",
    enableBlog: false,
    enableGiving: false,
    enableMemberLogin: false,
    enablePrayerRequests: false,
    enableAnnouncements: false,
    enableSearch: true,
    customHeadHtml: "",
    customBodyHtml: "",
    maintenanceMode: false,
    maintenanceMessage: "",
  })

  const fetchSettings = useCallback(async () => {
    try {
      const res = await fetch("/api/v1/site-settings")
      if (res.ok) {
        const data: SiteSettingsData = await res.json()
        setSettings(data)
        setForm({
          siteName: data.siteName || "",
          tagline: data.tagline || "",
          description: data.description || "",
          logoUrl: data.logoUrl || "",
          logoAlt: data.logoAlt || "",
          faviconUrl: data.faviconUrl || "",
          ogImageUrl: data.ogImageUrl || "",
          contactEmail: data.contactEmail || "",
          contactPhone: data.contactPhone || "",
          contactAddress: data.contactAddress || "",
          facebookUrl: data.facebookUrl || "",
          instagramUrl: data.instagramUrl || "",
          youtubeUrl: data.youtubeUrl || "",
          twitterUrl: data.twitterUrl || "",
          tiktokUrl: data.tiktokUrl || "",
          spotifyUrl: data.spotifyUrl || "",
          podcastUrl: data.podcastUrl || "",
          serviceTimes: data.serviceTimes ? JSON.stringify(data.serviceTimes, null, 2) : "[]",
          googleAnalyticsId: data.googleAnalyticsId || "",
          metaPixelId: data.metaPixelId || "",
          enableBlog: data.enableBlog,
          enableGiving: data.enableGiving,
          enableMemberLogin: data.enableMemberLogin,
          enablePrayerRequests: data.enablePrayerRequests,
          enableAnnouncements: data.enableAnnouncements,
          enableSearch: data.enableSearch,
          customHeadHtml: data.customHeadHtml || "",
          customBodyHtml: data.customBodyHtml || "",
          maintenanceMode: data.maintenanceMode,
          maintenanceMessage: data.maintenanceMessage || "",
        })
      }
    } catch (error) {
      console.error("Failed to fetch settings:", error)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchSettings()
  }, [fetchSettings])

  const handleSave = async () => {
    setSaving(true)
    try {
      let serviceTimes = null
      try {
        serviceTimes = JSON.parse(form.serviceTimes)
      } catch {
        serviceTimes = null
      }

      await fetch("/api/v1/site-settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          serviceTimes,
        }),
      })
      fetchSettings()
    } catch (error) {
      console.error("Failed to save settings:", error)
    } finally {
      setSaving(false)
    }
  }

  const updateField = (field: string, value: string | boolean) => {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 text-neutral-500">
        Loading settings...
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Site Settings</h1>
          <p className="text-sm text-neutral-500">
            Configure your website identity, contact info, and features.
          </p>
        </div>
        <Button onClick={handleSave} disabled={saving}>
          <Save className="mr-2 h-4 w-4" />
          {saving ? "Saving..." : "Save Changes"}
        </Button>
      </div>

      <Tabs defaultValue="identity">
        <TabsList>
          <TabsTrigger value="identity">
            <Globe className="mr-2 h-3.5 w-3.5" />
            Identity
          </TabsTrigger>
          <TabsTrigger value="contact">
            <Mail className="mr-2 h-3.5 w-3.5" />
            Contact
          </TabsTrigger>
          <TabsTrigger value="social">
            <Share2 className="mr-2 h-3.5 w-3.5" />
            Social
          </TabsTrigger>
          <TabsTrigger value="analytics">
            <BarChart3 className="mr-2 h-3.5 w-3.5" />
            Analytics
          </TabsTrigger>
          <TabsTrigger value="features">
            <ToggleLeft className="mr-2 h-3.5 w-3.5" />
            Features
          </TabsTrigger>
          <TabsTrigger value="advanced">
            <Code className="mr-2 h-3.5 w-3.5" />
            Advanced
          </TabsTrigger>
        </TabsList>

        {/* Identity */}
        <TabsContent value="identity" className="space-y-6 pt-4">
          <Card>
            <CardHeader>
              <CardTitle>Site Identity</CardTitle>
              <CardDescription>
                Basic information about your website.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Site Name</Label>
                <Input
                  value={form.siteName}
                  onChange={(e) => updateField("siteName", e.target.value)}
                  placeholder="My Church"
                />
              </div>
              <div className="space-y-2">
                <Label>Tagline</Label>
                <Input
                  value={form.tagline}
                  onChange={(e) => updateField("tagline", e.target.value)}
                  placeholder="A brief slogan or motto"
                />
              </div>
              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea
                  value={form.description}
                  onChange={(e) => updateField("description", e.target.value)}
                  placeholder="A longer description of your church"
                  rows={3}
                />
              </div>
              <Separator />
              <div className="space-y-2">
                <Label>Logo URL</Label>
                <Input
                  value={form.logoUrl}
                  onChange={(e) => updateField("logoUrl", e.target.value)}
                  placeholder="/logo/logo.svg"
                />
              </div>
              <div className="space-y-2">
                <Label>Logo Alt Text</Label>
                <Input
                  value={form.logoAlt}
                  onChange={(e) => updateField("logoAlt", e.target.value)}
                  placeholder="Church Name"
                />
              </div>
              <div className="space-y-2">
                <Label>Favicon URL</Label>
                <Input
                  value={form.faviconUrl}
                  onChange={(e) => updateField("faviconUrl", e.target.value)}
                  placeholder="/favicon.ico"
                />
              </div>
              <div className="space-y-2">
                <Label>OG Image URL</Label>
                <Input
                  value={form.ogImageUrl}
                  onChange={(e) => updateField("ogImageUrl", e.target.value)}
                  placeholder="Default social sharing image"
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Contact */}
        <TabsContent value="contact" className="space-y-6 pt-4">
          <Card>
            <CardHeader>
              <CardTitle>Contact Information</CardTitle>
              <CardDescription>
                How visitors can reach your church.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Email</Label>
                <Input
                  type="email"
                  value={form.contactEmail}
                  onChange={(e) => updateField("contactEmail", e.target.value)}
                  placeholder="info@church.org"
                />
              </div>
              <div className="space-y-2">
                <Label>Phone</Label>
                <Input
                  type="tel"
                  value={form.contactPhone}
                  onChange={(e) => updateField("contactPhone", e.target.value)}
                  placeholder="(555) 123-4567"
                />
              </div>
              <div className="space-y-2">
                <Label>Address</Label>
                <Textarea
                  value={form.contactAddress}
                  onChange={(e) => updateField("contactAddress", e.target.value)}
                  placeholder="123 Main St, City, ST 12345"
                  rows={2}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Service Times</CardTitle>
              <CardDescription>
                JSON array of service time objects.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Textarea
                value={form.serviceTimes}
                onChange={(e) => updateField("serviceTimes", e.target.value)}
                className="font-mono text-xs"
                rows={6}
                placeholder='[{"day": "Sunday", "time": "11:00 AM", "name": "Worship Service"}]'
              />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Social */}
        <TabsContent value="social" className="space-y-6 pt-4">
          <Card>
            <CardHeader>
              <CardTitle>Social Media Links</CardTitle>
              <CardDescription>
                Connect your social media profiles.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {[
                { key: "facebookUrl", label: "Facebook" },
                { key: "instagramUrl", label: "Instagram" },
                { key: "youtubeUrl", label: "YouTube" },
                { key: "twitterUrl", label: "X / Twitter" },
                { key: "tiktokUrl", label: "TikTok" },
                { key: "spotifyUrl", label: "Spotify" },
                { key: "podcastUrl", label: "Podcast" },
              ].map(({ key, label }) => (
                <div key={key} className="space-y-2">
                  <Label>{label}</Label>
                  <Input
                    value={String((form as unknown as Record<string, string | boolean>)[key] || "")}
                    onChange={(e) => updateField(key, e.target.value)}
                    placeholder={`https://${label.toLowerCase()}.com/...`}
                  />
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Analytics */}
        <TabsContent value="analytics" className="space-y-6 pt-4">
          <Card>
            <CardHeader>
              <CardTitle>Analytics & Tracking</CardTitle>
              <CardDescription>
                Add tracking IDs for analytics services.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Google Analytics ID</Label>
                <Input
                  value={form.googleAnalyticsId}
                  onChange={(e) =>
                    updateField("googleAnalyticsId", e.target.value)
                  }
                  placeholder="G-XXXXXXXXXX"
                />
              </div>
              <div className="space-y-2">
                <Label>Meta Pixel ID</Label>
                <Input
                  value={form.metaPixelId}
                  onChange={(e) => updateField("metaPixelId", e.target.value)}
                  placeholder="1234567890"
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Features */}
        <TabsContent value="features" className="space-y-6 pt-4">
          <Card>
            <CardHeader>
              <CardTitle>Feature Flags</CardTitle>
              <CardDescription>
                Enable or disable website features.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {[
                { key: "enableSearch", label: "Search", desc: "Enable site search" },
                { key: "enableBlog", label: "Blog", desc: "Enable blog section" },
                { key: "enableGiving", label: "Giving", desc: "Enable giving/donations" },
                { key: "enableMemberLogin", label: "Member Login", desc: "Enable member authentication" },
                { key: "enablePrayerRequests", label: "Prayer Requests", desc: "Enable prayer request submissions" },
                { key: "enableAnnouncements", label: "Announcements", desc: "Enable announcements banner" },
              ].map(({ key, label, desc }) => (
                <div key={key} className="flex items-center justify-between">
                  <div>
                    <Label>{label}</Label>
                    <p className="text-xs text-neutral-500">{desc}</p>
                  </div>
                  <Switch
                    checked={Boolean((form as unknown as Record<string, boolean>)[key])}
                    onCheckedChange={(checked) => updateField(key, checked)}
                  />
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Advanced */}
        <TabsContent value="advanced" className="space-y-6 pt-4">
          <Card>
            <CardHeader>
              <CardTitle>Custom Code Injection</CardTitle>
              <CardDescription>
                Add custom HTML to the head or body of every page.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Head HTML</Label>
                <Textarea
                  value={form.customHeadHtml}
                  onChange={(e) =>
                    updateField("customHeadHtml", e.target.value)
                  }
                  className="font-mono text-xs"
                  rows={6}
                  placeholder="<!-- Custom scripts, meta tags, etc. -->"
                />
              </div>
              <div className="space-y-2">
                <Label>Body HTML</Label>
                <Textarea
                  value={form.customBodyHtml}
                  onChange={(e) =>
                    updateField("customBodyHtml", e.target.value)
                  }
                  className="font-mono text-xs"
                  rows={6}
                  placeholder="<!-- Custom scripts before closing body tag -->"
                />
              </div>
            </CardContent>
          </Card>

          <Card className="border-amber-200 bg-amber-50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-amber-800">
                <AlertTriangle className="h-4 w-4" />
                Maintenance Mode
              </CardTitle>
              <CardDescription className="text-amber-700">
                When enabled, visitors will see a maintenance message instead of your website.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <Label className="text-amber-800">Enable Maintenance Mode</Label>
                <Switch
                  checked={form.maintenanceMode}
                  onCheckedChange={(checked) =>
                    updateField("maintenanceMode", checked)
                  }
                />
              </div>
              {form.maintenanceMode && (
                <div className="space-y-2">
                  <Label className="text-amber-800">Maintenance Message</Label>
                  <Textarea
                    value={form.maintenanceMessage}
                    onChange={(e) =>
                      updateField("maintenanceMessage", e.target.value)
                    }
                    placeholder="We'll be back soon! We're making some improvements."
                    rows={3}
                  />
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
