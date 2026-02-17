"use client";

import * as React from "react";
import { Check, ChevronsUpDown, Folder, FolderInput } from "lucide-react";

import { cn } from "@/app/components/ui/utils";
import { Button } from "@/app/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/app/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/app/components/ui/popover";
import { type MediaFolder } from "./data";

interface FolderSelectorProps {
  folders: MediaFolder[];
  selectedFolderId: string;
  onSelect: (folderId: string) => void;
}

export function FolderSelector({ folders, selectedFolderId, onSelect }: FolderSelectorProps) {
  const [open, setOpen] = React.useState(false);
  
  const selectedFolder = folders.find((f) => f.id === selectedFolderId);

  // Filter out "all" and ensure we have a valid list
  // Sort by lastModified descending (most recent first)
  const displayFolders = React.useMemo(() => {
    return folders
        .filter(f => f.id !== "all")
        .sort((a, b) => {
            const dateA = new Date(a.lastModified || 0).getTime();
            const dateB = new Date(b.lastModified || 0).getTime();
            return dateB - dateA;
        });
  }, [folders]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between font-normal bg-card hover:bg-accent/50"
        >
          <div className="flex items-center gap-2 truncate">
             <FolderInput className="h-4 w-4 shrink-0 text-muted-foreground" />
             <span className="truncate">
                {selectedFolder ? selectedFolder.name : "Select folder..."}
             </span>
          </div>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[300px] p-0 z-[200]" align="start">
        <Command>
          <CommandInput placeholder="Search folders..." />
          <CommandList>
            <CommandEmpty>No folder found.</CommandEmpty>
            <CommandGroup heading="Recent Folders">
              {displayFolders.map((folder) => (
                <CommandItem
                  key={folder.id}
                  value={folder.name}
                  onSelect={() => {
                    onSelect(folder.id);
                    setOpen(false);
                  }}
                >
                  <Folder className={cn(
                      "mr-2 h-4 w-4",
                      folder.id === selectedFolderId ? "text-primary fill-primary/20" : "text-muted-foreground"
                  )} />
                  {folder.name}
                  <Check
                    className={cn(
                      "ml-auto h-4 w-4",
                      selectedFolderId === folder.id ? "opacity-100" : "opacity-0"
                    )}
                  />
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
