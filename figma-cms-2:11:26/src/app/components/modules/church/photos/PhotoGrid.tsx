"use client";

import { useState } from "react"
import { Checkbox } from "@/app/components/ui/checkbox"
import { Button } from "@/app/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/app/components/ui/dropdown-menu"
import { 
    MoreHorizontal, 
    Trash2, 
    FolderInput,
    Download,
    Image as ImageIcon,
    Play,
    Edit,
    Folder
} from "lucide-react"
import { format } from "date-fns"
import { type MediaItem, type MediaFolder } from "./data"
import { cn } from "@/app/components/ui/utils"
import { useDrag, useDrop } from 'react-dnd'

interface PhotoGridProps {
  photos: MediaItem[]
  folders: MediaFolder[]
  displayFolders?: MediaFolder[]
  selectedIds: string[]
  onSelect: (id: string, checked: boolean) => void
  onDelete: (id: string) => void
  onMove: (id: string, folderId: string) => void
  onMoveRequest?: (id: string) => void
  onRename: (id: string, newName: string) => void
  onPreview: (photo: MediaItem) => void
  onEdit?: (photo: MediaItem) => void
  onFolderClick?: (folderId: string) => void
  enableDragDrop?: boolean
}

// --- Folder Components ---

function FolderCardContent({ folder, isOver }: { folder: MediaFolder, isOver: boolean }) {
    return (
        <>
            <Folder className={cn("w-12 h-12 text-blue-200 fill-blue-200/20 group-hover:text-blue-300 transition-colors", isOver && "text-blue-500 fill-blue-500/20")} />
            <div className="text-sm font-medium text-foreground px-2 text-center truncate w-full">
                {folder.name}
            </div>
            <div className="text-xs text-muted-foreground">
                {folder.count} items
            </div>
        </>
    )
}

function DraggableFolderCard({
    folder,
    onClick,
    onDropPhoto
}: {
    folder: MediaFolder,
    onClick: () => void,
    onDropPhoto: (photoId: string, folderId: string) => void
}) {
    const [{ isOver }, drop] = useDrop(() => ({
        accept: 'PHOTO',
        drop: (item: { id: string }) => onDropPhoto(item.id, folder.id),
        collect: (monitor) => ({
            isOver: !!monitor.isOver(),
        }),
    }), [folder.id, onDropPhoto])

    return (
        <div 
            ref={drop as any}
            className={cn(
                "group relative aspect-square rounded-lg border bg-muted/10 hover:bg-muted/30 transition-all cursor-pointer flex flex-col items-center justify-center gap-2",
                isOver && "ring-2 ring-primary bg-primary/10"
            )}
            onClick={onClick}
        >
            <FolderCardContent folder={folder} isOver={isOver} />
        </div>
    )
}

function StaticFolderCard({
    folder,
    onClick
}: {
    folder: MediaFolder,
    onClick: () => void
}) {
    return (
        <div 
            className="group relative aspect-square rounded-lg border bg-muted/10 hover:bg-muted/30 transition-all cursor-pointer flex flex-col items-center justify-center gap-2"
            onClick={onClick}
        >
            <FolderCardContent folder={folder} isOver={false} />
        </div>
    )
}

// --- Photo Components ---

function PhotoItemContent({ 
    photo, 
    isSelected, 
    isVideo,
    onSelect,
    onEdit,
    onRename,
    onMoveRequest,
    onDelete
}: { 
    photo: MediaItem, 
    isSelected: boolean,
    isVideo: boolean,
    onSelect: (id: string, checked: boolean) => void,
    onEdit?: (photo: MediaItem) => void,
    onRename: (id: string, newName: string) => void,
    onMoveRequest?: (id: string) => void,
    onDelete: (id: string) => void
}) {
    return (
        <>
            {/* Selection Checkbox */}
            <div className={cn(
                "absolute top-2 left-2 z-20 transition-opacity",
                isSelected ? "opacity-100" : "opacity-0 group-hover:opacity-100"
            )} onClick={(e) => e.stopPropagation()}>
                <Checkbox 
                    checked={isSelected}
                    onCheckedChange={(checked) => onSelect(photo.id, !!checked)}
                    className="bg-white/90 border-gray-400 data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                />
            </div>

            {/* Image/Thumbnail */}
            <div className="w-full h-full relative bg-gray-100">
                <img 
                    src={photo.url} 
                    alt={photo.name}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
                
                {/* Video Indicator */}
                {isVideo && (
                    <div className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none">
                        <div className="bg-white/30 rounded-full p-3 backdrop-blur-md border border-white/20 shadow-lg group-hover:scale-110 transition-transform duration-300">
                            <Play className="h-6 w-6 text-white fill-white ml-1" />
                        </div>
                    </div>
                )}
                
                {/* Overlay Gradient */}
                <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>

            {/* Metadata & Actions */}
            <div className="absolute bottom-0 inset-x-0 p-3 flex items-center justify-between opacity-0 group-hover:opacity-100 transition-opacity z-10" onClick={(e) => e.stopPropagation()}>
                <div className="min-w-0 flex-1 mr-2">
                        <p className="text-xs font-medium text-white truncate" title={photo.name}>
                            {photo.name}
                        </p>
                        <p className="text-[10px] text-white/80 truncate">
                            {format(new Date(photo.date), "MMM d")} • {photo.size || "Video"}
                        </p>
                </div>
                
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button size="icon" variant="ghost" className="h-6 w-6 text-white hover:bg-white/20 rounded-full shrink-0">
                            <MoreHorizontal className="h-4 w-4" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48">
                        {onEdit && (
                            <DropdownMenuItem onClick={() => onEdit(photo)}>
                                <Edit className="mr-2 h-4 w-4" />
                                Edit Details
                            </DropdownMenuItem>
                        )}
                        <DropdownMenuItem onClick={() => {
                            const newName = prompt("Rename media:", photo.name);
                            if (newName) onRename(photo.id, newName);
                        }}>
                            Rename
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => onMoveRequest?.(photo.id)}>
                            <FolderInput className="mr-2 h-4 w-4" />
                            Move to...
                        </DropdownMenuItem>
                        {!isVideo && (
                            <DropdownMenuItem onClick={() => window.open(photo.url, '_blank')}>
                                <Download className="mr-2 h-4 w-4" />
                                Download
                            </DropdownMenuItem>
                        )}
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="text-destructive" onClick={() => onDelete(photo.id)}>
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
        </>
    )
}

function DraggablePhotoItem({ 
    photo, 
    isSelected, 
    onSelect, 
    onDelete, 
    onMoveRequest,
    onRename,
    onPreview,
    onEdit
}: { 
    photo: MediaItem, 
    isSelected: boolean,
    onSelect: (id: string, checked: boolean) => void,
    onDelete: (id: string) => void,
    onMoveRequest?: (id: string) => void,
    onRename: (id: string, newName: string) => void,
    onPreview: (photo: MediaItem) => void,
    onEdit?: (photo: MediaItem) => void
}) {
    const [{ isDragging }, drag] = useDrag(() => ({
        type: 'PHOTO',
        item: { id: photo.id },
        collect: (monitor) => ({
            isDragging: !!monitor.isDragging(),
        }),
    }), [photo.id])

    const isVideo = photo.type === "YOUTUBE" || photo.type === "VIMEO";

    return (
        <div 
            ref={drag as any}
            className={cn(
                "group relative aspect-square rounded-lg border bg-card text-card-foreground shadow-sm overflow-hidden transition-all hover:shadow-md cursor-pointer",
                isSelected && "ring-2 ring-primary border-primary",
                isDragging && "opacity-50"
            )}
            onClick={() => onPreview(photo)}
        >
            <PhotoItemContent 
                photo={photo}
                isSelected={isSelected}
                isVideo={isVideo}
                onSelect={onSelect}
                onEdit={onEdit}
                onRename={onRename}
                onMoveRequest={onMoveRequest}
                onDelete={onDelete}
            />
        </div>
    )
}

function StaticPhotoItem({ 
    photo, 
    isSelected, 
    onSelect, 
    onDelete, 
    onMoveRequest,
    onRename,
    onPreview,
    onEdit
}: { 
    photo: MediaItem, 
    isSelected: boolean,
    onSelect: (id: string, checked: boolean) => void,
    onDelete: (id: string) => void,
    onMoveRequest?: (id: string) => void,
    onRename: (id: string, newName: string) => void,
    onPreview: (photo: MediaItem) => void,
    onEdit?: (photo: MediaItem) => void
}) {
    const isVideo = photo.type === "YOUTUBE" || photo.type === "VIMEO";

    return (
        <div 
            className={cn(
                "group relative aspect-square rounded-lg border bg-card text-card-foreground shadow-sm overflow-hidden transition-all hover:shadow-md cursor-pointer",
                isSelected && "ring-2 ring-primary border-primary"
            )}
            onClick={() => onPreview(photo)}
        >
             <PhotoItemContent 
                photo={photo}
                isSelected={isSelected}
                isVideo={isVideo}
                onSelect={onSelect}
                onEdit={onEdit}
                onRename={onRename}
                onMoveRequest={onMoveRequest}
                onDelete={onDelete}
            />
        </div>
    )
}

export function PhotoGrid({ 
    photos, 
    folders,
    displayFolders,
    selectedIds, 
    onSelect, 
    onDelete, 
    onMove, 
    onMoveRequest,
    onRename,
    onPreview,
    onEdit,
    onFolderClick,
    enableDragDrop = true
}: PhotoGridProps) {
  
  const isEmpty = photos.length === 0 && (!displayFolders || displayFolders.length === 0);

  if (isEmpty) {
      return (
          <div className="flex flex-col items-center justify-center py-20 text-center border rounded-lg bg-muted/10 border-dashed">
              <div className="bg-muted p-4 rounded-full mb-4">
                  <ImageIcon className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-medium">No media found</h3>
              <p className="text-sm text-muted-foreground max-w-sm mt-1">
                  Upload photos or add videos to start building your library.
              </p>
          </div>
      )
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
        {displayFolders?.map(folder => (
            enableDragDrop ? (
                <DraggableFolderCard 
                    key={folder.id}
                    folder={folder}
                    onClick={() => onFolderClick?.(folder.id)}
                    onDropPhoto={onMove}
                />
            ) : (
                <StaticFolderCard 
                    key={folder.id}
                    folder={folder}
                    onClick={() => onFolderClick?.(folder.id)}
                />
            )
        ))}
        {photos.map((photo) => (
            enableDragDrop ? (
                <DraggablePhotoItem 
                    key={photo.id}
                    photo={photo}
                    isSelected={selectedIds.includes(photo.id)}
                    onSelect={onSelect}
                    onDelete={onDelete}
                    onMoveRequest={onMoveRequest}
                    onRename={onRename}
                    onPreview={onPreview}
                    onEdit={onEdit}
                />
            ) : (
                <StaticPhotoItem 
                    key={photo.id}
                    photo={photo}
                    isSelected={selectedIds.includes(photo.id)}
                    onSelect={onSelect}
                    onDelete={onDelete}
                    onMoveRequest={onMoveRequest}
                    onRename={onRename}
                    onPreview={onPreview}
                    onEdit={onEdit}
                />
            )
        ))}
    </div>
  )
}
