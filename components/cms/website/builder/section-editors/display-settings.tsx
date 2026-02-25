"use client"

import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"

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
      <div className="space-y-2">
        <Label className="text-sm font-medium">Vertical Padding</Label>
        <Select
          value={data.paddingY}
          onValueChange={(v) => update("paddingY", v)}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="NONE">None</SelectItem>
            <SelectItem value="COMPACT">Compact</SelectItem>
            <SelectItem value="DEFAULT">Default</SelectItem>
            <SelectItem value="SPACIOUS">Spacious</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Container Width */}
      <div className="space-y-2">
        <Label className="text-sm font-medium">Container Width</Label>
        <Select
          value={data.containerWidth}
          onValueChange={(v) => update("containerWidth", v)}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="NARROW">Narrow</SelectItem>
            <SelectItem value="STANDARD">Standard</SelectItem>
            <SelectItem value="FULL">Full</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Separator />

      {/* Animations */}
      <div className="flex items-center justify-between">
        <div className="space-y-0.5">
          <Label className="text-sm font-medium">Animations</Label>
          <p className="text-xs text-muted-foreground">
            Enable scroll and entrance animations
          </p>
        </div>
        <Switch
          checked={data.enableAnimations}
          onCheckedChange={(v) => update("enableAnimations", v)}
        />
      </div>

      {/* Visibility */}
      <div className="flex items-center justify-between">
        <div className="space-y-0.5">
          <Label className="text-sm font-medium">Visible</Label>
          <p className="text-xs text-muted-foreground">
            Hidden sections are only visible in the builder
          </p>
        </div>
        <Switch
          checked={data.visible}
          onCheckedChange={(v) => update("visible", v)}
        />
      </div>

      <Separator />

      {/* Admin Label */}
      <div className="space-y-2">
        <Label className="text-sm font-medium">Section Label</Label>
        <Input
          value={data.label}
          onChange={(e) => update("label", e.target.value)}
          placeholder="Optional admin-only label"
        />
        <p className="text-xs text-muted-foreground">
          An internal label to help you identify this section. Not shown on the
          website.
        </p>
      </div>
    </div>
  )
}
