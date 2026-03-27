"use client"

import { useState, useEffect, useCallback } from "react"
import {
  DndContext,
  closestCenter,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core"
import {
  SortableContext,
  verticalListSortingStrategy,
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
} from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { BookOpen, Star, GripVertical } from "lucide-react"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

/**
 * The 5 supported Bible versions for church-wide settings.
 * Each church can enable/disable versions, choose a default, and reorder them.
 */
const CHURCH_BIBLE_VERSIONS = [
  { code: "NIV", name: "New International Version" },
  { code: "ESV", name: "English Standard Version" },
  { code: "KJV", name: "King James Version" },
  { code: "NLT", name: "New Living Translation" },
  { code: "NASB", name: "New American Standard Bible" },
] as const

function getVersionName(code: string): string {
  return CHURCH_BIBLE_VERSIONS.find((v) => v.code === code)?.name ?? code
}

export type BibleVersionConfig = {
  enabledVersions: string[]
  defaultVersion: string
}

const DEFAULT_CONFIG: BibleVersionConfig = {
  enabledVersions: CHURCH_BIBLE_VERSIONS.map((v) => v.code),
  defaultVersion: "ESV",
}

/* ── Sortable Version Row ── */

function SortableBibleVersion({
  code,
  isEnabled,
  saving,
  enabledCount,
  onToggle,
  onSetDefault,
}: {
  code: string
  isEnabled: boolean
  saving: boolean
  enabledCount: number
  onToggle: (code: string, enabled: boolean) => void
  onSetDefault: (code: string) => void
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: code })

  const style = {
    transform: CSS.Translate.toString(transform),
    transition,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "flex items-center gap-3 rounded-lg px-3 py-2.5 transition-colors",
        isDragging && "opacity-50 shadow-lg z-50 relative bg-card",
        isEnabled ? "bg-transparent" : "bg-muted/30 opacity-60",
      )}
    >
      {/* Drag handle */}
      <button
        {...attributes}
        {...listeners}
        className="shrink-0 cursor-grab active:cursor-grabbing text-muted-foreground/40 hover:text-muted-foreground touch-none"
      >
        <GripVertical className="size-4" />
      </button>

      {/* Set as default star */}
      <button
        type="button"
        onClick={() => onSetDefault(code)}
        disabled={!isEnabled || saving}
        className={cn(
          "shrink-0 transition-colors text-muted-foreground/30 hover:text-amber-400",
          (!isEnabled || saving) && "pointer-events-none",
        )}
        title="Set as default version"
      >
        <Star className="size-4" />
      </button>

      {/* Version info */}
      <div className="flex-1 min-w-0">
        <Label
          htmlFor={`bible-${code}`}
          className="text-sm font-medium cursor-pointer"
        >
          {code}
        </Label>
        <p className="text-xs text-muted-foreground">{getVersionName(code)}</p>
      </div>

      {/* Enable/disable switch */}
      <Switch
        id={`bible-${code}`}
        checked={isEnabled}
        onCheckedChange={(checked) => onToggle(code, checked)}
        disabled={saving || (isEnabled && enabledCount === 1)}
      />
    </div>
  )
}

/* ── Static Default Version Row (pinned at top) ── */

function DefaultVersionRow({
  code,
  saving,
  enabledCount,
  onToggle,
}: {
  code: string
  saving: boolean
  enabledCount: number
  onToggle: (code: string, enabled: boolean) => void
}) {
  return (
    <div className="flex items-center gap-3 rounded-lg px-3 py-2.5 bg-transparent">
      {/* Pinned indicator instead of drag handle */}
      <div className="shrink-0 text-amber-500">
        <Star className="size-4" fill="currentColor" />
      </div>

      {/* Version info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <Label
            htmlFor={`bible-${code}`}
            className="text-sm font-medium cursor-pointer"
          >
            {code}
          </Label>
          <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
            Default
          </Badge>
        </div>
        <p className="text-xs text-muted-foreground">{getVersionName(code)}</p>
      </div>

      {/* Enable/disable switch */}
      <Switch
        id={`bible-${code}`}
        checked={true}
        onCheckedChange={(checked) => onToggle(code, checked)}
        disabled={saving || enabledCount === 1}
      />
    </div>
  )
}

/* ── Main Component ── */

export function BibleVersionSettings() {
  const [config, setConfig] = useState<BibleVersionConfig>(DEFAULT_CONFIG)
  // orderedCodes tracks all non-default version codes in display order
  const [orderedCodes, setOrderedCodes] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  )

  // Load settings
  useEffect(() => {
    fetch("/api/v1/church")
      .then((res) => res.json())
      .then((json) => {
        if (json.success && json.data?.settings) {
          const settings = json.data.settings
          const enabled: string[] =
            settings.bibleVersions ??
            CHURCH_BIBLE_VERSIONS.map((v) => v.code)
          const defaultV: string = settings.defaultBibleVersion ?? "ESV"

          setConfig({ enabledVersions: enabled, defaultVersion: defaultV })

          // Build ordered list: enabled non-default in saved order, then disabled
          const allCodes = CHURCH_BIBLE_VERSIONS.map((v) => v.code)
          const enabledNonDefault = enabled.filter((c) => c !== defaultV)
          const disabledCodes = allCodes.filter(
            (c) => !enabled.includes(c) && c !== defaultV,
          )
          setOrderedCodes([...enabledNonDefault, ...disabledCodes])
        } else {
          // No settings yet — use default order minus the default version
          setOrderedCodes(
            CHURCH_BIBLE_VERSIONS.map((v) => v.code).filter(
              (c) => c !== DEFAULT_CONFIG.defaultVersion,
            ),
          )
        }
      })
      .catch((err) => {
        console.error("Failed to load bible version settings:", err)
        setOrderedCodes(
          CHURCH_BIBLE_VERSIONS.map((v) => v.code).filter(
            (c) => c !== DEFAULT_CONFIG.defaultVersion,
          ),
        )
      })
      .finally(() => setLoading(false))
  }, [])

  async function saveConfig(newConfig: BibleVersionConfig) {
    setSaving(true)
    try {
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
      setConfig(config)
    } finally {
      setSaving(false)
    }
  }

  /** Derive enabledVersions in correct order: [default, ...orderedCodes that are enabled] */
  function buildEnabledVersions(
    defaultVersion: string,
    ordered: string[],
    enabledSet: Set<string>,
  ): string[] {
    return [
      defaultVersion,
      ...ordered.filter((c) => enabledSet.has(c)),
    ]
  }

  function handleToggleVersion(code: string, enabled: boolean) {
    const currentEnabledSet = new Set(config.enabledVersions)

    if (enabled) {
      currentEnabledSet.add(code)
    } else {
      currentEnabledSet.delete(code)
    }

    if (currentEnabledSet.size === 0) {
      toast.error("At least one Bible version must be enabled")
      return
    }

    // Compute new ordered codes and default locally to avoid stale state
    let newDefault = config.defaultVersion
    let newOrdered = [...orderedCodes]

    if (!enabled && config.defaultVersion === code) {
      // Disabling the current default — promote first available enabled version
      const firstEnabled = newOrdered.find((c) => currentEnabledSet.has(c))
      if (!firstEnabled) return
      newDefault = firstEnabled
      // Move new default out of orderedCodes (it becomes pinned), add old default back
      newOrdered = [...newOrdered.filter((c) => c !== firstEnabled), code]
    } else if (!enabled) {
      // Disabling a non-default version — move to end
      newOrdered = [...newOrdered.filter((c) => c !== code), code]
    } else if (!newOrdered.includes(code)) {
      // Enabling a version not yet in the list — append
      newOrdered = [...newOrdered, code]
    }

    setOrderedCodes(newOrdered)

    const newEnabled = buildEnabledVersions(newDefault, newOrdered, currentEnabledSet)
    const newConfig = { enabledVersions: newEnabled, defaultVersion: newDefault }
    setConfig(newConfig)
    saveConfig(newConfig)
  }

  function handleSetDefault(code: string) {
    if (!config.enabledVersions.includes(code)) {
      toast.error("Enable this version first before setting it as default")
      return
    }
    if (config.defaultVersion === code) return

    const oldDefault = config.defaultVersion
    // Remove new default from orderedCodes, add old default back (at top)
    const newOrdered = [oldDefault, ...orderedCodes.filter((c) => c !== code)]
    setOrderedCodes(newOrdered)

    const enabledSet = new Set(config.enabledVersions)
    const newEnabled = buildEnabledVersions(code, newOrdered, enabledSet)

    const newConfig = { enabledVersions: newEnabled, defaultVersion: code }
    setConfig(newConfig)
    saveConfig(newConfig)
  }

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event
      if (!over || active.id === over.id) return

      const oldIndex = orderedCodes.indexOf(active.id as string)
      const newIndex = orderedCodes.indexOf(over.id as string)
      if (oldIndex === -1 || newIndex === -1) return

      const newOrdered = arrayMove(orderedCodes, oldIndex, newIndex)
      setOrderedCodes(newOrdered)

      // Rebuild enabledVersions in new order
      const enabledSet = new Set(config.enabledVersions)
      const newEnabled = buildEnabledVersions(
        config.defaultVersion,
        newOrdered,
        enabledSet,
      )

      const newConfig = { ...config, enabledVersions: newEnabled }
      setConfig(newConfig)
      saveConfig(newConfig)
    },
    [orderedCodes, config],
  )

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
          version is shown first when visitors view scripture passages. Drag to
          reorder.
        </p>

        <div className="space-y-1">
          {/* Default version — pinned at top */}
          <DefaultVersionRow
            code={config.defaultVersion}
            saving={saving}
            enabledCount={config.enabledVersions.length}
            onToggle={handleToggleVersion}
          />

          {/* Remaining versions — draggable */}
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={orderedCodes}
              strategy={verticalListSortingStrategy}
            >
              {orderedCodes.map((code) => (
                <SortableBibleVersion
                  key={code}
                  code={code}
                  isEnabled={config.enabledVersions.includes(code)}
                  saving={saving}
                  enabledCount={config.enabledVersions.length}
                  onToggle={handleToggleVersion}
                  onSetDefault={handleSetDefault}
                />
              ))}
            </SortableContext>
          </DndContext>
        </div>

        <p className="text-xs text-muted-foreground">
          Click the star to set a version as the default. Toggle the switch to
          show or hide a version on your website. Drag to reorder.
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
