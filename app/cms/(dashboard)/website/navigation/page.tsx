"use client"

import { useState, useEffect, useCallback } from "react"
import {
  Plus,
  Pencil,
  Trash2,
  ChevronUp,
  ChevronDown,
  ExternalLink,
  Eye,
  EyeOff,
  GripVertical,
  Loader2,
  Menu,
} from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { cn } from "@/lib/utils"

// ── Types ──

interface MenuItem {
  id: string
  menuId: string
  label: string
  href: string | null
  description: string | null
  iconName: string | null
  openInNewTab: boolean
  isExternal: boolean
  parentId: string | null
  groupLabel: string | null
  sortOrder: number
  isVisible: boolean
  children: MenuItem[]
}

interface MenuRecord {
  id: string
  churchId: string
  name: string
  slug: string
  location: string
  items: MenuItem[]
}

interface MenuItemFormData {
  label: string
  href: string
  description: string
  iconName: string
  openInNewTab: boolean
  isExternal: boolean
  isVisible: boolean
  parentId: string
  groupLabel: string
}

const emptyFormData: MenuItemFormData = {
  label: "",
  href: "",
  description: "",
  iconName: "",
  openInNewTab: false,
  isExternal: false,
  isVisible: true,
  parentId: "",
  groupLabel: "",
}

const locationLabels: Record<string, string> = {
  HEADER: "Header",
  FOOTER: "Footer",
  MOBILE: "Mobile",
  SIDEBAR: "Sidebar",
}

// ── Main Page ──

export default function WebsiteNavigationPage() {
  const [menus, setMenus] = useState<MenuRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("")

  // Dialog state
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null)
  const [activeMenuId, setActiveMenuId] = useState("")
  const [formData, setFormData] = useState<MenuItemFormData>(emptyFormData)
  const [saving, setSaving] = useState(false)

  // Delete confirmation
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [deletingItem, setDeletingItem] = useState<{
    item: MenuItem
    menuId: string
  } | null>(null)
  const [deleting, setDeleting] = useState(false)

  // Fetch all menus with items
  const fetchMenus = useCallback(async () => {
    try {
      // First get menu list
      const menusRes = await fetch("/api/v1/menus")
      const menusJson = await menusRes.json()
      const menuList = menusJson.data ?? []

      // Then fetch items for each menu
      const menusWithItems: MenuRecord[] = await Promise.all(
        menuList.map(async (menu: MenuRecord) => {
          const itemsRes = await fetch(`/api/v1/menus/${menu.id}/items`)
          const itemsJson = await itemsRes.json()
          return itemsJson.data ?? { ...menu, items: [] }
        })
      )

      setMenus(menusWithItems)
      if (menusWithItems.length > 0 && !activeTab) {
        setActiveTab(menusWithItems[0].location)
      }
    } catch (error) {
      console.error("Failed to fetch menus:", error)
    } finally {
      setLoading(false)
    }
  }, [activeTab])

  useEffect(() => {
    fetchMenus()
  }, [fetchMenus])

  const activeMenu = menus.find((m) => m.location === activeTab) ?? null

  // ── Handlers ──

  function handleAddItem(menuId: string) {
    setEditingItem(null)
    setActiveMenuId(menuId)
    setFormData(emptyFormData)
    setDialogOpen(true)
  }

  function handleEditItem(item: MenuItem, menuId: string) {
    setEditingItem(item)
    setActiveMenuId(menuId)
    setFormData({
      label: item.label,
      href: item.href ?? "",
      description: item.description ?? "",
      iconName: item.iconName ?? "",
      openInNewTab: item.openInNewTab,
      isExternal: item.isExternal,
      isVisible: item.isVisible,
      parentId: item.parentId ?? "",
      groupLabel: item.groupLabel ?? "",
    })
    setDialogOpen(true)
  }

  function handleDeleteItem(item: MenuItem, menuId: string) {
    setDeletingItem({ item, menuId })
    setDeleteDialogOpen(true)
  }

  async function confirmDelete() {
    if (!deletingItem) return
    setDeleting(true)
    try {
      await fetch(
        `/api/v1/menus/${deletingItem.menuId}/items/${deletingItem.item.id}`,
        { method: "DELETE" }
      )
      await fetchMenus()
    } catch (error) {
      console.error("Failed to delete menu item:", error)
    } finally {
      setDeleting(false)
      setDeleteDialogOpen(false)
      setDeletingItem(null)
    }
  }

  async function handleSaveItem() {
    if (!formData.label.trim()) return
    setSaving(true)

    try {
      const payload = {
        label: formData.label.trim(),
        href: formData.href.trim() || null,
        description: formData.description.trim() || null,
        iconName: formData.iconName.trim() || null,
        openInNewTab: formData.openInNewTab,
        isExternal: formData.isExternal,
        isVisible: formData.isVisible,
        parentId: formData.parentId || null,
        groupLabel: formData.groupLabel.trim() || null,
      }

      if (editingItem) {
        // Update existing item
        await fetch(
          `/api/v1/menus/${activeMenuId}/items/${editingItem.id}`,
          {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          }
        )
      } else {
        // Create new item
        await fetch(`/api/v1/menus/${activeMenuId}/items`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        })
      }

      await fetchMenus()
      setDialogOpen(false)
    } catch (error) {
      console.error("Failed to save menu item:", error)
    } finally {
      setSaving(false)
    }
  }

  async function handleToggleVisibility(
    item: MenuItem,
    menuId: string
  ) {
    try {
      await fetch(`/api/v1/menus/${menuId}/items/${item.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isVisible: !item.isVisible }),
      })
      await fetchMenus()
    } catch (error) {
      console.error("Failed to toggle visibility:", error)
    }
  }

  // Flatten all top-level items for reordering
  function getAllTopLevelItems(menu: MenuRecord): MenuItem[] {
    return menu.items.filter((i) => !i.parentId)
  }

  async function handleMoveItem(
    menuId: string,
    items: MenuItem[],
    index: number,
    direction: "up" | "down"
  ) {
    const newIndex = direction === "up" ? index - 1 : index + 1
    if (newIndex < 0 || newIndex >= items.length) return

    const reordered = [...items]
    const [moved] = reordered.splice(index, 1)
    reordered.splice(newIndex, 0, moved)

    const itemIds = reordered.map((i) => i.id)

    try {
      await fetch(`/api/v1/menus/${menuId}/items`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ itemIds }),
      })
      await fetchMenus()
    } catch (error) {
      console.error("Failed to reorder items:", error)
    }
  }

  // ── Render ──

  if (loading) {
    return (
      <div className="space-y-4">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Navigation</h1>
          <p className="text-muted-foreground text-sm">
            Configure your website navigation menus.
          </p>
        </div>
        <div className="flex items-center justify-center py-16">
          <Loader2 className="size-6 animate-spin text-muted-foreground" />
        </div>
      </div>
    )
  }

  if (menus.length === 0) {
    return (
      <div className="space-y-4">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Navigation</h1>
          <p className="text-muted-foreground text-sm">
            Configure your website navigation menus.
          </p>
        </div>
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <Menu className="size-10 text-muted-foreground/50 mb-3" />
            <h3 className="text-sm font-medium">No menus found</h3>
            <p className="text-muted-foreground text-xs mt-1 max-w-xs">
              Menus are created during site setup. Seed your database to create
              default menus.
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Get unique locations from existing menus
  const locations = menus.map((m) => m.location)

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold tracking-tight">Navigation</h1>
        <p className="text-muted-foreground text-sm">
          Configure your website navigation menus.
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList variant="line">
          {locations.map((loc) => (
            <TabsTrigger key={loc} value={loc}>
              {locationLabels[loc] ?? loc}
            </TabsTrigger>
          ))}
        </TabsList>

        {menus.map((menu) => (
          <TabsContent key={menu.id} value={menu.location}>
            <Card>
              <CardHeader>
                <CardTitle>{menu.name}</CardTitle>
                <CardDescription>
                  {menu.items.length === 0
                    ? "No items in this menu yet. Add your first navigation item."
                    : `${menu.items.length} item${menu.items.length === 1 ? "" : "s"} in this menu`}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-1">
                {menu.items.length > 0 && (
                  <div className="space-y-1">
                    {menu.items.map((item, index) => (
                      <MenuItemRow
                        key={item.id}
                        item={item}
                        menuId={menu.id}
                        index={index}
                        totalItems={menu.items.length}
                        onEdit={handleEditItem}
                        onDelete={handleDeleteItem}
                        onToggleVisibility={handleToggleVisibility}
                        onMove={(idx, dir) =>
                          handleMoveItem(
                            menu.id,
                            getAllTopLevelItems(menu),
                            idx,
                            dir
                          )
                        }
                        isNested={false}
                      />
                    ))}
                  </div>
                )}
                <div className="pt-3">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleAddItem(menu.id)}
                  >
                    <Plus className="size-3.5" />
                    Add Item
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        ))}
      </Tabs>

      {/* Add/Edit Dialog */}
      <MenuItemDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        formData={formData}
        setFormData={setFormData}
        onSave={handleSaveItem}
        saving={saving}
        isEditing={!!editingItem}
        topLevelItems={
          activeMenu?.items.filter(
            (i) => !i.parentId && i.id !== editingItem?.id
          ) ?? []
        }
      />

      {/* Delete Confirmation */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete menu item</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete &ldquo;{deletingItem?.item.label}
              &rdquo;?
              {(deletingItem?.item.children?.length ?? 0) > 0 &&
                " This will also delete all nested items."}
              {" "}This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={confirmDelete}
              disabled={deleting}
            >
              {deleting ? (
                <>
                  <Loader2 className="size-3.5 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

// ── Menu Item Row ──

function MenuItemRow({
  item,
  menuId,
  index,
  totalItems,
  onEdit,
  onDelete,
  onToggleVisibility,
  onMove,
  isNested,
}: {
  item: MenuItem
  menuId: string
  index: number
  totalItems: number
  onEdit: (item: MenuItem, menuId: string) => void
  onDelete: (item: MenuItem, menuId: string) => void
  onToggleVisibility: (item: MenuItem, menuId: string) => void
  onMove: (index: number, direction: "up" | "down") => void
  isNested: boolean
}) {
  return (
    <>
      <div
        className={cn(
          "flex items-center gap-2 rounded-lg border bg-background px-3 py-2 transition-colors hover:bg-muted/50",
          isNested && "ml-8",
          !item.isVisible && "opacity-60"
        )}
      >
        {/* Drag handle placeholder */}
        <GripVertical className="size-4 text-muted-foreground/50 shrink-0" />

        {/* Move buttons */}
        <div className="flex flex-col -space-y-0.5 shrink-0">
          <Button
            variant="ghost"
            size="icon-xs"
            disabled={index === 0}
            onClick={() => onMove(index, "up")}
            aria-label="Move up"
          >
            <ChevronUp className="size-3" />
          </Button>
          <Button
            variant="ghost"
            size="icon-xs"
            disabled={index === totalItems - 1}
            onClick={() => onMove(index, "down")}
            aria-label="Move down"
          >
            <ChevronDown className="size-3" />
          </Button>
        </div>

        {/* Item content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-medium text-sm truncate">{item.label}</span>
            {item.isExternal && (
              <ExternalLink className="size-3 text-muted-foreground shrink-0" />
            )}
            {item.iconName && (
              <Badge variant="secondary" className="text-[10px] h-4">
                {item.iconName}
              </Badge>
            )}
            {item.groupLabel && (
              <Badge variant="outline" className="text-[10px] h-4">
                {item.groupLabel}
              </Badge>
            )}
          </div>
          {item.href && (
            <p className="text-xs text-muted-foreground truncate">
              {item.href}
            </p>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-0.5 shrink-0">
          <Button
            variant="ghost"
            size="icon-xs"
            onClick={() => onToggleVisibility(item, menuId)}
            aria-label={item.isVisible ? "Hide item" : "Show item"}
          >
            {item.isVisible ? (
              <Eye className="size-3.5" />
            ) : (
              <EyeOff className="size-3.5" />
            )}
          </Button>
          <Button
            variant="ghost"
            size="icon-xs"
            onClick={() => onEdit(item, menuId)}
            aria-label="Edit item"
          >
            <Pencil className="size-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="icon-xs"
            onClick={() => onDelete(item, menuId)}
            aria-label="Delete item"
          >
            <Trash2 className="size-3.5 text-destructive" />
          </Button>
        </div>
      </div>

      {/* Nested children */}
      {item.children?.map((child, childIndex) => (
        <MenuItemRow
          key={child.id}
          item={child}
          menuId={menuId}
          index={childIndex}
          totalItems={item.children.length}
          onEdit={onEdit}
          onDelete={onDelete}
          onToggleVisibility={onToggleVisibility}
          onMove={() => {
            /* Child reorder not supported in v1 */
          }}
          isNested
        />
      ))}
    </>
  )
}

// ── Add/Edit Dialog ──

function MenuItemDialog({
  open,
  onOpenChange,
  formData,
  setFormData,
  onSave,
  saving,
  isEditing,
  topLevelItems,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  formData: MenuItemFormData
  setFormData: React.Dispatch<React.SetStateAction<MenuItemFormData>>
  onSave: () => void
  saving: boolean
  isEditing: boolean
  topLevelItems: MenuItem[]
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Edit Menu Item" : "Add Menu Item"}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Update this navigation item."
              : "Add a new item to this navigation menu."}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Label */}
          <div className="space-y-1.5">
            <Label htmlFor="item-label">Label</Label>
            <Input
              id="item-label"
              placeholder="e.g. About Us"
              value={formData.label}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, label: e.target.value }))
              }
            />
          </div>

          {/* URL */}
          <div className="space-y-1.5">
            <Label htmlFor="item-href">URL</Label>
            <Input
              id="item-href"
              placeholder="e.g. /about or https://example.com"
              value={formData.href}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, href: e.target.value }))
              }
            />
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <Label htmlFor="item-description">Description</Label>
            <Input
              id="item-description"
              placeholder="Brief description (optional)"
              value={formData.description}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  description: e.target.value,
                }))
              }
            />
          </div>

          {/* Icon Name + Group Label row */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="item-icon">Icon Name</Label>
              <Input
                id="item-icon"
                placeholder="e.g. home, calendar"
                value={formData.iconName}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    iconName: e.target.value,
                  }))
                }
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="item-group">Group Label</Label>
              <Input
                id="item-group"
                placeholder="e.g. Resources"
                value={formData.groupLabel}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    groupLabel: e.target.value,
                  }))
                }
              />
            </div>
          </div>

          {/* Parent item */}
          {topLevelItems.length > 0 && (
            <div className="space-y-1.5">
              <Label>Parent Item</Label>
              <Select
                value={formData.parentId || "__none__"}
                onValueChange={(val) =>
                  setFormData((prev) => ({
                    ...prev,
                    parentId: val === "__none__" ? "" : val,
                  }))
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="None (top-level)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">None (top-level)</SelectItem>
                  {topLevelItems.map((parent) => (
                    <SelectItem key={parent.id} value={parent.id}>
                      {parent.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Toggles */}
          <div className="space-y-3 pt-1">
            <div className="flex items-center justify-between">
              <Label htmlFor="switch-visible" className="font-normal">
                Visible
              </Label>
              <Switch
                id="switch-visible"
                size="sm"
                checked={formData.isVisible}
                onCheckedChange={(checked) =>
                  setFormData((prev) => ({
                    ...prev,
                    isVisible: checked === true,
                  }))
                }
              />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="switch-new-tab" className="font-normal">
                Open in new tab
              </Label>
              <Switch
                id="switch-new-tab"
                size="sm"
                checked={formData.openInNewTab}
                onCheckedChange={(checked) =>
                  setFormData((prev) => ({
                    ...prev,
                    openInNewTab: checked === true,
                  }))
                }
              />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="switch-external" className="font-normal">
                External link
              </Label>
              <Switch
                id="switch-external"
                size="sm"
                checked={formData.isExternal}
                onCheckedChange={(checked) =>
                  setFormData((prev) => ({
                    ...prev,
                    isExternal: checked === true,
                  }))
                }
              />
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={saving}
          >
            Cancel
          </Button>
          <Button
            onClick={onSave}
            disabled={saving || !formData.label.trim()}
          >
            {saving ? (
              <>
                <Loader2 className="size-3.5 animate-spin" />
                Saving...
              </>
            ) : isEditing ? (
              "Save Changes"
            ) : (
              "Add Item"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
