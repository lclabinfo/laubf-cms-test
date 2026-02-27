"use client"

import { useState, useCallback } from "react"
import { Bell, AlertTriangle } from "lucide-react"
import { toast } from "sonner"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import type { PersonDetail } from "./types"

type Preference = PersonDetail["communicationPreferences"][number]

type ChannelConfig = {
  label: string
  categories: string[]
}

const channelConfig: Record<string, ChannelConfig> = {
  EMAIL: {
    label: "Email",
    categories: ["General", "Events", "Groups", "Newsletter", "Prayer"],
  },
  SMS: {
    label: "SMS",
    categories: ["General", "Events", "Groups"],
  },
  PHONE: {
    label: "Phone",
    categories: ["General"],
  },
  MAIL: {
    label: "Mail",
    categories: ["General"],
  },
}

type Props = {
  person: PersonDetail
  onUpdate: () => void
}

export function ProfileCommunicationPrefs({ person, onUpdate }: Props) {
  const [prefs, setPrefs] = useState<Preference[]>(person.communicationPreferences)
  const [updating, setUpdating] = useState<string | null>(null)

  const isOptedIn = useCallback(
    (channel: string, category: string) => {
      const pref = prefs.find(
        (p) => p.channel === channel && p.category === category,
      )
      return pref?.isOptedIn ?? true // default to opted-in if no preference set
    },
    [prefs],
  )

  const allOptedOut = Object.entries(channelConfig).every(([channel, config]) =>
    config.categories.every((cat) => !isOptedIn(channel, cat)),
  )

  const handleToggle = async (channel: string, category: string, checked: boolean) => {
    const key = `${channel}-${category}`
    setUpdating(key)

    // Optimistic update
    setPrefs((prev) => {
      const existing = prev.find(
        (p) => p.channel === channel && p.category === category,
      )
      if (existing) {
        return prev.map((p) =>
          p.channel === channel && p.category === category
            ? { ...p, isOptedIn: checked }
            : p,
        )
      }
      return [
        ...prev,
        {
          id: crypto.randomUUID(),
          personId: person.id,
          channel: channel as Preference["channel"],
          category,
          isOptedIn: checked,
          updatedAt: new Date(),
        },
      ]
    })

    try {
      const res = await fetch(`/api/v1/people/${person.id}/communication-preferences`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ channel, category, isOptedIn: checked }),
      })
      if (!res.ok) throw new Error("Failed to update")
      toast.success("Communication preferences updated")
    } catch {
      // Revert
      setPrefs(person.communicationPreferences)
      toast.error("Failed to update preference")
    } finally {
      setUpdating(null)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <Bell className="size-4" />
          Communication Preferences
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {allOptedOut && (
          <div className="flex items-center gap-2 rounded-md border border-warning/50 bg-warning/10 p-3">
            <AlertTriangle className="size-4 text-warning" />
            <p className="text-sm text-warning-foreground">
              Opted out of all communications
            </p>
          </div>
        )}

        {Object.entries(channelConfig).map(([channel, config]) => (
          <div key={channel} className="space-y-2">
            <h4 className="text-sm font-medium">{config.label}</h4>
            <div className="space-y-1.5">
              {config.categories.map((category) => {
                const key = `${channel}-${category}`
                return (
                  <div key={key} className="flex items-center justify-between py-1">
                    <Label htmlFor={key} className="text-sm font-normal text-muted-foreground">
                      {category}
                    </Label>
                    <Switch
                      id={key}
                      size="sm"
                      checked={isOptedIn(channel, category)}
                      disabled={updating === key}
                      onCheckedChange={(checked) =>
                        handleToggle(channel, category, checked)
                      }
                    />
                  </div>
                )
              })}
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}
