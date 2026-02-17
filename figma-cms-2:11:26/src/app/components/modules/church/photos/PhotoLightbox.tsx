"use client";

import * as React from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { format } from "date-fns";
import { 
    X, 
    ChevronLeft, 
    ChevronRight, 
    Download, 
    Info, 
    Trash2,
    Pencil,
    RotateCcw
} from "lucide-react";
import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import { Label } from "@/app/components/ui/label";
import { Separator } from "@/app/components/ui/separator";
import { type MediaItem, type MediaFolder } from "./data";
import { toast } from "sonner";
import { FolderSelector } from "./FolderSelector";

interface PhotoLightboxProps {
    photo: MediaItem | null;
    folders: MediaFolder[];
    isOpen: boolean;
    onClose: () => void;
    onNext: () => void;
    onPrev: () => void;
    hasNext: boolean;
    hasPrev: boolean;
    onDelete: (id: string) => void;
    onRename: (id: string, newName: string) => void;
    onMove: (id: string, folderId: string) => void;
    onEdit: (item: MediaItem) => void;
}

export function PhotoLightbox({ 
    photo, 
    folders,
    isOpen, 
    onClose, 
    onNext, 
    onPrev, 
    hasNext, 
    hasPrev,
    onDelete,
    onRename,
    onMove,
    onEdit
}: PhotoLightboxProps) {
    const [name, setName] = React.useState("");
    const [altText, setAltText] = React.useState("");
    const [thumbnailUrl, setThumbnailUrl] = React.useState("");
    const fileInputRef = React.useRef<HTMLInputElement>(null);
    
    React.useEffect(() => {
        if (photo) {
            setName(photo.name);
            setAltText(photo.tags?.join(", ") || ""); // Using tags as mock alt text/description for now
            setThumbnailUrl(photo.url);
        }
    }, [photo]);

    const isVideo = photo?.type === "YOUTUBE" || photo?.type === "VIMEO";

    const getEmbedUrl = (url: string | undefined, type: string) => {
        if (!url) return "";
        if (type === "YOUTUBE") {
            let videoId = "";
            if (url.includes("v=")) {
                videoId = url.split("v=")[1].split("&")[0];
            } else if (url.includes("youtu.be/")) {
                videoId = url.split("youtu.be/")[1].split("?")[0];
            }
            return `https://www.youtube.com/embed/${videoId}?autoplay=1`;
        } else if (type === "VIMEO") {
            const videoId = url.split("/").pop();
            return `https://player.vimeo.com/video/${videoId}?autoplay=1`;
        }
        return "";
    };

    const handleSave = () => {
        if (photo && name !== photo.name) {
            onRename(photo.id, name);
        }
        toast.success("Changes saved");
    };

    const handleThumbnailUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
             const newUrl = URL.createObjectURL(file);
             setThumbnailUrl(newUrl);
             toast.success("Thumbnail updated");
        }
    };

    const handleResetThumbnail = () => {
        if (!photo?.videoUrl) return;
        
        let defaultThumb = "";
        if (photo.type === "VIMEO") {
             defaultThumb = "https://images.unsplash.com/photo-1611162618071-b39a2ec055fb?w=500&h=500&fit=crop"; 
        } else {
             try {
                 let videoId = "";
                 if (photo.videoUrl.includes("v=")) {
                     videoId = photo.videoUrl.split("v=")[1].split("&")[0];
                 } else if (photo.videoUrl.includes("youtu.be/")) {
                     videoId = photo.videoUrl.split("youtu.be/")[1].split("?")[0];
                 }
                 if (videoId) {
                     defaultThumb = `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`;
                 }
             } catch (e) {
                 defaultThumb = "https://images.unsplash.com/photo-1611162617474-5b21e879e113?w=500&h=500&fit=crop";
             }
        }
        
        if (defaultThumb) {
            setThumbnailUrl(defaultThumb);
            toast.success("Thumbnail reset to default");
        }
    };

    return (
        <DialogPrimitive.Root open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogPrimitive.Portal>
                <DialogPrimitive.Overlay 
                    className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 pointer-events-auto" 
                />
                
                <DialogPrimitive.Content 
                    className="fixed inset-0 z-[101] flex items-center justify-center p-4 md:p-8 pointer-events-none"
                >
                    {photo && (
                        <>
                            <DialogPrimitive.Title className="sr-only">
                                {photo.name}
                            </DialogPrimitive.Title>
                            <DialogPrimitive.Description className="sr-only">
                                Media preview and details
                            </DialogPrimitive.Description>
                            <div 
                                className="bg-background w-full max-w-7xl h-[85vh] rounded-xl shadow-2xl flex overflow-hidden pointer-events-auto data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 duration-200 outline-none"
                            >
                                {/* Left Column: Media Preview */}
                                <div className="flex-1 bg-black/95 relative flex items-center justify-center min-w-0">
                                    {/* Toolbar */}
                                    <div className="absolute top-4 left-4 z-10">
                                        <Button 
                                            variant="ghost" 
                                            size="icon" 
                                            className="text-white/70 hover:text-white hover:bg-white/10 rounded-full"
                                            onClick={onClose}
                                        >
                                            <X className="h-5 w-5" />
                                        </Button>
                                    </div>

                                    <div className="absolute top-4 right-4 z-10 flex gap-2">
                                        {!isVideo && (
                                            <Button 
                                                variant="ghost" 
                                                size="icon"
                                                className="text-white/70 hover:text-white hover:bg-white/10 rounded-full"
                                                onClick={() => window.open(photo.url, '_blank')}
                                                title="Download"
                                            >
                                                <Download className="h-5 w-5" />
                                            </Button>
                                        )}
                                    </div>

                                    {/* Content */}
                                    <div className="w-full h-full p-4 md:p-8 flex items-center justify-center">
                                        {isVideo ? (
                                             <div className="w-full max-w-4xl aspect-video bg-black shadow-lg rounded-lg overflow-hidden border border-white/10">
                                                <iframe 
                                                    src={getEmbedUrl(photo.videoUrl, photo.type)} 
                                                    className="w-full h-full"
                                                    title={photo.name}
                                                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                                                    allowFullScreen
                                                />
                                             </div>
                                        ) : (
                                            <img 
                                                src={photo.url} 
                                                alt={photo.name}
                                                className="max-w-full max-h-full object-contain"
                                            />
                                        )}
                                    </div>

                                    {/* Navigation */}
                                    {hasPrev && (
                                        <button 
                                            className="absolute left-4 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/50 text-white/70 hover:bg-white/10 hover:text-white transition-all"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                onPrev();
                                            }}
                                        >
                                            <ChevronLeft className="h-8 w-8" />
                                        </button>
                                    )}
                                    {hasNext && (
                                        <button 
                                            className="absolute right-4 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/50 text-white/70 hover:bg-white/10 hover:text-white transition-all"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                onNext();
                                            }}
                                        >
                                            <ChevronRight className="h-8 w-8" />
                                        </button>
                                    )}
                                </div>

                                {/* Right Column: Details Sidebar */}
                                <div className="w-[350px] shrink-0 border-l bg-card flex flex-col h-full overflow-hidden">
                                    <div className="p-4 border-b flex items-center justify-between shrink-0 bg-muted/10">
                                        <div className="flex items-center gap-2 text-sm font-semibold">
                                            <Info className="h-4 w-4" />
                                            Information
                                        </div>
                                        <div className="flex gap-2">
                                             <Button size="sm" variant="ghost" onClick={onClose}>Cancel</Button>
                                             <Button size="sm" onClick={handleSave}>Save</Button>
                                        </div>
                                    </div>
                                    
                                    <div className="flex-1 overflow-y-auto p-4 space-y-6">
                                        {/* Name */}
                                        <div className="space-y-2">
                                            <Label htmlFor="name" className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Name</Label>
                                            <Input 
                                                id="name" 
                                                value={name} 
                                                onChange={(e) => setName(e.target.value)}
                                                className="font-medium"
                                            />
                                        </div>

                                        {/* Alt Text */}
                                        <div className="space-y-2">
                                            <Label htmlFor="alt" className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Alt text</Label>
                                            <Input 
                                                id="alt" 
                                                value={altText} 
                                                onChange={(e) => setAltText(e.target.value)}
                                                placeholder="Describe this image for screen readers"
                                            />
                                        </div>

                                        {/* Details Group */}
                                        <div className="space-y-4 pt-2">
                                            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Details</h4>
                                            
                                            <div className="grid gap-4 text-sm">
                                                 {/* Folder Selector */}
                                                <div className="flex flex-col gap-1">
                                                    <span className="text-muted-foreground">Folder</span>
                                                    <FolderSelector 
                                                        folders={folders}
                                                        selectedFolderId={photo.folderId}
                                                        onSelect={(folderId) => onMove(photo.id, folderId)}
                                                    />
                                                </div>

                                                {/* Date Added */}
                                                <div className="flex flex-col gap-1">
                                                    <span className="text-muted-foreground">Added</span>
                                                    <span className="font-medium">{format(new Date(photo.date), "MMM d, yyyy")}</span>
                                                </div>

                                                {/* Thumbnail (Video Only) */}
                                                {isVideo && (
                                                    <div className="flex flex-col gap-2">
                                                         <span className="text-muted-foreground">Thumbnail</span>
                                                         <div className="flex items-center gap-3 p-2 rounded-md border bg-muted/20">
                                                             <div className="h-10 w-16 rounded overflow-hidden bg-muted relative shrink-0">
                                                                 <img src={thumbnailUrl} alt="" className="h-full w-full object-cover" />
                                                             </div>
                                                             <span className="text-sm font-medium truncate flex-1">
                                                                 Cover image
                                                             </span>
                                                             <div className="flex gap-1">
                                                                 <input 
                                                                     type="file" 
                                                                     ref={fileInputRef} 
                                                                     className="hidden" 
                                                                     accept="image/*"
                                                                     onChange={handleThumbnailUpload}
                                                                 />
                                                                 <Button 
                                                                    variant="ghost" 
                                                                    size="icon" 
                                                                    className="h-8 w-8 shrink-0"
                                                                    onClick={() => fileInputRef.current?.click()}
                                                                    title="Replace thumbnail"
                                                                 >
                                                                     <Pencil className="h-3 w-3" />
                                                                 </Button>
                                                                 <Button 
                                                                    variant="ghost" 
                                                                    size="icon" 
                                                                    className="h-8 w-8 shrink-0 text-destructive hover:text-destructive"
                                                                    onClick={handleResetThumbnail}
                                                                    title="Reset to default"
                                                                 >
                                                                     <RotateCcw className="h-3 w-3" />
                                                                 </Button>
                                                             </div>
                                                         </div>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                        
                                        <Separator />

                                        {/* Used In */}
                                        <div className="space-y-2">
                                            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Used in</h4>
                                            <div className="text-sm text-muted-foreground italic bg-muted/20 p-3 rounded-md border border-dashed">
                                                Not referenced in your store
                                            </div>
                                        </div>

                                        <Separator />

                                        {/* Metadata */}
                                        <div className="space-y-2">
                                             <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Metadata</h4>
                                             <div className="grid grid-cols-2 gap-4 text-xs">
                                                 <div>
                                                     <div className="text-muted-foreground">Size</div>
                                                     <div className="font-medium mt-0.5">{photo.size || "Unknown"}</div>
                                                 </div>
                                                  <div>
                                                     <div className="text-muted-foreground">Type</div>
                                                     <div className="font-medium mt-0.5">{photo.type}</div>
                                                 </div>
                                                 <div>
                                                     <div className="text-muted-foreground">Dimensions</div>
                                                     <div className="font-medium mt-0.5">1920 x 1080</div>
                                                 </div>
                                                 {photo.videoUrl && (
                                                      <div className="col-span-2">
                                                         <div className="text-muted-foreground">Source URL</div>
                                                         <a href={photo.videoUrl} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline mt-0.5 block truncate">
                                                             {photo.videoUrl}
                                                         </a>
                                                     </div>
                                                 )}
                                             </div>
                                        </div>

                                        <div className="pt-4 mt-auto">
                                            <Button 
                                                variant="destructive" 
                                                className="w-full gap-2" 
                                                onClick={() => {
                                                    if(confirm("Delete this item?")) {
                                                        onDelete(photo.id);
                                                        onClose();
                                                    }
                                                }}
                                            >
                                                <Trash2 className="h-4 w-4" />
                                                Delete Item
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </>
                    )}
                </DialogPrimitive.Content>
            </DialogPrimitive.Portal>
        </DialogPrimitive.Root>
    )
}
