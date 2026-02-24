"use client"

import { useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Slider } from "@/components/ui/slider"
import { Separator } from "@/components/ui/separator"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Palette, Type, Layout, Save, Code } from "lucide-react"

interface ThemeData {
  theme: {
    id: string
    name: string
    slug: string
    description: string | null
  } | null
  customization: {
    id: string
    primaryColor: string | null
    secondaryColor: string | null
    backgroundColor: string | null
    textColor: string | null
    headingColor: string | null
    headingFont: string | null
    bodyFont: string | null
    baseFontSize: number | null
    borderRadius: string | null
    navbarStyle: Record<string, unknown> | null
    footerStyle: Record<string, unknown> | null
    buttonStyle: Record<string, unknown> | null
    cardStyle: Record<string, unknown> | null
    customCss: string | null
  } | null
}

const FONT_OPTIONS = [
  { value: "Inter", label: "Inter" },
  { value: "Helvetica Neue", label: "Helvetica Neue" },
  { value: "Open Sans", label: "Open Sans" },
  { value: "Roboto", label: "Roboto" },
  { value: "Lato", label: "Lato" },
  { value: "Poppins", label: "Poppins" },
  { value: "Montserrat", label: "Montserrat" },
  { value: "Merriweather", label: "Merriweather" },
  { value: "Playfair Display", label: "Playfair Display" },
  { value: "Space Grotesk", label: "Space Grotesk" },
  { value: "DM Sans", label: "DM Sans" },
]

const RADIUS_OPTIONS = [
  { value: "0", label: "Square (0px)" },
  { value: "0.25rem", label: "Small (4px)" },
  { value: "0.5rem", label: "Medium (8px)" },
  { value: "0.75rem", label: "Large (12px)" },
  { value: "1rem", label: "XL (16px)" },
  { value: "9999px", label: "Full (pill)" },
]

const PRESET_COLORS = [
  "#3667B1",
  "#4F46E5",
  "#7C3AED",
  "#DB2777",
  "#EA580C",
  "#059669",
  "#0D0D0D",
]

export default function ThemeManagerPage() {
  const [themeData, setThemeData] = useState<ThemeData | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const [form, setForm] = useState({
    primaryColor: "#3667B1",
    secondaryColor: "#061B4F",
    backgroundColor: "#FAFAFA",
    textColor: "#0D0D0D",
    headingColor: "#0D0D0D",
    headingFont: "Helvetica Neue",
    bodyFont: "Helvetica Neue",
    baseFontSize: 16,
    borderRadius: "0.5rem",
    customCss: "",
  })

  const fetchTheme = useCallback(async () => {
    try {
      const res = await fetch("/api/v1/theme")
      if (res.ok) {
        const data: ThemeData = await res.json()
        setThemeData(data)
        if (data.customization) {
          setForm({
            primaryColor: data.customization.primaryColor || "#3667B1",
            secondaryColor: data.customization.secondaryColor || "#061B4F",
            backgroundColor: data.customization.backgroundColor || "#FAFAFA",
            textColor: data.customization.textColor || "#0D0D0D",
            headingColor: data.customization.headingColor || "#0D0D0D",
            headingFont: data.customization.headingFont || "Helvetica Neue",
            bodyFont: data.customization.bodyFont || "Helvetica Neue",
            baseFontSize: data.customization.baseFontSize || 16,
            borderRadius: data.customization.borderRadius || "0.5rem",
            customCss: data.customization.customCss || "",
          })
        }
      }
    } catch (error) {
      console.error("Failed to fetch theme:", error)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchTheme()
  }, [fetchTheme])

  const handleSave = async () => {
    setSaving(true)
    try {
      await fetch("/api/v1/theme", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          themeId: themeData?.theme?.id,
          ...form,
        }),
      })
      fetchTheme()
    } catch (error) {
      console.error("Failed to save theme:", error)
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 text-neutral-500">
        Loading theme...
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Theme</h1>
          <p className="text-sm text-neutral-500">
            Customize your website appearance and design tokens.
          </p>
        </div>
        <Button onClick={handleSave} disabled={saving}>
          <Save className="mr-2 h-4 w-4" />
          {saving ? "Saving..." : "Save Changes"}
        </Button>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Controls */}
        <div className="w-full lg:w-[400px] space-y-6">
          <Tabs defaultValue="colors">
            <TabsList className="w-full">
              <TabsTrigger value="colors" className="flex-1">
                <Palette className="mr-2 h-3.5 w-3.5" />
                Colors
              </TabsTrigger>
              <TabsTrigger value="typography" className="flex-1">
                <Type className="mr-2 h-3.5 w-3.5" />
                Typography
              </TabsTrigger>
              <TabsTrigger value="layout" className="flex-1">
                <Layout className="mr-2 h-3.5 w-3.5" />
                Layout
              </TabsTrigger>
            </TabsList>

            <TabsContent value="colors" className="space-y-6 pt-4">
              {/* Primary Color */}
              <div className="space-y-3">
                <Label>Primary Color</Label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={form.primaryColor}
                    onChange={(e) =>
                      setForm({ ...form, primaryColor: e.target.value })
                    }
                    className="h-9 w-9 rounded border cursor-pointer"
                  />
                  <Input
                    value={form.primaryColor}
                    onChange={(e) =>
                      setForm({ ...form, primaryColor: e.target.value })
                    }
                    className="flex-1"
                  />
                </div>
                <div className="flex gap-2">
                  {PRESET_COLORS.map((color) => (
                    <button
                      key={color}
                      onClick={() => setForm({ ...form, primaryColor: color })}
                      className="h-7 w-7 rounded-full border-2 transition-all hover:scale-110"
                      style={{
                        backgroundColor: color,
                        borderColor:
                          form.primaryColor === color
                            ? "hsl(0 0% 9%)"
                            : "transparent",
                      }}
                    />
                  ))}
                </div>
              </div>

              <Separator />

              {/* Secondary Color */}
              <div className="space-y-3">
                <Label>Secondary Color</Label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={form.secondaryColor}
                    onChange={(e) =>
                      setForm({ ...form, secondaryColor: e.target.value })
                    }
                    className="h-9 w-9 rounded border cursor-pointer"
                  />
                  <Input
                    value={form.secondaryColor}
                    onChange={(e) =>
                      setForm({ ...form, secondaryColor: e.target.value })
                    }
                    className="flex-1"
                  />
                </div>
              </div>

              <Separator />

              {/* Background Color */}
              <div className="space-y-3">
                <Label>Background Color</Label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={form.backgroundColor}
                    onChange={(e) =>
                      setForm({ ...form, backgroundColor: e.target.value })
                    }
                    className="h-9 w-9 rounded border cursor-pointer"
                  />
                  <Input
                    value={form.backgroundColor}
                    onChange={(e) =>
                      setForm({ ...form, backgroundColor: e.target.value })
                    }
                    className="flex-1"
                  />
                </div>
              </div>

              <Separator />

              {/* Text Color */}
              <div className="space-y-3">
                <Label>Text Color</Label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={form.textColor}
                    onChange={(e) =>
                      setForm({ ...form, textColor: e.target.value })
                    }
                    className="h-9 w-9 rounded border cursor-pointer"
                  />
                  <Input
                    value={form.textColor}
                    onChange={(e) =>
                      setForm({ ...form, textColor: e.target.value })
                    }
                    className="flex-1"
                  />
                </div>
              </div>

              <Separator />

              {/* Heading Color */}
              <div className="space-y-3">
                <Label>Heading Color</Label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={form.headingColor}
                    onChange={(e) =>
                      setForm({ ...form, headingColor: e.target.value })
                    }
                    className="h-9 w-9 rounded border cursor-pointer"
                  />
                  <Input
                    value={form.headingColor}
                    onChange={(e) =>
                      setForm({ ...form, headingColor: e.target.value })
                    }
                    className="flex-1"
                  />
                </div>
              </div>
            </TabsContent>

            <TabsContent value="typography" className="space-y-6 pt-4">
              <div className="space-y-2">
                <Label>Heading Font</Label>
                <Select
                  value={form.headingFont}
                  onValueChange={(v) => setForm({ ...form, headingFont: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {FONT_OPTIONS.map((font) => (
                      <SelectItem key={font.value} value={font.value}>
                        {font.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Body Font</Label>
                <Select
                  value={form.bodyFont}
                  onValueChange={(v) => setForm({ ...form, bodyFont: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {FONT_OPTIONS.map((font) => (
                      <SelectItem key={font.value} value={font.value}>
                        {font.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-3">
                <Label>Base Font Size: {form.baseFontSize}px</Label>
                <div className="flex items-center gap-4">
                  <span className="text-xs">A</span>
                  <Slider
                    value={[form.baseFontSize]}
                    onValueChange={([v]) => setForm({ ...form, baseFontSize: v })}
                    min={12}
                    max={20}
                    step={1}
                    className="flex-1"
                  />
                  <span className="text-lg">A</span>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="layout" className="space-y-6 pt-4">
              <div className="space-y-2">
                <Label>Border Radius</Label>
                <Select
                  value={form.borderRadius}
                  onValueChange={(v) => setForm({ ...form, borderRadius: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {RADIUS_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </TabsContent>
          </Tabs>

          {/* Custom CSS */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-2">
                <Code className="h-4 w-4" />
                Custom CSS
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                value={form.customCss}
                onChange={(e) => setForm({ ...form, customCss: e.target.value })}
                placeholder="/* Custom CSS overrides */"
                className="font-mono text-xs"
                rows={8}
              />
            </CardContent>
          </Card>
        </div>

        {/* Preview */}
        <div className="flex-1 bg-neutral-100 rounded-lg border overflow-hidden">
          <div className="bg-white border-b px-4 py-2 text-xs text-neutral-500 flex justify-between">
            <span>Live Preview</span>
            <span>Theme: {themeData?.theme?.name || "Default"}</span>
          </div>
          <div className="p-8 overflow-y-auto" style={{ maxHeight: "calc(100vh - 240px)" }}>
            <div
              className="bg-white shadow-sm min-h-[500px] w-full max-w-3xl mx-auto overflow-hidden"
              style={{
                borderRadius: form.borderRadius,
                fontFamily: form.bodyFont,
                color: form.textColor,
                backgroundColor: form.backgroundColor,
              }}
            >
              {/* Preview Hero */}
              <div
                className="px-8 py-16 text-white text-center"
                style={{ backgroundColor: form.primaryColor }}
              >
                <h1
                  className="text-3xl font-bold mb-3"
                  style={{ fontFamily: form.headingFont, color: "white" }}
                >
                  Welcome to Our Church
                </h1>
                <p className="text-base opacity-90" style={{ fontSize: form.baseFontSize }}>
                  A community of faith, hope, and love
                </p>
                <button
                  className="mt-6 px-6 py-2 bg-white font-medium text-sm"
                  style={{
                    color: form.primaryColor,
                    borderRadius: form.borderRadius,
                  }}
                >
                  Learn More
                </button>
              </div>

              {/* Preview Content */}
              <div className="p-8 space-y-6">
                <h2
                  className="text-2xl font-bold"
                  style={{
                    fontFamily: form.headingFont,
                    color: form.headingColor,
                  }}
                >
                  About Our Community
                </h2>
                <p
                  className="leading-relaxed"
                  style={{ fontSize: form.baseFontSize }}
                >
                  Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do
                  eiusmod tempor incididunt ut labore et dolore magna aliqua.
                </p>

                <div className="grid grid-cols-2 gap-4">
                  {["Service Times", "Location"].map((title) => (
                    <div
                      key={title}
                      className="p-4 border"
                      style={{ borderRadius: form.borderRadius }}
                    >
                      <h3
                        className="font-semibold mb-1"
                        style={{
                          fontFamily: form.headingFont,
                          color: form.headingColor,
                        }}
                      >
                        {title}
                      </h3>
                      <p className="text-sm opacity-70">
                        Sample content here
                      </p>
                    </div>
                  ))}
                </div>

                <div className="flex gap-3">
                  <button
                    className="px-5 py-2 text-white text-sm font-medium"
                    style={{
                      backgroundColor: form.primaryColor,
                      borderRadius: form.borderRadius,
                    }}
                  >
                    Primary Button
                  </button>
                  <button
                    className="px-5 py-2 text-sm font-medium border"
                    style={{
                      color: form.primaryColor,
                      borderColor: form.primaryColor,
                      borderRadius: form.borderRadius,
                    }}
                  >
                    Secondary Button
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
