"use client"

import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Button } from "@/components/ui/button"
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
      {options.map((opt) => (
        <Button
          key={opt.value}
          type="button"
          variant="outline"
          size={size === "sm" ? "sm" : "default"}
          onClick={() => onChange(opt.value)}
          className={`text-xs font-medium ${
            value === opt.value
              ? "border-primary bg-primary text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          {opt.label}
        </Button>
      ))}
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
