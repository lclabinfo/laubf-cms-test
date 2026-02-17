"use client";

import { useState } from "react"
import { Plus, MoreVertical, Pencil, Trash2, Image as ImageIcon, Search } from "lucide-react"
import { Button } from "@/app/components/ui/button"
import { Input } from "@/app/components/ui/input"
import { Label } from "@/app/components/ui/label"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/app/components/ui/dropdown-menu"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/app/components/ui/dialog"
import {
    Card,
    CardContent,
} from "@/app/components/ui/card"
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/app/components/ui/alert-dialog"
import { toast } from "sonner"
import { type Series, type Entry, mockSeries, addSeries, updateSeries, deleteSeries } from "@/app/data/store"
import { ImageWithFallback } from "@/app/components/figma/ImageWithFallback"
import { DataList } from "../shared/DataList"

interface SeriesListProps {
    entries: Entry[]
    isCreateOpen: boolean
    setIsCreateOpen: (open: boolean) => void
    onSelectSeries?: (seriesId: string) => void
    onCreate: () => void
}

export function SeriesList({ entries, isCreateOpen, setIsCreateOpen, onSelectSeries, onCreate }: SeriesListProps) {
    const [seriesList, setSeriesList] = useState<Series[]>(mockSeries)
    const [editingSeries, setEditingSeries] = useState<Series | null>(null)
    const [deletingSeriesId, setDeletingSeriesId] = useState<string | null>(null)
    const [searchTerm, setSearchTerm] = useState("")

    // Form State
    const [formData, setFormData] = useState({ name: "", imageUrl: "" })

    const handleCreate = () => {
        const newSeries: Series = {
            id: Math.random().toString(36).substring(7),
            name: formData.name,
            imageUrl: formData.imageUrl || "https://images.unsplash.com/photo-1504052434569-70ad5836ab65?q=80&w=300&auto=format&fit=crop" // Default image
        }
        addSeries(newSeries)
        setSeriesList([...seriesList, newSeries])
        setIsCreateOpen(false)
        setFormData({ name: "", imageUrl: "" })
        toast.success("Series created successfully")
    }

    const handleUpdate = () => {
        if (!editingSeries) return
        updateSeries(editingSeries.id, formData)
        setSeriesList(seriesList.map(s => s.id === editingSeries.id ? { ...s, ...formData } : s))
        setEditingSeries(null)
        setFormData({ name: "", imageUrl: "" })
        toast.success("Series updated successfully")
    }

    const handleDelete = () => {
        if (!deletingSeriesId) return
        deleteSeries(deletingSeriesId)
        setSeriesList(seriesList.filter(s => s.id !== deletingSeriesId))
        setDeletingSeriesId(null)
        toast.success("Series deleted")
    }

    const openEdit = (series: Series) => {
        setFormData({ name: series.name, imageUrl: series.imageUrl || "" })
        setEditingSeries(series)
    }

    const getMessageCount = (seriesId: string) => {
        return entries.filter(e => e.seriesIds && e.seriesIds.includes(seriesId)).length
    }

    const filteredSeries = seriesList.filter(s => 
        s.name.toLowerCase().includes(searchTerm.toLowerCase())
    )

    return (
        <div className="space-y-4">
            <DataList
                search={
                    <div className="relative flex-1 md:max-w-sm">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Search series..."
                            className="pl-8 bg-muted/30 border-muted-foreground/20"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                }
                actions={
                    <Button onClick={onCreate}>
                        <Plus className="mr-2 h-4 w-4" />
                        New Series
                    </Button>
                }
            >
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {filteredSeries.map((series) => (
                        <Card 
                            key={series.id} 
                            className="overflow-hidden group cursor-pointer hover:shadow-md transition-all"
                            onClick={() => onSelectSeries?.(series.id)}
                        >
                            <div className="aspect-video relative overflow-hidden bg-muted">
                                {series.imageUrl ? (
                                    <ImageWithFallback 
                                        src={series.imageUrl} 
                                        alt={series.name}
                                        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                                    />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                                        <ImageIcon className="h-10 w-10 opacity-20" />
                                    </div>
                                )}
                                {/* Overlay Menu */}
                                <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity" onClick={(e) => e.stopPropagation()}>
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="secondary" size="icon" className="h-8 w-8 bg-white/90 hover:bg-white shadow-sm">
                                                <MoreVertical className="h-4 w-4" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end">
                                            <DropdownMenuItem onClick={() => openEdit(series)}>
                                                <Pencil className="mr-2 h-4 w-4" />
                                                Edit Series
                                            </DropdownMenuItem>
                                            <DropdownMenuSeparator />
                                            <DropdownMenuItem 
                                                onClick={() => setDeletingSeriesId(series.id)}
                                                className="text-destructive"
                                            >
                                                <Trash2 className="mr-2 h-4 w-4" />
                                                Delete
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </div>
                            </div>
                            <CardContent className="p-4">
                                <h3 className="font-semibold text-lg truncate">{series.name}</h3>
                                <p className="text-sm text-muted-foreground">
                                    {getMessageCount(series.id)} messages
                                </p>
                            </CardContent>
                        </Card>
                    ))}
                    {filteredSeries.length === 0 && (
                        <div className="col-span-full py-12 text-center text-muted-foreground bg-muted/10 rounded-lg border border-dashed">
                            No series found matching your search.
                        </div>
                    )}
                </div>
            </DataList>

            {/* Create Dialog */}
            <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Create New Series</DialogTitle>
                        <DialogDescription>
                            Create a collection to organize related messages.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <Label htmlFor="name">Series Name</Label>
                            <Input 
                                id="name" 
                                value={formData.name} 
                                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                                placeholder="e.g. Summer of Psalms"
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="image">Cover Image URL</Label>
                            <Input 
                                id="image" 
                                value={formData.imageUrl} 
                                onChange={(e) => setFormData(prev => ({ ...prev, imageUrl: e.target.value }))}
                                placeholder="https://..."
                            />
                            <p className="text-xs text-muted-foreground">
                                Paste a URL for the series cover image.
                            </p>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsCreateOpen(false)}>Cancel</Button>
                        <Button onClick={handleCreate} disabled={!formData.name}>Create Series</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Edit Dialog */}
            <Dialog open={!!editingSeries} onOpenChange={(open) => !open && setEditingSeries(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Edit Series</DialogTitle>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <Label htmlFor="edit-name">Series Name</Label>
                            <Input 
                                id="edit-name" 
                                value={formData.name} 
                                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="edit-image">Cover Image URL</Label>
                            <Input 
                                id="edit-image" 
                                value={formData.imageUrl} 
                                onChange={(e) => setFormData(prev => ({ ...prev, imageUrl: e.target.value }))}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setEditingSeries(null)}>Cancel</Button>
                        <Button onClick={handleUpdate} disabled={!formData.name}>Save Changes</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Delete Confirmation */}
            <AlertDialog open={!!deletingSeriesId} onOpenChange={(open) => !open && setDeletingSeriesId(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This will delete the series. The messages within this series will NOT be deleted, but they will no longer be associated with this series.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDelete} className="bg-destructive hover:bg-destructive/90">
                            Delete
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    )
}