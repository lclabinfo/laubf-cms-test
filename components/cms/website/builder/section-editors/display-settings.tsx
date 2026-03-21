"use client"

import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { cn } from "@/lib/utils"
import {
  EditorInput,
  EditorToggle,
  EditorSelect,
} from "./shared"

export interface DisplaySettingsData {
  colorScheme: string
  paddingY: string
  containerWidth: string
  enableAnimations: boolean
  visible: boolean
  label: string
}

interface DisplaySettingsProps {
  data: DisplaySettingsData
  onChange: (data: DisplaySettingsData) => void
}

export function DisplaySettings({ data, onChange }: DisplaySettingsProps) {
  function update(field: keyof DisplaySettingsData, value: string | boolean) {
    onChange({ ...data, [field]: value })
  }

  return (
    <div className="space-y-6">
      {/* Color Scheme */}
      <div className="space-y-3">
        <Label className="text-sm font-medium">Color Scheme</Label>
        <div className="grid grid-cols-3 gap-2">
          {[
            { value: "LIGHT", label: "Light", bg: "bg-white", text: "bg-neutral-800" },
            { value: "DARK", label: "Dark", bg: "bg-[#0d0d0d]", text: "bg-white" },
            { value: "BRAND", label: "Brand", bg: "bg-[#1a1a2e]", text: "bg-white" },
          ].map((scheme) => (
            <button
              key={scheme.value}
              type="button"
              onClick={() => update("colorScheme", scheme.value)}
              className={cn(
                "flex flex-col rounded-lg border-2 overflow-hidden transition-all cursor-pointer",
                data.colorScheme === scheme.value
                  ? "border-primary ring-1 ring-primary/20"
                  : "border-muted-foreground/30 hover:border-muted-foreground/40"
              )}
            >
              <div className={cn("p-2.5 flex flex-col gap-1", scheme.bg)}>
                <div className={cn("h-1 w-3/4 rounded-full opacity-80", scheme.text)} />
                <div className={cn("h-1 w-full rounded-full opacity-50", scheme.text)} />
                <div className={cn("h-1 w-2/3 rounded-full opacity-30", scheme.text)} />
              </div>
              <div className="px-1 py-1 text-[10px] font-medium text-center border-t">
                {scheme.label}
              </div>
            </button>
          ))}
        </div>
      </div>

      <Separator />

      {/* Vertical Padding */}
      <EditorSelect
        label="Vertical Padding"
        value={data.paddingY}
        onValueChange={(v) => update("paddingY", v)}
        options={[
          { value: "NONE", label: "None" },
          { value: "COMPACT", label: "Compact" },
          { value: "DEFAULT", label: "Default" },
          { value: "SPACIOUS", label: "Spacious" },
        ]}
      />

      {/* Container Width */}
      <EditorSelect
        label="Container Width"
        value={data.containerWidth}
        onValueChange={(v) => update("containerWidth", v)}
        options={[
          { value: "NARROW", label: "Narrow" },
          { value: "STANDARD", label: "Standard" },
          { value: "FULL", label: "Full" },
        ]}
      />

      <Separator />

      {/* Animations */}
      <EditorToggle
        label="Animations"
        description="Enable scroll and entrance animations"
        checked={data.enableAnimations}
        onCheckedChange={(v) => update("enableAnimations", v)}
      />

      {/* Visibility */}
      <EditorToggle
        label="Visible"
        description="Hidden sections are only visible in the builder"
        checked={data.visible}
        onCheckedChange={(v) => update("visible", v)}
      />

      <Separator />

      {/* Admin Label */}
      <EditorInput
        label="Section Label"
        value={data.label}
        onChange={(val) => update("label", val)}
        placeholder="Optional admin-only label"
        description="An internal label to help you identify this section. Not shown on the website."
      />
    </div>
  )
}
