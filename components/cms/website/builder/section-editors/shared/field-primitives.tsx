"use client"

import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

// --- EditorField ---

export interface EditorFieldProps {
  label: string
  description?: string
  labelSize?: "sm" | "xs"
  children: React.ReactNode
}

export function EditorField({
  label,
  description,
  labelSize = "xs",
  children,
}: EditorFieldProps) {
  return (
    <div className="space-y-1.5">
      <Label
        className={
          labelSize === "sm"
            ? "text-sm font-medium"
            : "text-xs text-muted-foreground"
        }
      >
        {label}
      </Label>
      {children}
      {description && (
        <p className="text-xs text-muted-foreground">{description}</p>
      )}
    </div>
  )
}

// --- EditorInput ---

export interface EditorInputProps {
  label: string
  value: string
  onChange: (value: string) => void
  placeholder?: string
  description?: string
  labelSize?: "sm" | "xs"
  type?: "text" | "number" | "url" | "email"
  min?: number
  max?: number
  className?: string
}

export function EditorInput({
  label,
  value,
  onChange,
  placeholder,
  description,
  labelSize = "xs",
  type = "text",
  min,
  max,
  className,
}: EditorInputProps) {
  return (
    <EditorField label={label} description={description} labelSize={labelSize}>
      <Input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        min={min}
        max={max}
        className={
          type === "number"
            ? `[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none${className ? ` ${className}` : ""}`
            : className
        }
      />
    </EditorField>
  )
}

// --- EditorTextarea ---

export interface EditorTextareaProps {
  label: string
  value: string
  onChange: (value: string) => void
  placeholder?: string
  rows?: number
  labelSize?: "sm" | "xs"
  className?: string
  spellCheck?: boolean
}

export function EditorTextarea({
  label,
  value,
  onChange,
  placeholder,
  rows,
  labelSize = "xs",
  className,
  spellCheck,
}: EditorTextareaProps) {
  return (
    <EditorField label={label} labelSize={labelSize}>
      <Textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        spellCheck={spellCheck}
        className={className ?? "min-h-[80px]"}
        style={!className && rows ? { minHeight: `${rows * 20}px` } : undefined}
      />
    </EditorField>
  )
}

// --- EditorToggle ---

export interface EditorToggleProps {
  label: string
  description?: string
  checked: boolean
  onCheckedChange: (checked: boolean) => void
  bordered?: boolean
}

export function EditorToggle({
  label,
  description,
  checked,
  onCheckedChange,
  bordered = false,
}: EditorToggleProps) {
  const inner = (
    <>
      <div className="space-y-0.5">
        <Label className="text-sm font-medium">{label}</Label>
        {description && (
          <p className="text-xs text-muted-foreground">{description}</p>
        )}
      </div>
      <Switch checked={checked} onCheckedChange={onCheckedChange} />
    </>
  )

  if (bordered) {
    return (
      <div className="flex items-center justify-between rounded-lg border p-3">
        {inner}
      </div>
    )
  }

  return (
    <div className="flex items-center justify-between">{inner}</div>
  )
}

// --- EditorSelect ---

export interface EditorSelectProps {
  label: string
  value: string
  onValueChange: (value: string) => void
  options: Array<{ value: string; label: string }>
  placeholder?: string
  labelSize?: "sm" | "xs"
  className?: string
}

export function EditorSelect({
  label,
  value,
  onValueChange,
  options,
  placeholder,
  labelSize = "xs",
  className,
}: EditorSelectProps) {
  return (
    <EditorField label={label} labelSize={labelSize}>
      <Select value={value} onValueChange={onValueChange}>
        <SelectTrigger className={className}>
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          {options.map((opt) => (
            <SelectItem key={opt.value} value={opt.value}>
              {opt.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </EditorField>
  )
}

// --- EditorButtonGroup ---

export interface EditorButtonGroupProps {
  label?: string
  value: string
  onChange: (value: string) => void
  options: Array<{ value: string; label: string }>
  size?: "sm" | "default"
}

export function EditorButtonGroup({
  label,
  value,
  onChange,
  options,
  size = "default",
}: EditorButtonGroupProps) {
  const buttons = (
    <div className="flex gap-2">
      {options.map((opt) => {
        const isActive = value === opt.value
        return (
          <Button
            key={opt.value}
            type="button"
            variant={isActive ? "default" : "outline"}
            size={size === "sm" ? "sm" : "default"}
            onClick={() => onChange(opt.value)}
            className={cn(
              "text-xs font-medium",
              !isActive && "text-muted-foreground hover:text-foreground"
            )}
          >
            {opt.label}
          </Button>
        )
      })}
    </div>
  )

  if (!label) return buttons

  return (
    <div className="space-y-1.5">
      <Label className="text-sm font-medium">{label}</Label>
      {buttons}
    </div>
  )
}

// --- TwoColumnGrid ---

export interface TwoColumnGridProps {
  children: React.ReactNode
}

export function TwoColumnGrid({ children }: TwoColumnGridProps) {
  return <div className="grid grid-cols-2 gap-3">{children}</div>
}

// --- CarouselSpeedField ---

export interface CarouselSpeedFieldProps {
  /** Speed value in seconds */
  value: number
  onChange: (seconds: number) => void
  /** Minimum speed in seconds */
  min?: number
  /** Maximum speed in seconds */
  max?: number
  step?: number
  label?: string
  description?: string
}

/**
 * Reusable speed/interval control for any carousel or auto-advancing section.
 * Used by Hero (crossfade interval), Media Text (rotation speed), etc.
 */
export function CarouselSpeedField({
  value,
  onChange,
  min = 2,
  max = 15,
  step = 1,
  label = "Slide Speed",
  description = "Seconds between each slide transition",
}: CarouselSpeedFieldProps) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <Label className="text-xs text-muted-foreground">{label}</Label>
        <span className="text-xs tabular-nums text-muted-foreground">
          {value}s
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full accent-primary"
      />
      <p className="text-[11px] text-muted-foreground/70">{description}</p>
    </div>
  )
}
