"use client"

import { useState } from "react"
import { toast } from "sonner"
import { Sparkles, Users, LayoutTemplate } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useGroups, type CreateGroupPayload } from "@/lib/groups-context"
import { groupTypeDisplay, groupTypeBadgeVariant, groupTemplates } from "@/lib/groups-data"
import type { GroupType } from "@/lib/generated/prisma/client"

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
}

interface CreateGroupDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  parentGroupId?: string
}

type FormState = {
  name: string
  groupType: GroupType
  description: string
  meetingSchedule: string
  meetingLocation: string
  isOpen: boolean
  capacity: string
}

const defaultForm: FormState = {
  name: "",
  groupType: "SMALL_GROUP",
  description: "",
  meetingSchedule: "",
  meetingLocation: "",
  isOpen: true,
  capacity: "",
}

export function CreateGroupDialog({ open, onOpenChange, parentGroupId }: CreateGroupDialogProps) {
  const { createGroup } = useGroups()
  const [tab, setTab] = useState("custom")
  const [form, setForm] = useState<FormState>(defaultForm)
  const [submitting, setSubmitting] = useState(false)
  const [aiPrompt, setAiPrompt] = useState("")

  const resetForm = () => {
    setForm(defaultForm)
    setAiPrompt("")
    setTab("custom")
  }

  const handleSubmit = async () => {
    if (!form.name.trim()) {
      toast.error("Group name is required")
      return
    }

    setSubmitting(true)
    try {
      const payload: CreateGroupPayload = {
        name: form.name.trim(),
        slug: slugify(form.name.trim()),
        groupType: form.groupType,
        description: form.description.trim() || undefined,
        meetingSchedule: form.meetingSchedule.trim() || undefined,
        meetingLocation: form.meetingLocation.trim() || undefined,
        isOpen: form.isOpen,
        capacity: form.capacity ? parseInt(form.capacity, 10) : null,
        parentGroupId: parentGroupId ?? null,
      }

      const group = await createGroup(payload)
      if (group) {
        toast.success("Group created successfully", {
          description: `"${group.name}" has been created.`,
        })
        onOpenChange(false)
        resetForm()
      } else {
        toast.error("Failed to create group")
      }
    } finally {
      setSubmitting(false)
    }
  }

  const handleTemplateSelect = (template: (typeof groupTemplates)[0]) => {
    setForm({
      name: template.name,
      groupType: template.groupType,
      description: template.description,
      meetingSchedule: template.meetingSchedule ?? "",
      meetingLocation: "",
      isOpen: template.isOpen,
      capacity: "",
    })
    setTab("custom")
  }

  const handleAiGenerate = () => {
    if (!aiPrompt.trim()) return
    const prompt = aiPrompt.toLowerCase()

    // Simple pattern matching for MVP
    let groupType: GroupType = "SMALL_GROUP"
    if (prompt.includes("volunteer") || prompt.includes("team") || prompt.includes("serve")) {
      groupType = "SERVING_TEAM"
    } else if (prompt.includes("class") || prompt.includes("workshop") || prompt.includes("course")) {
      groupType = "CLASS"
    } else if (prompt.includes("ministry") || prompt.includes("outreach")) {
      groupType = "MINISTRY"
    }

    let schedule = ""
    if (prompt.includes("weekly")) schedule = "Weekly"
    else if (prompt.includes("monthly")) schedule = "Monthly"
    else if (prompt.includes("sunday")) schedule = "Sundays"
    else if (prompt.includes("friday")) schedule = "Fridays"
    else if (prompt.includes("saturday")) schedule = "Saturdays"

    // Capitalize first letter of each word for name
    const name = aiPrompt
      .trim()
      .split(" ")
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(" ")

    setForm({
      name,
      groupType,
      description: `AI-generated group based on: "${aiPrompt.trim()}"`,
      meetingSchedule: schedule,
      meetingLocation: "",
      isOpen: true,
      capacity: "",
    })
    setTab("custom")
    toast.success("Group configuration generated", {
      description: "Review and adjust the details before creating.",
    })
  }

  const aiExamples = ["6-week marriage workshop", "Monthly men's breakfast", "Outreach volunteer team"]

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        onOpenChange(o)
        if (!o) resetForm()
      }}
    >
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Create Group</DialogTitle>
          <DialogDescription>
            Create a new group to organize your congregation.
          </DialogDescription>
        </DialogHeader>

        <Tabs value={tab} onValueChange={setTab}>
          <TabsList variant="line" className="w-full">
            <TabsTrigger value="custom" className="flex-1">
              <Users className="size-3.5" />
              Custom
            </TabsTrigger>
            <TabsTrigger value="template" className="flex-1">
              <LayoutTemplate className="size-3.5" />
              Template
            </TabsTrigger>
            <TabsTrigger value="ai" className="flex-1">
              <Sparkles className="size-3.5" />
              AI Generate
            </TabsTrigger>
          </TabsList>

          {/* Custom form */}
          <TabsContent value="custom" className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label htmlFor="group-name">Name *</Label>
              <Input
                id="group-name"
                placeholder="e.g., Sunday Bible Study"
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="group-type">Type *</Label>
              <Select
                value={form.groupType}
                onValueChange={(v) => setForm((f) => ({ ...f, groupType: v as GroupType }))}
              >
                <SelectTrigger id="group-type" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent position="popper">
                  <SelectItem value="SMALL_GROUP">Small Group</SelectItem>
                  <SelectItem value="SERVING_TEAM">Serving Team</SelectItem>
                  <SelectItem value="MINISTRY">Ministry</SelectItem>
                  <SelectItem value="CLASS">Class</SelectItem>
                  <SelectItem value="ADMINISTRATIVE">Administrative</SelectItem>
                  <SelectItem value="CUSTOM">Custom</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="group-desc">Description</Label>
              <Textarea
                id="group-desc"
                placeholder="What is this group about?"
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                rows={2}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="group-schedule">Meeting Schedule</Label>
                <Input
                  id="group-schedule"
                  placeholder="e.g., Sundays 9am"
                  value={form.meetingSchedule}
                  onChange={(e) => setForm((f) => ({ ...f, meetingSchedule: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="group-location">Location</Label>
                <Input
                  id="group-location"
                  placeholder="e.g., Room 201"
                  value={form.meetingLocation}
                  onChange={(e) => setForm((f) => ({ ...f, meetingLocation: e.target.value }))}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="flex items-center justify-between gap-2 rounded-lg border p-3">
                <Label htmlFor="group-open" className="text-sm">Open enrollment</Label>
                <Switch
                  id="group-open"
                  checked={form.isOpen}
                  onCheckedChange={(v) => setForm((f) => ({ ...f, isOpen: v }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="group-capacity">Capacity</Label>
                <Input
                  id="group-capacity"
                  type="number"
                  placeholder="No limit"
                  value={form.capacity}
                  onChange={(e) => setForm((f) => ({ ...f, capacity: e.target.value }))}
                />
              </div>
            </div>
          </TabsContent>

          {/* Templates */}
          <TabsContent value="template" className="mt-4">
            <div className="grid grid-cols-2 gap-2 max-h-[300px] overflow-y-auto pr-1">
              {groupTemplates.map((t) => (
                <Card
                  key={t.name}
                  className="cursor-pointer hover:ring-foreground/20 transition-all"
                  onClick={() => handleTemplateSelect(t)}
                >
                  <CardContent className="p-3 space-y-1.5">
                    <div className="font-medium text-sm">{t.name}</div>
                    <Badge variant={groupTypeBadgeVariant[t.groupType]} className="text-[10px]">
                      {groupTypeDisplay[t.groupType]}
                    </Badge>
                    <p className="text-muted-foreground text-xs line-clamp-2">{t.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* AI Generate */}
          <TabsContent value="ai" className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label htmlFor="ai-prompt">Describe the group you want to create</Label>
              <Textarea
                id="ai-prompt"
                placeholder='e.g., "6-week marriage workshop for couples"'
                value={aiPrompt}
                onChange={(e) => setAiPrompt(e.target.value)}
                rows={3}
              />
            </div>
            <div className="flex flex-wrap gap-1.5">
              {aiExamples.map((ex) => (
                <Badge
                  key={ex}
                  variant="outline"
                  className="cursor-pointer hover:bg-muted"
                  onClick={() => setAiPrompt(ex)}
                >
                  {ex}
                </Badge>
              ))}
            </div>
            <Button onClick={handleAiGenerate} disabled={!aiPrompt.trim()} className="w-full">
              <Sparkles />
              Generate Group
            </Button>
          </TabsContent>
        </Tabs>

        {tab === "custom" && (
          <DialogFooter>
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={submitting || !form.name.trim()}>
              {submitting ? "Creating..." : "Create Group"}
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  )
}
