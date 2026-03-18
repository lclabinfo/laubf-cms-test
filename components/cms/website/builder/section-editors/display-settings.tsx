"use client"

import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
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
      {/* Color Scheme - RadioGroup is specialized, keep inline */}
      <div className="space-y-3">
        <Label className="text-sm font-medium">Color Scheme</Label>
        <RadioGroup
          value={data.colorScheme}
          onValueChange={(v) => update("colorScheme", v)}
          className="flex gap-4"
        >
          <div className="flex items-center gap-2">
            <RadioGroupItem value="LIGHT" id="cs-light" />
            <Label htmlFor="cs-light" className="cursor-pointer font-normal">
              Light
            </Label>
          </div>
          <div className="flex items-center gap-2">
            <RadioGroupItem value="DARK" id="cs-dark" />
            <Label htmlFor="cs-dark" className="cursor-pointer font-normal">
              Dark
            </Label>
          </div>
        </RadioGroup>
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
