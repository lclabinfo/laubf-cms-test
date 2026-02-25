"use client"

import { Sun, Moon, Monitor, Check, Palette } from "lucide-react"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { cn } from "@/lib/utils"
import { useCmsTheme } from "@/components/cms/theme-provider"

type ThemeOption = {
  value: "light" | "dark" | "system"
  label: string
  icon: React.ComponentType<{ className?: string }>
}

const themeOptions: ThemeOption[] = [
  { value: "light", label: "Light", icon: Sun },
  { value: "dark", label: "Dark", icon: Moon },
  { value: "system", label: "System", icon: Monitor },
]

type AccentOption = {
  value: "neutral" | "blue" | "green" | "violet" | "orange"
  label: string
  /** The swatch color shown in the UI */
  swatch: string
}

const accentOptions: AccentOption[] = [
  { value: "neutral", label: "Neutral", swatch: "bg-[oklch(0.45_0_0)]" },
  { value: "blue", label: "Blue", swatch: "bg-[oklch(0.55_0.2_255)]" },
  { value: "green", label: "Green", swatch: "bg-[oklch(0.55_0.17_155)]" },
  { value: "violet", label: "Violet", swatch: "bg-[oklch(0.55_0.2_295)]" },
  { value: "orange", label: "Orange", swatch: "bg-[oklch(0.65_0.2_50)]" },
]

export default function SettingsPage() {
  const { theme, accent, setTheme, setAccent } = useCmsTheme()

  return (
    <div className="mx-auto w-full max-w-2xl space-y-6">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Customize your CMS experience.
        </p>
      </div>

      {/* Appearance card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Palette className="size-4" />
            Appearance
          </CardTitle>
          <CardDescription>
            Choose your preferred theme and accent color for the CMS interface.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Theme selector */}
          <div className="space-y-3">
            <Label>Theme</Label>
            <div className="grid grid-cols-3 gap-3">
              {themeOptions.map((opt) => {
                const active = theme === opt.value
                const Icon = opt.icon
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setTheme(opt.value)}
                    className={cn(
                      "flex flex-col items-center gap-2 rounded-lg border-2 p-4 text-sm font-medium transition-colors",
                      active
                        ? "border-primary bg-primary/5 text-foreground"
                        : "border-transparent bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground"
                    )}
                  >
                    <Icon className="size-5" />
                    {opt.label}
                  </button>
                )
              })}
            </div>
          </div>

          <Separator />

          {/* Accent color selector */}
          <div className="space-y-3">
            <Label>Accent Color</Label>
            <p className="text-muted-foreground text-xs">
              This changes the primary color used across buttons, links, and
              highlights.
            </p>
            <div className="flex flex-wrap gap-3">
              {accentOptions.map((opt) => {
                const active = accent === opt.value
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setAccent(opt.value)}
                    className="flex flex-col items-center gap-1.5"
                  >
                    <span
                      className={cn(
                        "relative flex size-9 items-center justify-center rounded-full transition-shadow",
                        opt.swatch,
                        active && "ring-2 ring-primary ring-offset-2 ring-offset-background"
                      )}
                    >
                      {active && (
                        <Check className="size-4 text-white" />
                      )}
                    </span>
                    <span
                      className={cn(
                        "text-xs",
                        active
                          ? "font-medium text-foreground"
                          : "text-muted-foreground"
                      )}
                    >
                      {opt.label}
                    </span>
                  </button>
                )
              })}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
