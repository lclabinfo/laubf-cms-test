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
    FileIcon,
    Play,
    Edit,
    Folder
} from "lucide-react"
import { format } from "date-fns"
import { type MediaItem, type MediaFolder } from "./data"
import { cn } from "@/app/components/ui/utils"
import { useDrag, useDrop } from 'react-dnd'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/app/components/ui/table"

interface PhotoListProps {
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

function FolderRowContent({ folder }: { folder: MediaFolder }) {
    return (
        <>
             <TableCell className="w-[40px] px-4"></TableCell>
             <TableCell className="font-medium">
                <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded flex items-center justify-center bg-blue-50 text-blue-500">
                        <Folder className="h-5 w-5 fill-current" />
                    </div>
                    <span>{folder.name}</span>
                </div>
            </TableCell>
            <TableCell>-</TableCell>
            <TableCell>{folder.count} items</TableCell>
            <TableCell></TableCell>
        </>
    )
}

function DraggableFolderRow({
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
        <TableRow 
            ref={drop as any}
            className={cn(
                "cursor-pointer hover:bg-muted/50",
                isOver && "bg-primary/10"
            )}
            onClick={onClick}
        >
            <FolderRowContent folder={folder} />
        </TableRow>
    )
}

function StaticFolderRow({
    folder,
    onClick
}: {
    folder: MediaFolder,
    onClick: () => void
}) {
    return (
        <TableRow 
            className="cursor-pointer hover:bg-muted/50"
            onClick={onClick}
        >
            <FolderRowContent folder={folder} />
        </TableRow>
    )
}

// --- Photo Components ---

function PhotoListItemContent({ 
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
            <TableCell className="w-[40px] px-4" onClick={(e) => e.stopPropagation()}>
                <Checkbox 
                    checked={isSelected}
                    onCheckedChange={(checked) => onSelect(photo.id, !!checked)}
                />
            </TableCell>
            <TableCell className="font-medium">
                <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded overflow-hidden bg-muted flex-shrink-0 relative group/thumb">
                        <img src={photo.url} alt="" className="h-full w-full object-cover" />
                        {isVideo && (
                             <div className="absolute inset-0 flex items-center justify-center bg-black/30 backdrop-blur-[1px]">
                                <div className="bg-white/30 rounded-full p-1 border border-white/20">
                                     <Play className="h-3 w-3 text-white fill-white ml-0.5" />
                                </div>
                            </div>
                        )}
                    </div>
                    <span>{photo.name}</span>
                </div>
            </TableCell>
            <TableCell>{format(new Date(photo.date), "MMM d, yyyy")}</TableCell>
            <TableCell>{photo.size || "-"}</TableCell>
            <TableCell onClick={(e) => e.stopPropagation()}>
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button size="icon" variant="ghost" className="h-8 w-8">
                            <MoreHorizontal className="h-4 w-4" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
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
            </TableCell>
        </>
    )
}

function DraggablePhotoListItem({ 
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
        <TableRow 
            ref={drag as any}
            className={cn(
                "group cursor-pointer hover:bg-muted/50",
                isSelected && "bg-muted",
                isDragging && "opacity-50"
            )}
            onClick={() => onPreview(photo)}
        >
             <PhotoListItemContent 
                photo={photo}
                isSelected={isSelected}
                isVideo={isVideo}
                onSelect={onSelect}
                onEdit={onEdit}
                onRename={onRename}
                onMoveRequest={onMoveRequest}
                onDelete={onDelete}
            />
        </TableRow>
    )
}

function StaticPhotoListItem({ 
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
        <TableRow 
            className={cn(
                "group cursor-pointer hover:bg-muted/50",
                isSelected && "bg-muted"
            )}
            onClick={() => onPreview(photo)}
        >
             <PhotoListItemContent 
                photo={photo}
                isSelected={isSelected}
                isVideo={isVideo}
                onSelect={onSelect}
                onEdit={onEdit}
                onRename={onRename}
                onMoveRequest={onMoveRequest}
                onDelete={onDelete}
            />
        </TableRow>
    )
}

export function PhotoList({ 
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
}: PhotoListProps) {
  
  const isEmpty = photos.length === 0 && (!displayFolders || displayFolders.length === 0);

  if (isEmpty) {
      return (
          <div className="flex flex-col items-center justify-center py-20 text-center border rounded-lg bg-muted/10 border-dashed">
              <div className="bg-muted p-4 rounded-full mb-4">
                  <FileIcon className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-medium">No media found</h3>
              <p className="text-sm text-muted-foreground max-w-sm mt-1">
                  Upload photos or add videos to start building your library.
              </p>
          </div>
      )
  }

  return (
    <div className="border rounded-md">
        <Table>
            <TableHeader>
                <TableRow className="hover:bg-transparent">
                    <TableHead className="w-[40px] px-4"></TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Date Added</TableHead>
                    <TableHead>Size</TableHead>
                    <TableHead className="w-[50px]"></TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {displayFolders?.map(folder => (
                    enableDragDrop ? (
                        <DraggableFolderRow
                            key={folder.id}
                            folder={folder}
                            onClick={() => onFolderClick?.(folder.id)}
                            onDropPhoto={onMove}
                        />
                    ) : (
                        <StaticFolderRow
                            key={folder.id}
                            folder={folder}
                            onClick={() => onFolderClick?.(folder.id)}
                        />
                    )
                ))}
                {photos.map((photo) => (
                    enableDragDrop ? (
                        <DraggablePhotoListItem 
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
                        <StaticPhotoListItem 
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
            </TableBody>
        </Table>
    </div>
  )
}
