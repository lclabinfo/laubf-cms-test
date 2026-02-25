"use client";

import { useState } from "react"
import { 
    Dialog, 
    DialogContent, 
    DialogHeader, 
    DialogTitle, 
    DialogDescription,
    DialogFooter 
} from "@/app/components/ui/dialog"
import { Button } from "@/app/components/ui/button"
import { Input } from "@/app/components/ui/input"
import { Search, LayoutGrid, List as ListIcon, Filter, FolderInput, ArrowLeft, X } from "lucide-react"
import { mockMedia, mockFolders, type MediaItem, type MediaFolder } from "../photos/data"
import { PhotoGrid } from "../photos/PhotoGrid"
import { PhotoList } from "../photos/PhotoList"
import { FoldersSidebar } from "../photos/FoldersSidebar"
import { Separator } from "@/app/components/ui/separator"
import { cn } from "@/app/components/ui/utils"

interface MediaSelectorDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    onSelect: (url: string) => void
}

export function MediaSelectorDialog({ open, onOpenChange, onSelect }: MediaSelectorDialogProps) {
    const [activeFolderId, setActiveFolderId] = useState("all")
    const [selectedId, setSelectedId] = useState<string | null>(null)
    const [searchTerm, setSearchTerm] = useState("")
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
    
    // We use mock data directly here for the selector
    // In a real app, this would fetch from an API
    const media = mockMedia; 
    const folders = mockFolders;

    // Filter Logic
    const filteredMedia = media.filter(item => {
        // Global search overrides folder selection
        if (searchTerm) {
            return item.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                   item.tags?.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
        }
        
        if (activeFolderId === "all") {
             const folderIds = folders.filter(f => f.id !== 'all').map(f => f.id);
             return !folderIds.includes(item.folderId);
        }
        
        return item.folderId === activeFolderId;
    });

    // Counts Calculation
    const mediaCounts = {
        all: media.length,
        photos: media.filter(m => m.type === "JPG" || m.type === "PNG" || m.type === "WEBP").length,
        videos: media.filter(m => m.type === "YOUTUBE" || m.type === "VIMEO").length
    };

    const foldersWithCounts = folders.map(folder => {
        if (folder.id === "all") return { ...folder, count: media.length };
        return {
            ...folder,
            count: media.filter(p => p.folderId === folder.id).length
        }
    });

    const foldersToDisplay = activeFolderId === "all" 
        ? foldersWithCounts.filter(f => f.id !== "all") 
        : [];

    const handleConfirm = () => {
        if (selectedId) {
            const selectedItem = media.find(m => m.id === selectedId);
            if (selectedItem) {
                onSelect(selectedItem.url);
                onOpenChange(false);
            }
        }
    };

    const handleItemClick = (item: MediaItem) => {
        if (selectedId === item.id) {
            // Double click behavior (confirm) could be implemented here if we tracked clicks
             // For now, just keep selection
        } else {
            setSelectedId(item.id);
        }
    };

    const activeFolderName = folders.find(f => f.id === activeFolderId)?.name || "All Media";

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-5xl w-full h-[80vh] flex flex-col p-0 gap-0 overflow-hidden [&>button.absolute.top-4.right-4]:hidden">
                <DialogHeader className="p-4 pb-2 border-b shrink-0 flex flex-row items-center justify-between space-y-0">
                    <div className="flex flex-col gap-1">
                        <DialogTitle>Select Media</DialogTitle>
                        <DialogDescription className="sr-only">
                            Browse and select media files from your library.
                        </DialogDescription>
                    </div>
                    <div className="flex items-center gap-2">
                         <div className="relative w-64">
                            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Search files..."
                                className="pl-8 h-9"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <div className="border rounded-md flex items-center p-1 bg-muted/20">
                            <Button
                                variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
                                size="sm"
                                className="h-7 px-2"
                                onClick={() => setViewMode('grid')}
                            >
                                <LayoutGrid className="h-4 w-4" />
                            </Button>
                            <Button
                                variant={viewMode === 'list' ? 'secondary' : 'ghost'}
                                size="sm"
                                className="h-7 px-2"
                                onClick={() => setViewMode('list')}
                            >
                                <ListIcon className="h-4 w-4" />
                            </Button>
                        </div>
                        <Button variant="ghost" size="icon" className="shrink-0" onClick={() => onOpenChange(false)}>
                            <X className="h-4 w-4" />
                            <span className="sr-only">Close</span>
                        </Button>
                    </div>
                </DialogHeader>
                
                <div className="flex flex-1 overflow-hidden">
                    {/* Sidebar */}
                    <div className="w-64 border-r bg-muted/10 flex flex-col overflow-y-auto">
                         <div className="p-4">
                            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Folders</h3>
                            <div className="space-y-1">
                                {foldersWithCounts.filter(f => f.id !== 'all').map(folder => (
                                    <Button
                                        key={folder.id}
                                        variant={activeFolderId === folder.id ? "secondary" : "ghost"}
                                        className={cn("w-full justify-start text-sm font-normal", activeFolderId === folder.id && "font-medium")}
                                        onClick={() => setActiveFolderId(folder.id)}
                                    >
                                        <FolderInput className="mr-2 h-4 w-4 text-muted-foreground" />
                                        <span className="truncate flex-1 text-left">{folder.name}</span>
                                        <span className="text-xs text-muted-foreground ml-auto">{folder.count}</span>
                                    </Button>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Main Content */}
                    <div className="flex-1 flex flex-col min-w-0 bg-background">
                        {/* Breadcrumbs / Header */}
                        <div className="p-4 border-b flex items-center gap-2 text-sm">
                            {activeFolderId !== "all" && (
                                <Button variant="ghost" size="sm" className="h-6 w-6 p-0 mr-1" onClick={() => setActiveFolderId("all")}>
                                    <ArrowLeft className="h-4 w-4" />
                                </Button>
                            )}
                            <span className="font-medium text-lg">{activeFolderName}</span>
                            <span className="text-muted-foreground text-sm ml-2">({filteredMedia.length} items)</span>
                        </div>

                        <div className="flex-1 overflow-y-auto p-4">
                             {viewMode === 'grid' ? (
                                <PhotoGrid 
                                    photos={filteredMedia as any}
                                    folders={folders} 
                                    displayFolders={foldersToDisplay}
                                    selectedIds={selectedId ? [selectedId] : []}
                                    onSelect={(id) => setSelectedId(id)}
                                    onDelete={() => {}} // Disable delete in selector
                                    onMove={() => {}} // Disable move
                                    onRename={() => {}} // Disable rename
                                    onPreview={handleItemClick} // Click selects/previews
                                    onFolderClick={setActiveFolderId}
                                    enableDragDrop={false}
                                />
                            ) : (
                                <PhotoList 
                                    photos={filteredMedia as any}
                                    folders={folders}
                                    displayFolders={foldersToDisplay}
                                    selectedIds={selectedId ? [selectedId] : []}
                                    onSelect={(id) => setSelectedId(id)}
                                    onDelete={() => {}}
                                    onMove={() => {}}
                                    onRename={() => {}}
                                    onPreview={handleItemClick}
                                    onFolderClick={setActiveFolderId}
                                    enableDragDrop={false}
                                />
                            )}
                        </div>
                    </div>
                </div>

                <DialogFooter className="p-4 border-t shrink-0 bg-muted/10">
                    <div className="flex items-center justify-between w-full">
                        <div className="text-sm text-muted-foreground">
                            {selectedId ? "1 item selected" : "No item selected"}
                        </div>
                        <div className="flex gap-2">
                             <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
                             <Button onClick={handleConfirm} disabled={!selectedId}>Select</Button>
                        </div>
                    </div>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
