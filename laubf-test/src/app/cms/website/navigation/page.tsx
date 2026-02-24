"use client"

import { useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  GripVertical,
  Plus,
  Trash2,
  Pencil,
  ExternalLink,
  ChevronRight,
  Save,
} from "lucide-react"

interface MenuItem {
  id: string
  label: string
  href: string | null
  description: string | null
  iconName: string | null
  openInNewTab: boolean
  isExternal: boolean
  parentId: string | null
  groupLabel: string | null
  featuredImage: string | null
  featuredTitle: string | null
  featuredDescription: string | null
  featuredHref: string | null
  sortOrder: number
  isVisible: boolean
  children?: MenuItem[]
}

interface MenuData {
  id: string
  name: string
  slug: string
  location: string
  items: MenuItem[]
}

const MENU_LOCATIONS = ["HEADER", "FOOTER", "MOBILE", "SIDEBAR"] as const

const LOCATION_LABELS: Record<string, string> = {
  HEADER: "Header Menu",
  FOOTER: "Footer Menu",
  MOBILE: "Mobile Menu",
  SIDEBAR: "Sidebar Menu",
}

const emptyMenuItem: Omit<MenuItem, "id" | "sortOrder" | "children"> = {
  label: "",
  href: "",
  description: "",
  iconName: "",
  openInNewTab: false,
  isExternal: false,
  parentId: null,
  groupLabel: "",
  featuredImage: "",
  featuredTitle: "",
  featuredDescription: "",
  featuredHref: "",
  isVisible: true,
}

export default function NavigationPage() {
  const [menus, setMenus] = useState<MenuData[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("HEADER")
  const [showItemDialog, setShowItemDialog] = useState(false)
  const [editingItem, setEditingItem] = useState<Partial<MenuItem> | null>(null)
  const [editingMenuId, setEditingMenuId] = useState<string | null>(null)
  const [editingParentId, setEditingParentId] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  const fetchMenus = useCallback(async () => {
    try {
      const res = await fetch("/api/v1/menus")
      if (res.ok) {
        const data = await res.json()
        setMenus(data)
      }
    } catch (error) {
      console.error("Failed to fetch menus:", error)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchMenus()
  }, [fetchMenus])

  const getMenuForLocation = (location: string) => {
    return menus.find((m) => m.location === location)
  }

  const handleCreateMenu = async (location: string) => {
    try {
      const slug = location.toLowerCase()
      await fetch("/api/v1/menus", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: LOCATION_LABELS[location],
          slug,
          location,
        }),
      })
      fetchMenus()
    } catch (error) {
      console.error("Failed to create menu:", error)
    }
  }

  const handleOpenAddItem = (menuId: string, parentId: string | null = null) => {
    setEditingMenuId(menuId)
    setEditingParentId(parentId)
    setEditingItem({ ...emptyMenuItem })
    setShowItemDialog(true)
  }

  const handleOpenEditItem = (menuId: string, item: MenuItem) => {
    setEditingMenuId(menuId)
    setEditingParentId(item.parentId)
    setEditingItem({ ...item })
    setShowItemDialog(true)
  }

  const handleSaveItem = async () => {
    if (!editingItem || !editingMenuId || !editingItem.label) return
    setSaving(true)

    try {
      if (editingItem.id) {
        // Update - we'll delete and re-create since we don't have a direct item update endpoint
        // For now, use the menu items endpoint
        await fetch(`/api/v1/menus/${editingMenuId}/items`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...editingItem,
            parentId: editingParentId,
          }),
        })
      } else {
        await fetch(`/api/v1/menus/${editingMenuId}/items`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...editingItem,
            parentId: editingParentId,
          }),
        })
      }
      setShowItemDialog(false)
      setEditingItem(null)
      fetchMenus()
    } catch (error) {
      console.error("Failed to save menu item:", error)
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteItem = async (menuId: string, itemId: string) => {
    if (!confirm("Delete this menu item?")) return
    // We don't have a direct delete endpoint for individual items,
    // so we use the menu items reorder endpoint to effectively remove it
    // For now, log and refetch. In production, add a DELETE endpoint.
    try {
      // Delete by fetching items, removing, and reordering
      const menu = menus.find((m) => m.id === menuId)
      if (!menu) return
      const remaining = menu.items
        .filter((i) => i.id !== itemId)
        .map((item, idx) => ({ id: item.id, sortOrder: idx }))

      await fetch(`/api/v1/menus/${menuId}/items`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items: remaining }),
      })
      fetchMenus()
    } catch (error) {
      console.error("Failed to delete menu item:", error)
    }
  }

  const renderMenuItem = (menuId: string, item: MenuItem, depth = 0) => (
    <div key={item.id} className="space-y-2">
      <div
        className="flex items-center gap-3 p-3 bg-white border rounded-lg group hover:border-neutral-300 transition-colors"
        style={{ marginLeft: `${depth * 32}px` }}
      >
        <GripVertical className="h-4 w-4 text-neutral-300 cursor-grab shrink-0" />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-medium text-sm">{item.label}</span>
            {item.isExternal && (
              <ExternalLink className="h-3 w-3 text-neutral-400" />
            )}
            {!item.isVisible && (
              <Badge variant="secondary" className="text-[10px]">Hidden</Badge>
            )}
          </div>
          {item.href && (
            <div className="text-xs text-neutral-400 truncate">{item.href}</div>
          )}
          {item.description && (
            <div className="text-xs text-neutral-400 truncate mt-0.5">
              {item.description}
            </div>
          )}
        </div>
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <Button
            size="sm"
            variant="ghost"
            className="h-7 w-7 p-0"
            onClick={() => handleOpenAddItem(menuId, item.id)}
            title="Add child"
          >
            <Plus className="h-3 w-3" />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            className="h-7 w-7 p-0"
            onClick={() => handleOpenEditItem(menuId, item)}
          >
            <Pencil className="h-3 w-3" />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            className="h-7 w-7 p-0 text-red-500 hover:text-red-600"
            onClick={() => handleDeleteItem(menuId, item.id)}
          >
            <Trash2 className="h-3 w-3" />
          </Button>
        </div>
      </div>
      {item.children &&
        item.children.map((child) => renderMenuItem(menuId, child, depth + 1))}
    </div>
  )

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Navigation</h1>
        <p className="text-sm text-neutral-500">
          Manage your website menus and navigation structure.
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          {MENU_LOCATIONS.map((loc) => (
            <TabsTrigger key={loc} value={loc}>
              {LOCATION_LABELS[loc]}
            </TabsTrigger>
          ))}
        </TabsList>

        {MENU_LOCATIONS.map((location) => {
          const menu = getMenuForLocation(location)
          return (
            <TabsContent key={location} value={location}>
              {loading ? (
                <div className="py-12 text-center text-neutral-500">Loading...</div>
              ) : !menu ? (
                <Card className="border-dashed">
                  <CardContent className="flex flex-col items-center justify-center py-12">
                    <p className="text-sm text-neutral-500 mb-4">
                      No {LOCATION_LABELS[location].toLowerCase()} configured yet.
                    </p>
                    <Button onClick={() => handleCreateMenu(location)}>
                      <Plus className="mr-2 h-4 w-4" />
                      Create {LOCATION_LABELS[location]}
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid gap-6 md:grid-cols-3">
                  <div className="md:col-span-2 space-y-4">
                    <Card>
                      <CardHeader className="flex flex-row items-center justify-between">
                        <CardTitle className="text-base">{menu.name}</CardTitle>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleOpenAddItem(menu.id)}
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          Add Item
                        </Button>
                      </CardHeader>
                      <CardContent className="space-y-2">
                        {menu.items.length === 0 ? (
                          <p className="text-sm text-neutral-400 text-center py-8">
                            No items in this menu. Add your first item.
                          </p>
                        ) : (
                          menu.items.map((item) => renderMenuItem(menu.id, item))
                        )}
                      </CardContent>
                    </Card>
                  </div>

                  <div>
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-sm">Menu Info</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3 text-sm">
                        <div>
                          <span className="text-neutral-500">Location:</span>{" "}
                          <Badge variant="outline">{location}</Badge>
                        </div>
                        <div>
                          <span className="text-neutral-500">Items:</span>{" "}
                          {menu.items.length}
                        </div>
                        <div>
                          <span className="text-neutral-500">Slug:</span>{" "}
                          <code className="text-xs bg-neutral-100 px-1.5 py-0.5 rounded">
                            {menu.slug}
                          </code>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              )}
            </TabsContent>
          )
        })}
      </Tabs>

      {/* Add/Edit Menu Item Dialog */}
      <Dialog open={showItemDialog} onOpenChange={setShowItemDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editingItem?.id ? "Edit Menu Item" : "Add Menu Item"}
            </DialogTitle>
            <DialogDescription>
              Configure the menu item properties.
            </DialogDescription>
          </DialogHeader>
          {editingItem && (
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Label</Label>
                <Input
                  value={editingItem.label || ""}
                  onChange={(e) =>
                    setEditingItem({ ...editingItem, label: e.target.value })
                  }
                  placeholder="Menu item label"
                />
              </div>
              <div className="space-y-2">
                <Label>URL / Href</Label>
                <Input
                  value={editingItem.href || ""}
                  onChange={(e) =>
                    setEditingItem({ ...editingItem, href: e.target.value })
                  }
                  placeholder="/about or https://..."
                />
              </div>
              <div className="space-y-2">
                <Label>Description (optional)</Label>
                <Input
                  value={editingItem.description || ""}
                  onChange={(e) =>
                    setEditingItem({ ...editingItem, description: e.target.value })
                  }
                  placeholder="Brief description for dropdown"
                />
              </div>
              <div className="space-y-2">
                <Label>Icon Name (optional)</Label>
                <Input
                  value={editingItem.iconName || ""}
                  onChange={(e) =>
                    setEditingItem({ ...editingItem, iconName: e.target.value })
                  }
                  placeholder="lucide icon name"
                />
              </div>
              <div className="space-y-2">
                <Label>Group Label (optional)</Label>
                <Input
                  value={editingItem.groupLabel || ""}
                  onChange={(e) =>
                    setEditingItem({ ...editingItem, groupLabel: e.target.value })
                  }
                  placeholder="Group heading in dropdown"
                />
              </div>

              <div className="flex items-center justify-between">
                <Label>Open in New Tab</Label>
                <Switch
                  checked={editingItem.openInNewTab || false}
                  onCheckedChange={(checked) =>
                    setEditingItem({ ...editingItem, openInNewTab: checked })
                  }
                />
              </div>
              <div className="flex items-center justify-between">
                <Label>External Link</Label>
                <Switch
                  checked={editingItem.isExternal || false}
                  onCheckedChange={(checked) =>
                    setEditingItem({ ...editingItem, isExternal: checked })
                  }
                />
              </div>
              <div className="flex items-center justify-between">
                <Label>Visible</Label>
                <Switch
                  checked={editingItem.isVisible ?? true}
                  onCheckedChange={(checked) =>
                    setEditingItem({ ...editingItem, isVisible: checked })
                  }
                />
              </div>

              {/* Featured Card section */}
              <details className="border rounded-md p-3">
                <summary className="text-sm font-medium cursor-pointer">
                  Featured Card (dropdown items)
                </summary>
                <div className="space-y-3 mt-3">
                  <div className="space-y-2">
                    <Label className="text-xs">Featured Image URL</Label>
                    <Input
                      value={editingItem.featuredImage || ""}
                      onChange={(e) =>
                        setEditingItem({
                          ...editingItem,
                          featuredImage: e.target.value,
                        })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs">Featured Title</Label>
                    <Input
                      value={editingItem.featuredTitle || ""}
                      onChange={(e) =>
                        setEditingItem({
                          ...editingItem,
                          featuredTitle: e.target.value,
                        })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs">Featured Description</Label>
                    <Input
                      value={editingItem.featuredDescription || ""}
                      onChange={(e) =>
                        setEditingItem({
                          ...editingItem,
                          featuredDescription: e.target.value,
                        })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs">Featured Link</Label>
                    <Input
                      value={editingItem.featuredHref || ""}
                      onChange={(e) =>
                        setEditingItem({
                          ...editingItem,
                          featuredHref: e.target.value,
                        })
                      }
                    />
                  </div>
                </div>
              </details>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowItemDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveItem} disabled={saving || !editingItem?.label}>
              <Save className="mr-2 h-4 w-4" />
              {saving ? "Saving..." : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
