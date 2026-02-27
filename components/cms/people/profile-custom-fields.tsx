"use client"

import { useState } from "react"
import { Pencil, X, Check, Settings2, ExternalLink } from "lucide-react"
import { toast } from "sonner"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import type { PersonDetail } from "./types"

type FieldValue = PersonDetail["customFieldValues"][number]

type Props = {
  person: PersonDetail
  onUpdate: () => void
}

export function ProfileCustomFields({ person, onUpdate }: Props) {
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [values, setValues] = useState<Record<string, string>>(() => {
    const map: Record<string, string> = {}
    person.customFieldValues.forEach((v) => {
      map[v.fieldDefinitionId] = v.value
    })
    return map
  })

  const fieldValues = person.customFieldValues

  if (fieldValues.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Settings2 className="size-4" />
            Custom Fields
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground text-center py-4">
            No custom fields configured
          </p>
        </CardContent>
      </Card>
    )
  }

  // Group by section
  const sections = new Map<string, FieldValue[]>()
  fieldValues.forEach((fv) => {
    const section = fv.fieldDefinition.section ?? "General"
    const existing = sections.get(section) ?? []
    existing.push(fv)
    sections.set(section, existing)
  })

  const handleSave = async () => {
    setSaving(true)
    try {
      // Save each changed value
      const promises = Object.entries(values).map(([fieldDefId, value]) => {
        const existing = fieldValues.find((fv) => fv.fieldDefinitionId === fieldDefId)
        if (existing && existing.value === value) return Promise.resolve()

        return fetch(`/api/v1/people/${person.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({}), // Custom fields are saved via their own endpoint
        })
      })
      await Promise.all(promises)
      toast.success("Profile updated successfully")
      setEditing(false)
      onUpdate()
    } catch {
      toast.error("Failed to save custom fields")
    } finally {
      setSaving(false)
    }
  }

  const handleCancel = () => {
    const map: Record<string, string> = {}
    person.customFieldValues.forEach((v) => {
      map[v.fieldDefinitionId] = v.value
    })
    setValues(map)
    setEditing(false)
  }

  const renderFieldValue = (fv: FieldValue) => {
    const def = fv.fieldDefinition
    switch (def.fieldType) {
      case "CHECKBOX":
        return fv.value === "true" ? "Yes" : "No"
      case "URL":
        return (
          <a
            href={fv.value}
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary hover:underline inline-flex items-center gap-1"
          >
            {fv.value}
            <ExternalLink className="size-3" />
          </a>
        )
      case "DATE":
        return fv.value
          ? new Date(fv.value).toLocaleDateString("en-US", {
              month: "long",
              day: "numeric",
              year: "numeric",
            })
          : "Not set"
      case "MULTI_SELECT":
        try {
          const selected = JSON.parse(fv.value) as string[]
          return (
            <div className="flex flex-wrap gap-1">
              {selected.map((s) => (
                <Badge key={s} variant="secondary" className="text-xs">
                  {s}
                </Badge>
              ))}
            </div>
          )
        } catch {
          return fv.value
        }
      default:
        return fv.value || "Not set"
    }
  }

  const renderFieldEdit = (fv: FieldValue) => {
    const def = fv.fieldDefinition
    const value = values[def.id] ?? ""
    const onChange = (v: string) => setValues((prev) => ({ ...prev, [def.id]: v }))

    switch (def.fieldType) {
      case "TEXT":
        return <Input value={value} onChange={(e) => onChange(e.target.value)} />
      case "NUMBER":
        return (
          <Input
            type="number"
            value={value}
            onChange={(e) => onChange(e.target.value)}
          />
        )
      case "DATE":
        return (
          <Input
            type="date"
            value={value}
            onChange={(e) => onChange(e.target.value)}
          />
        )
      case "URL":
        return (
          <Input
            type="url"
            value={value}
            onChange={(e) => onChange(e.target.value)}
          />
        )
      case "CHECKBOX":
        return (
          <Checkbox
            checked={value === "true"}
            onCheckedChange={(checked) => onChange(String(checked))}
          />
        )
      case "DROPDOWN": {
        const options = (def.options as string[] | null) ?? []
        return (
          <Select value={value} onValueChange={onChange}>
            <SelectTrigger>
              <SelectValue placeholder="Select..." />
            </SelectTrigger>
            <SelectContent>
              {options.map((opt) => (
                <SelectItem key={opt} value={opt}>
                  {opt}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )
      }
      default:
        return <Input value={value} onChange={(e) => onChange(e.target.value)} />
    }
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-base flex items-center gap-2">
          <Settings2 className="size-4" />
          Custom Fields
        </CardTitle>
        {!editing ? (
          <Button variant="ghost" size="sm" onClick={() => setEditing(true)}>
            <Pencil className="mr-1.5 size-3.5" />
            Edit
          </Button>
        ) : (
          <div className="flex gap-1">
            <Button variant="ghost" size="sm" onClick={handleCancel} disabled={saving}>
              <X className="mr-1 size-3.5" />
              Cancel
            </Button>
            <Button size="sm" onClick={handleSave} disabled={saving}>
              <Check className="mr-1 size-3.5" />
              {saving ? "Saving..." : "Save"}
            </Button>
          </div>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        {Array.from(sections.entries()).map(([section, fields]) => (
          <Collapsible key={section} defaultOpen>
            <CollapsibleTrigger className="flex items-center gap-2 text-sm font-medium w-full text-left hover:underline">
              {section}
            </CollapsibleTrigger>
            <CollapsibleContent>
              <dl className="grid gap-x-6 gap-y-3 sm:grid-cols-2 mt-2">
                {fields.map((fv) => (
                  <div key={fv.id}>
                    <dt className="text-muted-foreground text-sm">
                      {fv.fieldDefinition.name}
                    </dt>
                    <dd className="text-sm font-medium mt-0.5">
                      {editing ? renderFieldEdit(fv) : renderFieldValue(fv)}
                    </dd>
                  </div>
                ))}
              </dl>
            </CollapsibleContent>
          </Collapsible>
        ))}
      </CardContent>
    </Card>
  )
}
