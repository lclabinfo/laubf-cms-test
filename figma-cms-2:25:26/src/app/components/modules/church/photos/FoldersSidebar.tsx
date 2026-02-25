"use client";

import { useRef, useState } from "react"
import { cn } from "@/app/components/ui/utils"
import { Button } from "@/app/components/ui/button"
import { Progress } from "@/app/components/ui/progress"
import { Folder, FolderPlus, Grid, HardDrive, MoreVertical, Pencil, Trash2, Image as ImageIcon, Video, Cloud } from "lucide-react"
import { type MediaFolder } from "./data"
import { useDrag, useDrop } from 'react-dnd'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/app/components/ui/dropdown-menu"

interface FoldersSidebarProps {
    folders: MediaFolder[]
    activeFolderId: string
    mediaCounts: {
        all: number
        photos: number
        videos: number
    }
    onSelectFolder: (id: string) => void
    onCreateFolder: () => void
    onDropPhoto: (photoId: string, folderId: string) => void
    onMoveFolder?: (dragIndex: number, hoverIndex: number) => void
    onRenameFolder: (id: string) => void
    onDeleteFolder: (id: string) => void
}

function FolderItem({ 
    folder, 
    index,
    isActive, 
    onClick,
    onDropPhoto,
    onMoveFolder,
    onRename,
    onDelete
}: { 
    folder: MediaFolder, 
    index: number,
    isActive: boolean, 
    onClick: () => void,
    onDropPhoto: (photoId: string, folderId: string) => void
    onMoveFolder?: (dragIndex: number, hoverIndex: number) => void
    onRename: (id: string) => void
    onDelete: (id: string) => void
}) {
    const ref = useRef<HTMLDivElement>(null)
    const [isMenuOpen, setIsMenuOpen] = useState(false)

    // Drop target for Photos (to move photo to folder)
    const [{ isOverPhoto }, dropPhoto] = useDrop(() => ({
        accept: 'PHOTO',
        drop: (item: { id: string }) => onDropPhoto(item.id, folder.id),
        collect: (monitor) => ({
            isOverPhoto: !!monitor.isOver(),
        }),
    }), [onDropPhoto, folder.id])

    // Drag source for Folder (to reorder)
    const [{ isDragging }, drag] = useDrag(() => ({
        type: 'FOLDER',
        item: { id: folder.id, index },
        collect: (monitor) => ({
            isDragging: monitor.isDragging(),
        }),
        canDrag: !!onMoveFolder
    }), [folder.id, index, onMoveFolder])

    // Drop target for Folder (to reorder)
    const [{ handlerId }, dropFolder] = useDrop(() => ({
        accept: 'FOLDER',
        collect(monitor) {
            return {
                handlerId: monitor.getHandlerId(),
            }
        },
        hover(item: { id: string, index: number }, monitor) {
            if (!ref.current || !onMoveFolder) {
                return
            }
            const dragIndex = item.index
            const hoverIndex = index

            // Don't replace items with themselves
            if (dragIndex === hoverIndex) {
                return
            }

            // Determine rectangle on screen
            const hoverBoundingRect = ref.current?.getBoundingClientRect()

            // Get vertical middle
            const hoverMiddleY =
                (hoverBoundingRect.bottom - hoverBoundingRect.top) / 2

            // Determine mouse position
            const clientOffset = monitor.getClientOffset()

            // Get pixels to the top
            const hoverClientY = (clientOffset as any).y - hoverBoundingRect.top

            // Only perform the move when the mouse has crossed half of the items height
            // When dragging downwards, only move when the cursor is below 50%
            // When dragging upwards, only move when the cursor is above 50%

            // Dragging downwards
            if (dragIndex < hoverIndex && hoverClientY < hoverMiddleY) {
                return
            }

            // Dragging upwards
            if (dragIndex > hoverIndex && hoverClientY > hoverMiddleY) {
                return
            }

            // Time to actually perform the action
            onMoveFolder(dragIndex, hoverIndex)

            // Note: we're mutating the monitor item here!
            // Generally it's better to avoid mutations, but
            // for performance reasons it's often done in React DnD examples
            item.index = hoverIndex
        },
    }), [index, onMoveFolder])

    // Connect drag/drop to ref
    // We can chain them. react-dnd handles refs correctly.
    if (onMoveFolder) {
        drag(dropFolder(dropPhoto(ref)))
    } else {
        dropPhoto(ref)
    }

    const opacity = isDragging ? 0 : 1

    return (
        <div 
            ref={ref} 
            style={{ opacity }} 
            data-handler-id={handlerId} 
            className={cn(
                "w-full flex items-center h-9 px-4 py-2 text-sm font-medium transition-colors rounded-md cursor-pointer group relative",
                isActive ? "bg-secondary text-secondary-foreground" : "hover:bg-muted/50 text-muted-foreground hover:text-foreground",
                isOverPhoto && "ring-2 ring-primary bg-primary/10",
                isDragging && "opacity-50"
            )}
            onClick={onClick}
        >
            {folder.type === 'google' ? (
                <Cloud className={cn(
                    "h-4 w-4 shrink-0 mr-2", 
                    isActive ? "fill-current" : "fill-none"
                )} />
            ) : (
                <Folder className={cn(
                    "h-4 w-4 shrink-0 mr-2", 
                    isActive ? "fill-current" : "fill-none"
                )} />
            )}
            <span className="truncate flex-1 text-left select-none">{folder.name}</span>
            
            {/* Count (visible by default, hidden when menu is open or on hover) */}
            <span className={cn(
                "text-xs text-muted-foreground select-none transition-opacity",
                isMenuOpen ? "opacity-0" : "opacity-100 group-hover:opacity-0"
            )}>
                {folder.count}
            </span>

            {/* Menu (hidden by default, visible on hover or when open) */}
            <div 
                className={cn(
                    "absolute right-2 top-1/2 -translate-y-1/2",
                    isMenuOpen ? "opacity-100" : "opacity-0 group-hover:opacity-100"
                )} 
                onClick={(e) => e.stopPropagation()}
            >
                <DropdownMenu modal={false} open={isMenuOpen} onOpenChange={setIsMenuOpen}>
                    <DropdownMenuTrigger asChild>
                        <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-6 w-6 text-muted-foreground hover:text-foreground"
                        >
                            <MoreVertical className="h-3 w-3" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-40" onCloseAutoFocus={(e) => e.preventDefault()}>
                        <DropdownMenuItem onClick={() => {
                            setIsMenuOpen(false)
                            onRename(folder.id)
                        }}>
                            <Pencil className="mr-2 h-4 w-4" />
                            Rename
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                            className="text-destructive focus:text-destructive"
                            onClick={() => {
                                setIsMenuOpen(false)
                                onDelete(folder.id)
                            }}
                        >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
        </div>
    )
}

export function FoldersSidebar({ 
    folders, 
    activeFolderId, 
    mediaCounts = { all: 0, photos: 0, videos: 0 },
    onSelectFolder, 
    onCreateFolder, 
    onDropPhoto, 
    onMoveFolder,
    onRenameFolder,
    onDeleteFolder
}: FoldersSidebarProps) {
    const otherFolders = folders.filter(f => f.id !== "all" && f.type !== 'google')

    return (
        <div className="w-64 shrink-0 flex flex-col h-full overflow-hidden border rounded-xl bg-card shadow-sm">
            <div className="flex-1 flex flex-col gap-6 overflow-y-auto p-4 custom-scrollbar">
                <div className="space-y-1">
                    <Button 
                        variant={activeFolderId === "all" ? "secondary" : "ghost"} 
                        className="w-full justify-start gap-2"
                        onClick={() => onSelectFolder("all")}
                    >
                        <Grid className="h-4 w-4" />
                        All Media
                        <span className="ml-auto text-xs text-muted-foreground">
                            {mediaCounts.all}
                        </span>
                    </Button>
                    <Button 
                        variant={activeFolderId === "photos" ? "secondary" : "ghost"} 
                        className="w-full justify-start gap-2"
                        onClick={() => onSelectFolder("photos")}
                    >
                        <ImageIcon className="h-4 w-4" />
                        Photos
                        <span className="ml-auto text-xs text-muted-foreground">
                            {mediaCounts.photos}
                        </span>
                    </Button>
                    <Button 
                        variant={activeFolderId === "videos" ? "secondary" : "ghost"} 
                        className="w-full justify-start gap-2"
                        onClick={() => onSelectFolder("videos")}
                    >
                        <Video className="h-4 w-4" />
                        Videos
                        <span className="ml-auto text-xs text-muted-foreground">
                            {mediaCounts.videos}
                        </span>
                    </Button>
                    <Button 
                        variant={activeFolderId === "google-albums" ? "secondary" : "ghost"} 
                        className="w-full justify-start gap-2"
                        onClick={() => onSelectFolder("google-albums")}
                    >
                        <Cloud className="h-4 w-4" />
                        Google Albums
                    </Button>
                </div>

                <div className="space-y-2">
                    <div className="flex items-center justify-between px-2">
                        <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                            Folders
                        </h3>
                        <Button variant="ghost" size="icon" className="h-4 w-4" onClick={onCreateFolder}>
                            <FolderPlus className="h-3 w-3" />
                        </Button>
                    </div>
                    <div className="space-y-1">
                        {otherFolders.map((folder, index) => (
                            <FolderItem 
                                key={folder.id}
                                index={index}
                                folder={folder}
                                isActive={activeFolderId === folder.id}
                                onClick={() => onSelectFolder(folder.id)}
                                onDropPhoto={onDropPhoto}
                                onMoveFolder={onMoveFolder}
                                onRename={onRenameFolder}
                                onDelete={onDeleteFolder}
                            />
                        ))}
                    </div>
                </div>
            </div>

            {/* Storage Meter */}
            <div className="p-4 border-t bg-background/50 mt-auto shrink-0">
                <div className="flex items-center gap-2 mb-2 text-sm font-medium">
                    <HardDrive className="h-4 w-4 text-muted-foreground" />
                    Storage
                </div>
                <Progress value={42} className="h-2 mb-2" />
                <div className="flex justify-between text-xs text-muted-foreground">
                    <span>4.2 GB used</span>
                    <span>10 GB total</span>
                </div>
            </div>
        </div>
    )
}
