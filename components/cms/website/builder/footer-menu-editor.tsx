"use client"

import { useState, useCallback } from "react"
import { X, Plus, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { toast } from "sonner"
import type { MenuItemData } from "./navigation/navigation-editor"

interface FooterMenuEditorProps {
  menuId: string
  items: MenuItemData[] // top-level items = columns, each has children = links
  onClose: () => void
  onUpdated: () => void
}

export function FooterMenuEditor({ menuId, items, onClose, onUpdated }: FooterMenuEditorProps) {
  const [saving, setSaving] = useState(false)

  const saveItem = useCallback(async (itemId: string, data: Record<string, unknown>) => {
    setSaving(true)
    try {
      const res = await fetch(`/api/v1/menus/${menuId}/items/${itemId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })
      if (!res.ok) throw new Error("Failed to save")
      onUpdated()
    } catch {
      toast.error("Failed to save footer link")
    } finally {
      setSaving(false)
    }
  }, [menuId, onUpdated])

  const addLink = useCallback(async (parentId: string, sortOrder: number) => {
    setSaving(true)
    try {
      const res = await fetch(`/api/v1/menus/${menuId}/items`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          label: "New Link",
          href: "/",
          parentId,
          sortOrder,
          isVisible: true,
        }),
      })
      if (!res.ok) throw new Error("Failed to add link")
      onUpdated()
      toast.success("Link added")
    } catch {
      toast.error("Failed to add link")
    } finally {
      setSaving(false)
    }
  }, [menuId, onUpdated])

  const deleteLink = useCallback(async (itemId: string) => {
    setSaving(true)
    try {
      const res = await fetch(`/api/v1/menus/${menuId}/items/${itemId}`, {
        method: "DELETE",
      })
      if (!res.ok) throw new Error("Failed to delete")
      onUpdated()
      toast.success("Link removed")
    } catch {
      toast.error("Failed to delete link")
    } finally {
      setSaving(false)
    }
  }, [menuId, onUpdated])

  // Top-level items = columns (parentId is null)
  const columns = items.filter(item => item.parentId === null)

  return (
    <>
      {/* Header */}
      <div className="h-14 border-b flex items-center justify-between px-4 bg-muted/30 shrink-0">
        <h3 className="font-semibold text-xs uppercase tracking-wider text-foreground">
          Edit Footer
        </h3>
        <Button
          variant="ghost"
          size="icon-xs"
          className="rounded-full text-muted-foreground shrink-0"
          onClick={onClose}
        >
          <X className="size-3.5" />
        </Button>
      </div>

      {/* Content */}
      <ScrollArea className="flex-1 min-h-0 overflow-hidden">
        <div className="p-4 space-y-6">
          {columns.map((column) => (
            <div key={column.id} className="space-y-3">
              {/* Column heading */}
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Column Heading
                </Label>
                <Input
                  defaultValue={column.label}
                  onBlur={(e) => {
                    if (e.target.value !== column.label) {
                      saveItem(column.id, { label: e.target.value })
                    }
                  }}
                  className="text-sm"
                />
              </div>

              {/* Links in this column */}
              <div className="space-y-2 pl-2 border-l-2 border-muted">
                {(column.children ?? [])
                  .sort((a, b) => a.sortOrder - b.sortOrder)
                  .map((link) => (
                    <div key={link.id} className="flex items-start gap-2">
                      <div className="flex-1 space-y-1.5">
                        <Input
                          defaultValue={link.label}
                          placeholder="Label"
                          onBlur={(e) => {
                            if (e.target.value !== link.label) {
                              saveItem(link.id, { label: e.target.value })
                            }
                          }}
                          className="text-sm h-8"
                        />
                        <Input
                          defaultValue={link.href ?? ""}
                          placeholder="URL (e.g. /about or https://...)"
                          onBlur={(e) => {
                            if (e.target.value !== (link.href ?? "")) {
                              saveItem(link.id, { href: e.target.value })
                            }
                          }}
                          className="text-sm h-8 text-muted-foreground"
                        />
                      </div>
                      <Button
                        variant="ghost"
                        size="icon-xs"
                        className="shrink-0 text-muted-foreground hover:text-destructive mt-1"
                        onClick={() => deleteLink(link.id)}
                      >
                        <Trash2 className="size-3" />
                      </Button>
                    </div>
                  ))}

                {/* Add link button */}
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full text-xs h-7"
                  onClick={() => addLink(column.id, (column.children?.length ?? 0))}
                  disabled={saving}
                >
                  <Plus className="size-3 mr-1" />
                  Add Link
                </Button>
              </div>

              <Separator />
            </div>
          ))}

          {columns.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-8">
              No footer columns found.
            </p>
          )}
        </div>
      </ScrollArea>
    </>
  )
}
