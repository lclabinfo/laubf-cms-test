"use client"

import { useState } from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { ImageIcon, X } from "lucide-react"
import { MediaPickerDialog } from "@/components/cms/media/media-picker-dialog"

// --- ImagePickerField ---

export interface ImagePickerFieldProps {
  label: string
  value: string
  onChange: (url: string) => void
}

export function ImagePickerField({
  label,
  value,
  onChange,
}: ImagePickerFieldProps) {
  const [pickerOpen, setPickerOpen] = useState(false)
  return (
    <div className="space-y-1.5">
      <Label className="text-xs text-muted-foreground">{label}</Label>
      {value ? (
        <div className="relative group rounded-md border overflow-hidden h-20">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={value} alt="" className="size-full object-cover" />
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center gap-1.5 opacity-0 group-hover:opacity-100">
            <Button
              size="sm"
              variant="secondary"
              className="h-7 text-xs"
              onClick={() => setPickerOpen(true)}
            >
              Replace
            </Button>
            <Button
              size="sm"
              variant="secondary"
              className="h-7 text-xs"
              onClick={() => onChange("")}
            >
              <X className="size-3" />
            </Button>
          </div>
        </div>
      ) : (
        <Button
          type="button"
          variant="outline"
          className="w-full justify-start gap-2 text-muted-foreground font-normal"
          onClick={() => setPickerOpen(true)}
        >
          <ImageIcon className="size-3.5" />
          Choose image...
        </Button>
      )}
      <MediaPickerDialog
        open={pickerOpen}
        onOpenChange={setPickerOpen}
        folder="Website"
        onSelect={(url) => onChange(url)}
      />
    </div>
  )
}

// --- ButtonConfig ---

export interface ButtonConfigProps {
  id: string
  label: string
  buttonData: { label: string; href: string; visible: boolean }
  onChange: (data: { label: string; href: string; visible: boolean }) => void
}

export function ButtonConfig({
  id,
  label,
  buttonData,
  onChange,
}: ButtonConfigProps) {
  return (
    <div className="space-y-3 rounded-lg border p-4">
      <div className="flex items-center justify-between">
        <Label className="text-sm font-medium">{label}</Label>
        <Switch
          id={`${id}-visible`}
          checked={buttonData.visible}
          onCheckedChange={(v) => onChange({ ...buttonData, visible: v })}
        />
      </div>
      {buttonData.visible && (
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">
              Button Text
            </Label>
            <Input
              value={buttonData.label}
              onChange={(e) =>
                onChange({ ...buttonData, label: e.target.value })
              }
              placeholder="Learn More"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Link URL</Label>
            <Input
              value={buttonData.href}
              onChange={(e) =>
                onChange({ ...buttonData, href: e.target.value })
              }
              placeholder="/about"
            />
          </div>
        </div>
      )}
    </div>
  )
}
