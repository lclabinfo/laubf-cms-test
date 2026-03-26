"use client"

import { useState, useEffect } from "react"
import { BookOpen, Star } from "lucide-react"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

/**
 * The 5 supported Bible versions for church-wide settings.
 * Each church can enable/disable versions and choose a default.
 */
const CHURCH_BIBLE_VERSIONS = [
  { code: "NIV", name: "New International Version" },
  { code: "ESV", name: "English Standard Version" },
  { code: "KJV", name: "King James Version" },
  { code: "NLT", name: "New Living Translation" },
  { code: "NASB", name: "New American Standard Bible" },
] as const

export type BibleVersionConfig = {
  enabledVersions: string[]
  defaultVersion: string
}

const DEFAULT_CONFIG: BibleVersionConfig = {
  enabledVersions: CHURCH_BIBLE_VERSIONS.map((v) => v.code),
  defaultVersion: "ESV",
}

export function BibleVersionSettings() {
  const [config, setConfig] = useState<BibleVersionConfig>(DEFAULT_CONFIG)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  // Load settings from the church settings JSON
  useEffect(() => {
    fetch("/api/v1/church")
      .then((res) => res.json())
      .then((json) => {
        if (json.success && json.data?.settings) {
          const settings = json.data.settings
          setConfig({
            enabledVersions:
              settings.bibleVersions ??
              CHURCH_BIBLE_VERSIONS.map((v) => v.code),
            defaultVersion: settings.defaultBibleVersion ?? "ESV",
          })
        }
      })
      .catch((err) => {
        console.error("Failed to load bible version settings:", err)
      })
      .finally(() => setLoading(false))
  }, [])

  async function saveConfig(newConfig: BibleVersionConfig) {
    setSaving(true)
    try {
      // First fetch existing settings to merge
      const getRes = await fetch("/api/v1/church")
      const getJson = await getRes.json()
      const existingSettings =
        getJson.success && getJson.data?.settings
          ? getJson.data.settings
          : {}

      const res = await fetch("/api/v1/church", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          settings: {
            ...existingSettings,
            bibleVersions: newConfig.enabledVersions,
            defaultBibleVersion: newConfig.defaultVersion,
          },
        }),
      })
      if (!res.ok) throw new Error("Failed to save")
      const json = await res.json()
      if (!json.success) throw new Error(json.error?.message ?? "Save failed")
      toast.success("Bible version settings saved")
    } catch (err) {
      console.error("Failed to save bible version settings:", err)
      toast.error("Failed to save Bible version settings")
      // Revert
      setConfig(config)
    } finally {
      setSaving(false)
    }
  }

  function handleToggleVersion(code: string, enabled: boolean) {
    const newEnabled = enabled
      ? [...config.enabledVersions, code]
      : config.enabledVersions.filter((v) => v !== code)

    // Must have at least one enabled version
    if (newEnabled.length === 0) {
      toast.error("At least one Bible version must be enabled")
      return
    }

    // If disabling the default version, switch default to the first remaining enabled
    let newDefault = config.defaultVersion
    if (!enabled && config.defaultVersion === code) {
      newDefault = newEnabled[0]
    }

    const newConfig = {
      enabledVersions: newEnabled,
      defaultVersion: newDefault,
    }
    setConfig(newConfig)
    saveConfig(newConfig)
  }

  function handleSetDefault(code: string) {
    // Can only set an enabled version as default
    if (!config.enabledVersions.includes(code)) {
      toast.error("Enable this version first before setting it as default")
      return
    }

    if (config.defaultVersion === code) return

    const newConfig = { ...config, defaultVersion: code }
    setConfig(newConfig)
    saveConfig(newConfig)
  }

  if (loading) {
    return (
      <section id="bible-versions" className="rounded-xl border bg-card">
        <div className="px-5 py-3 border-b flex items-center gap-2">
          <BookOpen className="size-4 text-muted-foreground" />
          <h2 className="text-sm font-semibold flex-1">Bible Versions</h2>
        </div>
        <div className="p-5">
          <p className="text-sm text-muted-foreground">Loading...</p>
        </div>
      </section>
    )
  }

  return (
    <section id="bible-versions" className="rounded-xl border bg-card">
      <div className="px-5 py-3 border-b flex items-center gap-2">
        <BookOpen className="size-4 text-muted-foreground" />
        <h2 className="text-sm font-semibold flex-1">Bible Versions</h2>
        {saving && (
          <span className="text-xs text-muted-foreground">Saving...</span>
        )}
      </div>
      <div className="p-5 space-y-4">
        <p className="text-sm text-muted-foreground">
          Choose which Bible versions are available on your website. The default
          version is shown first when visitors view scripture passages.
        </p>

        <div className="space-y-1">
          {CHURCH_BIBLE_VERSIONS.map((version) => {
            const isEnabled = config.enabledVersions.includes(version.code)
            const isDefault = config.defaultVersion === version.code

            return (
              <div
                key={version.code}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 transition-colors",
                  isEnabled
                    ? "bg-transparent"
                    : "bg-muted/30 opacity-60"
                )}
              >
                {/* Default star button */}
                <button
                  type="button"
                  onClick={() => handleSetDefault(version.code)}
                  disabled={!isEnabled || saving}
                  className={cn(
                    "shrink-0 transition-colors",
                    isDefault
                      ? "text-amber-500"
                      : "text-muted-foreground/30 hover:text-amber-400",
                    (!isEnabled || saving) && "pointer-events-none"
                  )}
                  title={
                    isDefault
                      ? "Default version"
                      : "Set as default version"
                  }
                >
                  <Star
                    className="size-4"
                    fill={isDefault ? "currentColor" : "none"}
                  />
                </button>

                {/* Version info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <Label
                      htmlFor={`bible-${version.code}`}
                      className="text-sm font-medium cursor-pointer"
                    >
                      {version.code}
                    </Label>
                    {isDefault && (
                      <Badge
                        variant="secondary"
                        className="text-[10px] px-1.5 py-0"
                      >
                        Default
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {version.name}
                  </p>
                </div>

                {/* Enable/disable switch */}
                <Switch
                  id={`bible-${version.code}`}
                  checked={isEnabled}
                  onCheckedChange={(checked) =>
                    handleToggleVersion(version.code, checked)
                  }
                  disabled={saving || (isEnabled && config.enabledVersions.length === 1)}
                />
              </div>
            )
          })}
        </div>

        <p className="text-xs text-muted-foreground">
          Click the star to set a version as the default. Toggle the switch to
          show or hide a version on your website.
        </p>
      </div>
    </section>
  )
}

/**
 * Hook to fetch the church's Bible version configuration.
 * Used by other components (e.g., message editor) to show the default version info.
 */
export function useBibleVersionConfig() {
  const [config, setConfig] = useState<BibleVersionConfig | null>(null)

  useEffect(() => {
    fetch("/api/v1/church")
      .then((res) => res.json())
      .then((json) => {
        if (json.success && json.data?.settings) {
          const settings = json.data.settings
          setConfig({
            enabledVersions:
              settings.bibleVersions ??
              CHURCH_BIBLE_VERSIONS.map((v) => v.code),
            defaultVersion: settings.defaultBibleVersion ?? "ESV",
          })
        } else {
          setConfig(DEFAULT_CONFIG)
        }
      })
      .catch(() => {
        setConfig(DEFAULT_CONFIG)
      })
  }, [])

  return config
}
