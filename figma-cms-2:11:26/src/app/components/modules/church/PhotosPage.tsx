"use client";

import { useState, useRef, useCallback } from "react"
import { Button } from "@/app/components/ui/button"
import { Input } from "@/app/components/ui/input"
import { Label } from "@/app/components/ui/label"
import { Search, Upload, Trash2, FolderInput, LayoutGrid, List as ListIcon, X, Plus } from "lucide-react"
import { mockPhotos, mockFolders, type Photo, type PhotoFolder } from "./photos/data"
import { PhotoGrid } from "./photos/PhotoGrid"
import { PhotoList } from "./photos/PhotoList"
import { FoldersSidebar } from "./photos/FoldersSidebar"
import { PhotoLightbox } from "./photos/PhotoLightbox"
import { toast } from "sonner"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/app/components/ui/dropdown-menu"
import { DndProvider } from 'react-dnd'
import { HTML5Backend } from 'react-dnd-html5-backend'
import { Dialog, DialogContent, DialogTitle, DialogDescription, DialogHeader, DialogFooter } from "@/app/components/ui/dialog"
import update from 'immutability-helper'
import { PageContainer, PageHeader } from "./shared/PageLayout"
import { DataList } from "./shared/DataList"

export function PhotosPage() {
    const [photos, setPhotos] = useState<Photo[]>(mockPhotos)
    const [folders, setFolders] = useState<PhotoFolder[]>(mockFolders)
    const [activeFolderId, setActiveFolderId] = useState("all")
    const [selectedIds, setSelectedIds] = useState<string[]>([])
    const [searchTerm, setSearchTerm] = useState("")
    const [previewPhotoId, setPreviewPhotoId] = useState<string | null>(null)
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
    
    // Create Folder Dialog State
    const [isCreateFolderOpen, setIsCreateFolderOpen] = useState(false)
    const [newFolderName, setNewFolderName] = useState("")
    
    const fileInputRef = useRef<HTMLInputElement>(null)

    // Filter Logic
    const filteredPhotos = photos.filter(photo => {
        // Global search overrides folder selection
        if (searchTerm) {
            return photo.name.toLowerCase().includes(searchTerm.toLowerCase());
        }
        // Folder filter
        return activeFolderId === "all" || photo.folderId === activeFolderId;
    });

    // Folder counts update
    const foldersWithCounts = folders.map(folder => {
        if (folder.id === "all") return { ...folder, count: photos.length };
        return {
            ...folder,
            count: photos.filter(p => p.folderId === folder.id).length
        }
    });

    // Actions
    const handleUploadClick = () => {
        fileInputRef.current?.click();
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files || files.length === 0) return;

        const newPhotos: Photo[] = Array.from(files).map(file => ({
            id: Math.random().toString(36).substring(7),
            url: URL.createObjectURL(file), // Create local preview URL
            name: file.name,
            date: new Date().toISOString(),
            folderId: activeFolderId === "all" ? "sunday-service" : activeFolderId, // Default to current folder or sunday-service
            size: `${(file.size / (1024 * 1024)).toFixed(1)} MB`,
            type: file.type.split('/')[1]?.toUpperCase() || "JPG"
        }));

        setPhotos(prev => [...newPhotos, ...prev]);
        toast.success(`${newPhotos.length} photos uploaded successfully`);
        e.target.value = ""; // Reset input
    };

    const handleDelete = (id: string) => {
        setPhotos(photos.filter(p => p.id !== id));
        setSelectedIds(selectedIds.filter(sid => sid !== id));
        toast.success("Photo deleted");
    };

    const handleBulkDelete = () => {
        if (!confirm(`Are you sure you want to delete ${selectedIds.length} photos?`)) return;
        setPhotos(photos.filter(p => !selectedIds.includes(p.id)));
        setSelectedIds([]);
        toast.success("Photos deleted");
    };

    const handleMove = (id: string, folderId: string) => {
        setPhotos(photos.map(p => p.id === id ? { ...p, folderId } : p));
        toast.success("Photo moved");
    };

    const handleBulkMove = (folderId: string) => {
        setPhotos(photos.map(p => selectedIds.includes(p.id) ? { ...p, folderId } : p));
        setSelectedIds([]);
        toast.success(`Moved ${selectedIds.length} photos`);
    };

    const handleRename = (id: string, newName: string) => {
        setPhotos(photos.map(p => p.id === id ? { ...p, name: newName } : p));
        toast.success("Photo renamed");
    };
    
    const handleRenameFolder = (id: string) => {
        const folder = folders.find(f => f.id === id);
        if (!folder) return;
        
        const newName = prompt("Rename folder:", folder.name);
        if (newName && newName.trim() !== "") {
            setFolders(folders.map(f => f.id === id ? { ...f, name: newName } : f));
            toast.success("Folder renamed");
        }
    };

    const handleDeleteFolder = (id: string) => {
        if (id === "all") return;
        if (!confirm("Are you sure you want to delete this folder? Photos inside will not be deleted but will be moved to 'All Photos' view.")) return;
        
        // Remove folder
        setFolders(folders.filter(f => f.id !== id));
        
        // Optional: Reset active folder if deleted
        if (activeFolderId === id) setActiveFolderId("all");
        
        toast.success("Folder deleted");
    };

    const handleCreateFolder = () => {
        const name = newFolderName.trim();
        if (!name) return;
        
        // Check for duplicates
        if (folders.some(f => f.name.toLowerCase() === name.toLowerCase())) {
            toast.error("Folder already exists");
            return;
        }

        const newFolder: PhotoFolder = {
            id: name.toLowerCase().replace(/\s+/g, "-") + "-" + Math.random().toString(36).substring(7),
            name,
            count: 0
        };
        setFolders([...folders, newFolder]);
        setNewFolderName("");
        setIsCreateFolderOpen(false);
        toast.success("Folder created");
    };

    const handleSelect = (id: string, checked: boolean) => {
        if (checked) {
            setSelectedIds([...selectedIds, id]);
        } else {
            setSelectedIds(selectedIds.filter(sid => sid !== id));
        }
    };
    
    const handleMoveFolder = useCallback((dragIndex: number, hoverIndex: number) => {
        const editableFolders = folders.filter(f => f.id !== "all");
        const allFolder = folders.find(f => f.id === "all");
        
        const draggedFolder = editableFolders[dragIndex];
        
        const updatedEditableFolders = update(editableFolders, {
            $splice: [
                [dragIndex, 1],
                [hoverIndex, 0, draggedFolder],
            ],
        });
        
        if (allFolder) {
            setFolders([allFolder, ...updatedEditableFolders]);
        } else {
            setFolders(updatedEditableFolders);
        }
    }, [folders]);

    // Preview Navigation
    const previewIndex = previewPhotoId ? filteredPhotos.findIndex(p => p.id === previewPhotoId) : -1;
    const previewPhoto = previewIndex >= 0 ? filteredPhotos[previewIndex] : null;

    const handleNextPreview = () => {
        if (previewIndex < filteredPhotos.length - 1) {
            setPreviewPhotoId(filteredPhotos[previewIndex + 1].id);
        }
    };

    const handlePrevPreview = () => {
        if (previewIndex > 0) {
            setPreviewPhotoId(filteredPhotos[previewIndex - 1].id);
        }
    };

    return (
        <DndProvider backend={HTML5Backend}>
            <PageContainer className="h-full flex flex-col">
                {/* Header */}
                <PageHeader 
                    title="Photos" 
                    description="Manage your photo library and albums."
                    actions={(
                        <div className="flex gap-2">
                            <input 
                                type="file" 
                                ref={fileInputRef} 
                                className="hidden" 
                                multiple
                                accept="image/png, image/jpeg, image/webp"
                                onChange={handleFileChange}
                            />
                            <Button onClick={handleUploadClick}>
                                <Upload className="mr-2 h-4 w-4" />
                                Upload Photos
                            </Button>
                        </div>
                    )}
                />

                <DataList
                    search={
                        <div className="relative flex-1 md:max-w-sm">
                            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Search all photos..."
                                className="pl-8 bg-muted/30 border-muted-foreground/20 w-full"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                    }
                    actions={
                         <div className="border rounded-md flex items-center p-1 bg-muted/20 ml-auto shrink-0 animate-in fade-in slide-in-from-top-1 duration-200">
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
                    }
                    selectionActions={selectedIds.length > 0 ? (
                        <div className="flex items-center gap-2 animate-in fade-in slide-in-from-top-1 duration-200">
                            <span className="text-sm font-medium mr-2 min-w-[80px]">
                                {selectedIds.length} selected
                            </span>
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="outline" size="sm" className="h-9">
                                        <FolderInput className="mr-2 h-4 w-4" />
                                        Move to...
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="start">
                                    {folders.filter(f => f.id !== "all").map(folder => (
                                        <DropdownMenuItem key={folder.id} onClick={() => handleBulkMove(folder.id)}>
                                            {folder.name}
                                        </DropdownMenuItem>
                                    ))}
                                </DropdownMenuContent>
                            </DropdownMenu>
                            
                            <Button 
                                variant="destructive" 
                                size="sm" 
                                className="h-9"
                                onClick={handleBulkDelete}
                            >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Delete
                            </Button>
                            
                            <Button 
                                variant="ghost" 
                                size="icon" 
                                className="ml-auto h-9 w-9"
                                onClick={() => setSelectedIds([])}
                            >
                                <X className="h-4 w-4" />
                                <span className="sr-only">Cancel selection</span>
                            </Button>
                        </div>
                    ) : null}
                >
                    {/* Main Content Area */}
                    <div className="flex flex-1 border rounded-lg bg-background overflow-hidden shadow-sm h-[600px]">
                        {/* Sidebar */}
                        <FoldersSidebar 
                            folders={foldersWithCounts} 
                            activeFolderId={activeFolderId} 
                            onSelectFolder={setActiveFolderId}
                            onCreateFolder={() => setIsCreateFolderOpen(true)}
                            onDropPhoto={handleMove}
                            onMoveFolder={handleMoveFolder}
                            onRenameFolder={handleRenameFolder}
                            onDeleteFolder={handleDeleteFolder}
                        />

                        {/* Right Content */}
                        <div className="flex-1 flex flex-col min-w-0">
                            {/* View Content */}
                            <div className="flex-1 overflow-y-auto p-6">
                                {viewMode === 'grid' ? (
                                    <PhotoGrid 
                                        photos={filteredPhotos}
                                        folders={folders}
                                        selectedIds={selectedIds}
                                        onSelect={handleSelect}
                                        onDelete={handleDelete}
                                        onMove={handleMove}
                                        onRename={handleRename}
                                        onPreview={(photo) => setPreviewPhotoId(photo.id)}
                                    />
                                ) : (
                                    <PhotoList 
                                        photos={filteredPhotos}
                                        folders={folders}
                                        selectedIds={selectedIds}
                                        onSelect={handleSelect}
                                        onDelete={handleDelete}
                                        onMove={handleMove}
                                        onRename={handleRename}
                                        onPreview={(photo) => setPreviewPhotoId(photo.id)}
                                    />
                                )}
                            </div>
                        </div>
                    </div>
                </DataList>

                {/* Create Folder Dialog */}
                <Dialog open={isCreateFolderOpen} onOpenChange={setIsCreateFolderOpen}>
                    <DialogContent className="sm:max-w-[425px]">
                        <DialogHeader>
                            <DialogTitle>Create Folder</DialogTitle>
                            <DialogDescription>
                                Enter a name for the new folder.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                            <div className="grid gap-2">
                                <Label htmlFor="name">Name</Label>
                                <Input
                                    id="name"
                                    value={newFolderName}
                                    onChange={(e) => setNewFolderName(e.target.value)}
                                    placeholder="e.g., Sunday Service"
                                    onKeyDown={(e) => {
                                        if (e.key === "Enter") handleCreateFolder();
                                    }}
                                />
                            </div>
                        </div>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setIsCreateFolderOpen(false)}>Cancel</Button>
                            <Button onClick={handleCreateFolder}>Create Folder</Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>

                {/* Full Screen Lightbox */}
                <PhotoLightbox 
                    photo={previewPhoto}
                    isOpen={!!previewPhotoId}
                    onClose={() => setPreviewPhotoId(null)}
                    onNext={handleNextPreview}
                    onPrev={handlePrevPreview}
                    hasNext={previewIndex < filteredPhotos.length - 1}
                    hasPrev={previewIndex > 0}
                    onDelete={handleDelete}
                    onRename={handleRename}
                />
            </PageContainer>
        </DndProvider>
    )
}