"use client";

import { useState, useRef, useCallback } from "react"
import { Button } from "@/app/components/ui/button"
import { Input } from "@/app/components/ui/input"
import { Label } from "@/app/components/ui/label"
import { Search, Upload, Trash2, FolderInput, LayoutGrid, List as ListIcon, X, Video, Link, Tag, Plus, Cloud, Link as LinkIcon, RefreshCw, Filter, ChevronRight, ArrowDownAZ, ArrowUpAZ, CalendarArrowDown, CalendarArrowUp, Check } from "lucide-react"
import { mockMedia, mockFolders, type MediaItem, type MediaFolder, type MediaType } from "./photos/data"
import { PhotoGrid } from "./photos/PhotoGrid"
import { PhotoList } from "./photos/PhotoList"
import { FoldersSidebar } from "./photos/FoldersSidebar"
import { PhotoLightbox } from "./photos/PhotoLightbox"
import { GoogleAlbumsTable } from "./photos/GoogleAlbumsTable"
import { GoogleAlbumDetails } from "./photos/GoogleAlbumDetails"
import { toast } from "sonner"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
    DropdownMenuSeparator,
} from "@/app/components/ui/dropdown-menu"
import { DndProvider } from 'react-dnd'
import { HTML5Backend } from 'react-dnd-html5-backend'
import { Dialog, DialogContent, DialogTitle, DialogDescription, DialogHeader, DialogFooter } from "@/app/components/ui/dialog"
import update from 'immutability-helper'
import { PageContainer, PageHeader } from "./shared/PageLayout"
import { DataList } from "./shared/DataList"
import { cn } from "@/app/components/ui/utils"

import {
    CommandDialog,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from "@/app/components/ui/command"

export function MediaPage() {
    const [media, setMedia] = useState<MediaItem[]>([
        ...mockMedia,
        { 
            id: "root-1", 
            url: "https://images.unsplash.com/photo-1544642899-f0d6e5f6ed6f?w=500&h=500&fit=crop", 
            name: "Unsorted Photo.jpg", 
            date: new Date().toISOString(), 
            folderId: "root", 
            type: "JPG", 
            size: "1.2 MB",
            tags: ["unsorted"] 
        },
        { 
            id: "g1", 
            url: "https://images.unsplash.com/photo-1517732306149-e8f129dcb9f7?w=500&h=500&fit=crop", 
            name: "Worship (Google Sync)", 
            date: new Date().toISOString(), 
            folderId: "google-1", 
            type: "JPG", 
            size: "1.5 MB",
            tags: ["google", "worship"] 
        }
    ])
    const [folders, setFolders] = useState<MediaFolder[]>([
        ...mockFolders,
        { 
            id: "google-1", 
            name: "Website Carousel (Google)", 
            count: 24, 
            type: "google",
            coverUrl: "https://images.unsplash.com/photo-1517732306149-e8f129dcb9f7?w=500&h=500&fit=crop",
            status: "Used",
            externalUrl: "https://photos.google.com"
        }
    ])
    const [activeFolderId, setActiveFolderId] = useState("all")
    const [selectedIds, setSelectedIds] = useState<string[]>([])
    const [searchTerm, setSearchTerm] = useState("")
    const [previewMediaId, setPreviewMediaId] = useState<string | null>(null)
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
    
    // Sort State
    const [sortConfig, setSortConfig] = useState<{ key: 'name' | 'lastModified', direction: 'asc' | 'desc' }>({ key: 'lastModified', direction: 'desc' })

    // Create Folder Dialog State
    const [isCreateFolderOpen, setIsCreateFolderOpen] = useState(false)
    const [newFolderName, setNewFolderName] = useState("")

    // Add Video Dialog State
    const [isAddVideoOpen, setIsAddVideoOpen] = useState(false)
    const [videoLink, setVideoLink] = useState("")
    
    // Edit Media Dialog State (Deprecated for Lightbox, but keeping for compatibility if referenced)
    const [editingMedia, setEditingMedia] = useState<MediaItem | null>(null)
    const [editName, setEditName] = useState("")
    const [editTags, setEditTags] = useState("")

    // Move Dialog State
    const [isMoveDialogOpen, setIsMoveDialogOpen] = useState(false)
    const [movingMediaIds, setMovingMediaIds] = useState<string[]>([])

    // Google Photos Dialog State
    const [isGoogleConnectOpen, setIsGoogleConnectOpen] = useState(false);
    const [googleAlbumLink, setGoogleAlbumLink] = useState("");
    const [isConnectingGoogle, setIsConnectingGoogle] = useState(false);
    const [viewingAlbum, setViewingAlbum] = useState<MediaFolder | null>(null);
    
    const fileInputRef = useRef<HTMLInputElement>(null)

    // Filter Logic
    const filteredMedia = media.filter(item => {
        // Global search overrides folder selection
        if (searchTerm) {
            return item.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                   item.tags?.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
        }
        
        // Handle Static Filters
        if (activeFolderId === "all") {
             const folderIds = folders
                .filter(f => f.id !== 'all')
                .map(f => f.id);
             return !folderIds.includes(item.folderId);
        }
        if (activeFolderId === "photos") return item.type === "JPG" || item.type === "PNG" || item.type === "WEBP";
        if (activeFolderId === "videos") return item.type === "YOUTUBE" || item.type === "VIMEO";
        if (activeFolderId === "google-albums") return false;
        
        // Folder filter
        return item.folderId === activeFolderId;
    }).sort((a, b) => {
        if (sortConfig.key === 'name') {
            return sortConfig.direction === 'asc' 
                ? a.name.localeCompare(b.name)
                : b.name.localeCompare(a.name);
        } else {
            // Sort by lastModified (fallback to date if not present)
            const dateA = new Date(a.lastModified || a.date).getTime();
            const dateB = new Date(b.lastModified || b.date).getTime();
            return sortConfig.direction === 'asc' 
                ? dateA - dateB 
                : dateB - dateA;
        }
    });

    // Counts Calculation
    const mediaCounts = {
        all: media.length,
        photos: media.filter(m => m.type === "JPG" || m.type === "PNG" || m.type === "WEBP").length,
        videos: media.filter(m => m.type === "YOUTUBE" || m.type === "VIMEO").length
    };

    // Folder counts update
    const foldersWithCounts = folders.map(folder => {
        // We handle 'all' count separately in mediaCounts.all, but keeping it here for safety if used elsewhere
        if (folder.id === "all") return { ...folder, count: media.length };
        return {
            ...folder,
            count: media.filter(p => p.folderId === folder.id).length
        }
    });

    // Actions
    const handleUploadClick = () => {
        fileInputRef.current?.click();
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files || files.length === 0) return;

        const count = files.length;
        
        // Mock upload progress with promise
        const uploadPromise = new Promise<number>((resolve) => {
             // Simulate upload time
             setTimeout(() => {
                 const newMedia: MediaItem[] = Array.from(files).map(file => ({
                    id: Math.random().toString(36).substring(7),
                    url: URL.createObjectURL(file), // Create local preview URL
                    name: file.name,
                    date: new Date().toISOString(),
                    folderId: activeFolderId === "all" || activeFolderId === "photos" || activeFolderId === "videos" || activeFolderId === "google-photos" ? "sunday-service" : activeFolderId, 
                    size: `${(file.size / (1024 * 1024)).toFixed(1)} MB`,
                    type: file.type.split('/')[1]?.toUpperCase() as MediaType || "JPG"
                }));

                setMedia(prev => [...newMedia, ...prev]);
                resolve(newMedia.length);
             }, 1500);
        });

        toast.promise(uploadPromise, {
            loading: `Uploading ${count} items...`,
            success: (data) => ({
                 label: "Upload complete",
                 description: `Successfully uploaded ${data} photos.`,
                 action: {
                     label: "View",
                     onClick: () => {
                         // User wants to stay on current view or explicitly navigate, but not auto-switch context abruptly
                         // if (activeFolderId === "google-photos") setActiveFolderId("all");
                     }
                 }
            }),
            error: "Failed to upload photos"
        });

        e.target.value = ""; // Reset input
    };

    const handleAddVideo = () => {
        if (!videoLink) return;

        const processVideo = async () => {
             await new Promise(resolve => setTimeout(resolve, 1000));
             
             let type: MediaType = "YOUTUBE";
             let thumbnail = "https://images.unsplash.com/photo-1611162617474-5b21e879e113?w=500&h=500&fit=crop"; // Default placeholder
    
             if (videoLink.includes("vimeo")) {
                 type = "VIMEO";
                 thumbnail = "https://images.unsplash.com/photo-1611162618071-b39a2ec055fb?w=500&h=500&fit=crop"; // Vimeo placeholder
             } else if (videoLink.includes("youtube") || videoLink.includes("youtu.be")) {
                  type = "YOUTUBE";
                  // Try to get thumbnail from youtube
                  try {
                     let videoId = "";
                     if (videoLink.includes("v=")) {
                         videoId = videoLink.split("v=")[1].split("&")[0];
                     } else if (videoLink.includes("youtu.be/")) {
                         videoId = videoLink.split("youtu.be/")[1].split("?")[0];
                     }
                     if (videoId) {
                         thumbnail = `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`;
                     }
                  } catch (e) {
                      console.error("Failed to parse youtube url", e);
                  }
             }
    
             const newVideo: MediaItem = {
                 id: Math.random().toString(36).substring(7),
                 url: thumbnail,
                 name: "New Video",
                 originalTitle: "Imported Video (Mock)", 
                 date: new Date().toISOString(),
                 folderId: activeFolderId === "all" || activeFolderId === "photos" || activeFolderId === "videos" ? "worship" : activeFolderId,
                 type: type,
                 videoUrl: videoLink,
                 tags: []
             };
    
             setMedia(prev => [newVideo, ...prev]);
             setVideoLink("");
             setIsAddVideoOpen(false);
             // Automatically open preview
             setPreviewMediaId(newVideo.id);
             return newVideo;
        };

        toast.promise(processVideo(), {
            loading: "Adding video...",
            success: (video) => ({
                label: "Video added",
                description: "Video has been added to your library.",
            }),
            error: "Failed to add video"
        });
    };

    const handleConnectGoogleAlbum = () => {
        if (!googleAlbumLink) return;

        setIsConnectingGoogle(true);

        const processConnect = async () => {
            // Mock API delay
            await new Promise(resolve => setTimeout(resolve, 2000));
            
            // Generate a new folder ID
            const newFolderId = `google-${Math.random().toString(36).substring(7)}`;
            const albumName = "Imported Google Album"; // Mock name, normally fetched

            // Add new folder
            const newFolder: MediaFolder = {
                id: newFolderId,
                name: "Church Event Album", // simulating a fetched name
                count: 15, 
                type: 'google',
                coverUrl: "https://images.unsplash.com/photo-1511632765486-a01980e01a18?w=500&h=500&fit=crop",
                status: 'Unused', 
                externalUrl: googleAlbumLink
            };
            
            setFolders(prev => [...prev, newFolder]);
            // Removed: setMedia(...) - Google albums do not pollute the main media library
            
            setGoogleAlbumLink("");
            setIsGoogleConnectOpen(false);
            setIsConnectingGoogle(false);
            
            return newFolder;
        };

        toast.promise(processConnect(), {
            loading: "Connecting to Google Photos...",
            success: (folder) => ({
                label: "Album Connected",
                description: `${folder.name} has been added to your folders.`,
                action: {
                    label: "View Album",
                    onClick: () => setActiveFolderId(folder.id)
                }
            }),
            error: "Failed to connect album. Check the link and try again."
        });
    };

    const handleDelete = (id: string) => {
        setMedia(media.filter(p => p.id !== id));
        setSelectedIds(selectedIds.filter(sid => sid !== id));
        toast.success("Item deleted");
    };

    const handleBulkDelete = () => {
        if (!confirm(`Are you sure you want to delete ${selectedIds.length} items?`)) return;
        setMedia(media.filter(p => !selectedIds.includes(p.id)));
        setSelectedIds([]);
        toast.success("Items deleted");
    };

    const handleMove = (id: string, folderId: string) => {
        setMedia(media.map(p => p.id === id ? { ...p, folderId } : p));
        toast.success("Item moved");
    };

    const handleBulkMove = (folderId: string) => {
        setMedia(media.map(p => selectedIds.includes(p.id) ? { ...p, folderId } : p));
        setSelectedIds([]);
        toast.success(`Moved ${selectedIds.length} items`);
    };

    const handleMoveRequest = (ids: string[]) => {
        setMovingMediaIds(ids);
        setIsMoveDialogOpen(true);
    };

    const handleMoveConfirm = (folderId: string) => {
        setMedia(media.map(p => movingMediaIds.includes(p.id) ? { ...p, folderId } : p));
        setMovingMediaIds([]);
        setIsMoveDialogOpen(false);
        // Clear selection if it was a bulk move
        if (selectedIds.length > 0 && movingMediaIds.some(id => selectedIds.includes(id))) {
            setSelectedIds([]);
        }
        toast.success(`Moved ${movingMediaIds.length} items`);
    };

    const handleRename = (id: string, newName: string) => {
        setMedia(media.map(p => p.id === id ? { ...p, name: newName } : p));
        toast.success("Item renamed");
    };

    const handleEditSave = () => {
        if (!editingMedia) return;
        
        const tagsArray = editTags.split(',').map(t => t.trim()).filter(t => t !== "");
        
        setMedia(media.map(p => p.id === editingMedia.id ? { 
            ...p, 
            name: editName,
            tags: tagsArray
        } : p));
        
        setEditingMedia(null);
        toast.success("Changes saved");
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
        if (!confirm("Are you sure you want to delete this folder? Items inside will not be deleted but will be moved to 'All Media' view.")) return;
        
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

        const newFolder: MediaFolder = {
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
    const previewIndex = previewMediaId ? filteredMedia.findIndex(p => p.id === previewMediaId) : -1;
    let previewItem = previewIndex >= 0 ? filteredMedia[previewIndex] : null;
    
    // Fallback: If not found in filtered list, find in full list to ensure modal opens
    if (previewMediaId && !previewItem) {
        previewItem = media.find(p => p.id === previewMediaId) || null;
    }

    const handleNextPreview = () => {
        if (previewIndex < filteredMedia.length - 1) {
            setPreviewMediaId(filteredMedia[previewIndex + 1].id);
        }
    };

    const handlePrevPreview = () => {
        if (previewIndex > 0) {
            setPreviewMediaId(filteredMedia[previewIndex - 1].id);
        }
    };
    
    // Open edit dialog for a specific item (Now opens Lightbox)
    const openEditDialog = (item: MediaItem) => {
        setPreviewMediaId(item.id);
    };

    // Folders to display in Grid (only when in All Media or Google Albums)
    const foldersToDisplay = activeFolderId === "all" 
        ? folders.filter(f => f.id !== "all") 
        : activeFolderId === "google-albums"
            ? folders.filter(f => f.type === "google")
            : [];

    return (
        <DndProvider backend={HTML5Backend}>
            <PageContainer className="h-full flex flex-col">
                <PageHeader 
                    title="Media" 
                    description="Manage your photos and videos."
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
                            
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button className="gap-2">
                                        <Plus className="h-4 w-4" />
                                        Add New
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                    <DropdownMenuItem onClick={handleUploadClick}>
                                        <Upload className="mr-2 h-4 w-4" />
                                        Upload Photos
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => setIsAddVideoOpen(true)}>
                                        <Video className="mr-2 h-4 w-4" />
                                        Add Video Link
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => {
                                        setIsGoogleConnectOpen(true);
                                    }}>
                                        <Cloud className="mr-2 h-4 w-4" />
                                        Connect Google Album
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>
                    )}
                />

                {/* Toolbar Area */}
                <div className="flex flex-col gap-4 md:flex-row md:items-center justify-between pb-2">
                    {/* Left Side: Search + Filters */}
                    {selectedIds.length > 0 ? (
                        <div className="flex items-center gap-2 animate-in fade-in slide-in-from-top-1 duration-200 w-full">
                            <span className="text-sm font-medium mr-2 min-w-[80px]">
                                {selectedIds.length} selected
                            </span>
                            <Button 
                                variant="outline" 
                                size="sm" 
                                className="h-9"
                                onClick={() => handleMoveRequest(selectedIds)}
                            >
                                <FolderInput className="mr-2 h-4 w-4" />
                                Move to...
                            </Button>
                            
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
                    ) : (
                        <>
                            <div className="flex flex-1 items-center gap-2 max-w-2xl min-w-0">
                                <div className="relative flex-1 md:max-w-sm">
                                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        placeholder="Search media..."
                                        className="pl-8 bg-muted/30 border-muted-foreground/20 w-full"
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                    />
                                </div>
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="outline" className="gap-2">
                                            <Filter className="h-4 w-4" />
                                            Filter
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent>
                                        <DropdownMenuItem onClick={() => {
                                            setActiveFolderId('all');
                                            setSortConfig({ key: 'lastModified', direction: 'desc' });
                                        }}>
                                            All Items
                                        </DropdownMenuItem>
                                        <DropdownMenuItem onClick={() => setActiveFolderId('photos')}>
                                            Photos Only
                                        </DropdownMenuItem>
                                        <DropdownMenuItem onClick={() => setActiveFolderId('videos')}>
                                            Videos Only
                                        </DropdownMenuItem>
                                        
                                        <DropdownMenuSeparator />
                                        
                                        <DropdownMenuItem onClick={() => setSortConfig({ key: 'lastModified', direction: 'desc' })}>
                                            <CalendarArrowDown className="mr-2 h-4 w-4" />
                                            Newest First
                                            {sortConfig.key === 'lastModified' && sortConfig.direction === 'desc' && <Check className="ml-auto h-4 w-4" />}
                                        </DropdownMenuItem>
                                        <DropdownMenuItem onClick={() => setSortConfig({ key: 'lastModified', direction: 'asc' })}>
                                            <CalendarArrowUp className="mr-2 h-4 w-4" />
                                            Oldest First
                                            {sortConfig.key === 'lastModified' && sortConfig.direction === 'asc' && <Check className="ml-auto h-4 w-4" />}
                                        </DropdownMenuItem>
                                        <DropdownMenuItem onClick={() => setSortConfig({ key: 'name', direction: 'asc' })}>
                                            <ArrowDownAZ className="mr-2 h-4 w-4" />
                                            Name (A-Z)
                                            {sortConfig.key === 'name' && sortConfig.direction === 'asc' && <Check className="ml-auto h-4 w-4" />}
                                        </DropdownMenuItem>
                                        <DropdownMenuItem onClick={() => setSortConfig({ key: 'name', direction: 'desc' })}>
                                            <ArrowUpAZ className="mr-2 h-4 w-4" />
                                            Name (Z-A)
                                            {sortConfig.key === 'name' && sortConfig.direction === 'desc' && <Check className="ml-auto h-4 w-4" />}
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </div>
                            
                            {/* Right Side: View Toggles */}
                            {/* Moved to breadcrumb header */}
                        </>
                    )}
                </div>

                <div className="flex flex-1 overflow-hidden gap-6">
                    {/* Sidebar */}
                    <FoldersSidebar 
                        folders={foldersWithCounts} 
                        activeFolderId={activeFolderId} 
                        mediaCounts={mediaCounts}
                        onSelectFolder={setActiveFolderId}
                        onCreateFolder={() => setIsCreateFolderOpen(true)}
                        onDropPhoto={handleMove}
                        onMoveFolder={handleMoveFolder}
                        onRenameFolder={handleRenameFolder}
                        onDeleteFolder={handleDeleteFolder}
                    />

                    {/* Right Content */}
                    <div className="flex-1 flex flex-col min-w-0">
                        {/* Breadcrumb & View Toggle Header */}
                        <div className="flex items-center justify-between pb-4 shrink-0">
                             <div className="flex items-center gap-1 text-sm text-muted-foreground">
                                <span 
                                    className={cn("cursor-pointer hover:text-foreground transition-colors", activeFolderId === "all" && "font-semibold text-foreground")}
                                    onClick={() => setActiveFolderId("all")}
                                >
                                    Media Library
                                </span>
                                {activeFolderId !== "all" && activeFolderId !== "google-albums" && (
                                    <>
                                        <ChevronRight className="h-4 w-4" />
                                        <span className="font-semibold text-foreground">
                                            {folders.find(f => f.id === activeFolderId)?.name || activeFolderId}
                                        </span>
                                    </>
                                )}
                                {activeFolderId === "google-albums" && (
                                    <>
                                        <ChevronRight className="h-4 w-4" />
                                        <span className="font-semibold text-foreground">Google Albums</span>
                                    </>
                                )}
                             </div>

                             {/* View Toggle */}
                             {activeFolderId !== 'google-albums' && (
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
                             )}
                        </div>

                        {/* View Content */}
                        <div className="flex-1 overflow-y-auto">
                            {activeFolderId === 'google-albums' ? (
                                <GoogleAlbumsTable 
                                    albums={folders.filter(f => f.type === 'google')}
                                    onDelete={handleDeleteFolder}
                                    onViewDetails={setViewingAlbum}
                                    onRenameFolder={handleRenameFolder}
                                />
                            ) : viewMode === 'grid' ? (
                                <PhotoGrid 
                                    photos={filteredMedia as any}
                                    folders={folders}
                                    displayFolders={foldersToDisplay}
                                    selectedIds={selectedIds}
                                    onSelect={handleSelect}
                                    onDelete={handleDelete}
                                    onMove={(id, folderId) => {
                                        // Direct drag and drop still works, but context menu calls onMoveRequest
                                        handleMove(id, folderId)
                                    }}
                                    onMoveRequest={(id) => handleMoveRequest([id])}
                                    onRename={(id, newName) => handleRename(id, newName)}
                                    onPreview={(item) => setPreviewMediaId(item.id)}
                                    onFolderClick={setActiveFolderId}
                                />
                            ) : (
                                <PhotoList 
                                    photos={filteredMedia as any}
                                    folders={folders}
                                    displayFolders={foldersToDisplay}
                                    selectedIds={selectedIds}
                                    onSelect={handleSelect}
                                    onDelete={handleDelete}
                                    onMove={(id, folderId) => handleMove(id, folderId)}
                                    onMoveRequest={(id) => handleMoveRequest([id])}
                                    onRename={handleRename}
                                    onPreview={(item) => setPreviewMediaId(item.id)}
                                    onFolderClick={setActiveFolderId}
                                />
                            )}
                        </div>
                    </div>
                </div>

                {/* Move Media Dialog */}
                <CommandDialog open={isMoveDialogOpen} onOpenChange={setIsMoveDialogOpen}>
                    <DialogTitle className="sr-only">Move Media</DialogTitle>
                    <CommandInput placeholder="Search folders..." />
                    <CommandList>
                        <CommandEmpty>No folder found.</CommandEmpty>
                        <CommandGroup heading="Folders">
                            {folders
                                .filter(f => f.id !== "all")
                                .sort((a, b) => {
                                    const dateA = new Date(a.lastModified || 0).getTime();
                                    const dateB = new Date(b.lastModified || 0).getTime();
                                    return dateB - dateA;
                                })
                                .map(folder => (
                                    <CommandItem
                                        key={folder.id}
                                        value={folder.name}
                                        onSelect={() => handleMoveConfirm(folder.id)}
                                    >
                                        <FolderInput className="mr-2 h-4 w-4 text-muted-foreground" />
                                        {folder.name}
                                    </CommandItem>
                                ))
                            }
                        </CommandGroup>
                    </CommandList>
                </CommandDialog>

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
                                        if (e.key === 'Enter') handleCreateFolder()
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

                {/* Add Video Dialog */}
                <Dialog open={isAddVideoOpen} onOpenChange={setIsAddVideoOpen}>
                    <DialogContent className="sm:max-w-[425px]">
                        <DialogHeader>
                            <DialogTitle>Add Video</DialogTitle>
                            <DialogDescription>
                                Paste a YouTube or Vimeo link.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                            <div className="grid gap-2">
                                <Label htmlFor="link">Video Link</Label>
                                <div className="relative">
                                    <LinkIcon className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        id="link"
                                        value={videoLink}
                                        onChange={(e) => setVideoLink(e.target.value)}
                                        placeholder="https://youtube.com/..."
                                        className="pl-8"
                                    />
                                </div>
                            </div>
                        </div>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setIsAddVideoOpen(false)}>Cancel</Button>
                            <Button onClick={handleAddVideo} disabled={!videoLink}>Add Video</Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>

                 {/* Connect Google Album Dialog */}
                 <Dialog open={isGoogleConnectOpen} onOpenChange={setIsGoogleConnectOpen}>
                    <DialogContent className="sm:max-w-[425px]">
                        <DialogHeader>
                            <DialogTitle>Connect Google Album</DialogTitle>
                            <DialogDescription>
                                Paste a Google Photos album shared link.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                            <div className="grid gap-2">
                                <Label htmlFor="google-link">Album Link</Label>
                                <div className="relative">
                                    <Cloud className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        id="google-link"
                                        value={googleAlbumLink}
                                        onChange={(e) => setGoogleAlbumLink(e.target.value)}
                                        placeholder="https://photos.app.goo.gl/..."
                                        className="pl-8"
                                    />
                                </div>
                            </div>
                        </div>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setIsGoogleConnectOpen(false)}>Cancel</Button>
                            <Button 
                                onClick={handleConnectGoogleAlbum} 
                                disabled={!googleAlbumLink || isConnectingGoogle}
                            >
                                {isConnectingGoogle && <RefreshCw className="mr-2 h-4 w-4 animate-spin" />}
                                Connect Album
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>

                {/* Lightbox */}
                <PhotoLightbox 
                    isOpen={!!previewMediaId}
                    onClose={() => setPreviewMediaId(null)}
                    photo={previewItem}
                    folders={folders}
                    onNext={handleNextPreview}
                    onPrev={handlePrevPreview}
                    hasNext={previewIndex < filteredMedia.length - 1}
                    hasPrev={previewIndex > 0}
                    onDelete={handleDelete}
                    onRename={(id, newName) => handleRename(id, newName)}
                    onMove={handleMove}
                    onEdit={openEditDialog}
                />

                {/* Edit Media Dialog (Legacy, removed content but keeping component to avoid breaking if referenced incorrectly) */}
                <Dialog open={!!editingMedia} onOpenChange={(open) => !open && setEditingMedia(null)}>
                     <DialogContent className="sm:max-w-[500px]">
                        <DialogHeader>
                            <DialogTitle>Edit Media</DialogTitle>
                            <DialogDescription>
                                Edit media details
                            </DialogDescription>
                        </DialogHeader>
                        <div className="py-4 text-center text-muted-foreground">
                             Use the preview window to edit details.
                        </div>
                        <DialogFooter>
                            <Button onClick={() => setEditingMedia(null)}>Close</Button>
                        </DialogFooter>
                     </DialogContent>
                </Dialog>

                {/* Google Album Details */}
                <GoogleAlbumDetails 
                    album={viewingAlbum}
                    isOpen={!!viewingAlbum}
                    onClose={() => setViewingAlbum(null)}
                />

            </PageContainer>
        </DndProvider>
    )
}
