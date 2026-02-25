"use client"

import { useState, useCallback } from "react"
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

export interface NavbarSettings {
  /** How the navbar behaves on scroll */
  scrollBehavior: "transparent-to-solid" | "always-solid" | "always-transparent"
  /** Color of the navbar in solid state */
  solidColor: "white" | "dark" | "primary"
  /** Whether to show the CTA button */
  ctaVisible: boolean
  /** CTA button label */
  ctaLabel: string
  /** CTA button href */
  ctaHref: string
  /** Whether to show member login link */
  memberLoginVisible: boolean
  /** Whether the navbar is sticky */
  sticky: boolean
}

export const defaultNavbarSettings: NavbarSettings = {
  scrollBehavior: "transparent-to-solid",
  solidColor: "white",
  ctaVisible: true,
  ctaLabel: "I\u2019m new",
  ctaHref: "/website/im-new",
  memberLoginVisible: false,
  sticky: true,
}

interface NavbarEditorProps {
  settings: NavbarSettings
  onChange: (settings: NavbarSettings) => void
}

export function NavbarEditor({ settings, onChange }: NavbarEditorProps) {
  function update<K extends keyof NavbarSettings>(
    field: K,
    value: NavbarSettings[K],
  ) {
    onChange({ ...settings, [field]: value })
  }

  return (
    <div className="space-y-6">
      {/* Scroll Behavior */}
      <div className="space-y-3">
        <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Scroll Behavior
        </Label>
        <RadioGroup
          value={settings.scrollBehavior}
          onValueChange={(v) =>
            update("scrollBehavior", v as NavbarSettings["scrollBehavior"])
          }
          className="space-y-2"
        >
          <div className="flex items-start gap-2">
            <RadioGroupItem
              value="transparent-to-solid"
              id="scroll-transparent"
              className="mt-0.5"
            />
            <div>
              <Label
                htmlFor="scroll-transparent"
                className="cursor-pointer font-normal text-sm"
              >
                Transparent over hero
              </Label>
              <p className="text-xs text-muted-foreground">
                Transparent on hero section, solid on scroll
              </p>
            </div>
          </div>
          <div className="flex items-start gap-2">
            <RadioGroupItem
              value="always-solid"
              id="scroll-solid"
              className="mt-0.5"
            />
            <div>
              <Label
                htmlFor="scroll-solid"
                className="cursor-pointer font-normal text-sm"
              >
                Always solid
              </Label>
              <p className="text-xs text-muted-foreground">
                Solid background from the start
              </p>
            </div>
          </div>
          <div className="flex items-start gap-2">
            <RadioGroupItem
              value="always-transparent"
              id="scroll-always-transparent"
              className="mt-0.5"
            />
            <div>
              <Label
                htmlFor="scroll-always-transparent"
                className="cursor-pointer font-normal text-sm"
              >
                Always transparent
              </Label>
              <p className="text-xs text-muted-foreground">
                No background, text stays light
              </p>
            </div>
          </div>
        </RadioGroup>
      </div>

      <Separator />

      {/* Solid Color */}
      <div className="space-y-3">
        <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Background Color
        </Label>
        <p className="text-xs text-muted-foreground">
          Color when the navbar is in its solid state
        </p>
        <RadioGroup
          value={settings.solidColor}
          onValueChange={(v) =>
            update("solidColor", v as NavbarSettings["solidColor"])
          }
          className="flex gap-4"
        >
          <div className="flex items-center gap-2">
            <RadioGroupItem value="white" id="color-white" />
            <Label
              htmlFor="color-white"
              className="cursor-pointer font-normal text-sm"
            >
              White
            </Label>
          </div>
          <div className="flex items-center gap-2">
            <RadioGroupItem value="dark" id="color-dark" />
            <Label
              htmlFor="color-dark"
              className="cursor-pointer font-normal text-sm"
            >
              Dark
            </Label>
          </div>
          <div className="flex items-center gap-2">
            <RadioGroupItem value="primary" id="color-primary" />
            <Label
              htmlFor="color-primary"
              className="cursor-pointer font-normal text-sm"
            >
              Primary
            </Label>
          </div>
        </RadioGroup>
      </div>

      <Separator />

      {/* Sticky */}
      <div className="flex items-center justify-between">
        <div className="space-y-0.5">
          <Label className="text-sm font-medium">Sticky</Label>
          <p className="text-xs text-muted-foreground">
            Navbar stays fixed at the top on scroll
          </p>
        </div>
        <Switch
          checked={settings.sticky}
          onCheckedChange={(v) => update("sticky", v)}
        />
      </div>

      <Separator />

      {/* CTA Button */}
      <div className="space-y-4">
        <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Call to Action
        </Label>

        <div className="flex items-center justify-between">
          <Label className="text-sm font-medium">Show CTA Button</Label>
          <Switch
            checked={settings.ctaVisible}
            onCheckedChange={(v) => update("ctaVisible", v)}
          />
        </div>

        {settings.ctaVisible && (
          <div className="space-y-3 pl-0">
            <div className="space-y-1.5">
              <Label className="text-sm font-medium">Label</Label>
              <Input
                value={settings.ctaLabel}
                onChange={(e) => update("ctaLabel", e.target.value)}
                placeholder="e.g. I'm new"
                className="text-sm"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm font-medium">Link</Label>
              <Input
                value={settings.ctaHref}
                onChange={(e) => update("ctaHref", e.target.value)}
                placeholder="/im-new"
                className="text-sm"
              />
            </div>
          </div>
        )}
      </div>

      <Separator />

      {/* Member Login */}
      <div className="flex items-center justify-between">
        <div className="space-y-0.5">
          <Label className="text-sm font-medium">Member Login</Label>
          <p className="text-xs text-muted-foreground">
            Show a login link in the navbar
          </p>
        </div>
        <Switch
          checked={settings.memberLoginVisible}
          onCheckedChange={(v) => update("memberLoginVisible", v)}
        />
      </div>
    </div>
  )
}
