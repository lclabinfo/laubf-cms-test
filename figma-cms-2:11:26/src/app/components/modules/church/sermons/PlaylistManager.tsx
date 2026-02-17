"use client";

import { useState } from "react";
import { format } from "date-fns";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/app/components/ui/table";
import { Button } from "@/app/components/ui/button";
import { Badge } from "@/app/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/app/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/app/components/ui/dialog";
import { Input } from "@/app/components/ui/input";
import { Label } from "@/app/components/ui/label";
import {
  MoreHorizontal,
  Youtube,
  RefreshCw,
  Trash2,
  Settings,
  ExternalLink,
  CheckCircle2,
  AlertCircle
} from "lucide-react";
import { Switch } from "@/app/components/ui/switch";
import { Separator } from "@/app/components/ui/separator";

export interface ConnectedPlaylist {
  id: string;
  url: string;
  title: string;
  lastSync: Date;
  status: "active" | "error" | "syncing";
  sermonCount: number;
  autoPublish: boolean;
  defaultSpeaker?: string;
  defaultTags?: string;
}

// Mock data
const mockPlaylists: ConnectedPlaylist[] = [
  {
    id: "pl_1",
    url: "https://youtube.com/playlist?list=PL123...",
    title: "Sunday Services 2024",
    lastSync: new Date(Date.now() - 1000 * 60 * 30), // 30 mins ago
    status: "active",
    sermonCount: 12,
    autoPublish: false,
    defaultSpeaker: "Pastor John Doe",
    defaultTags: "Sunday Service",
  },
  {
    id: "pl_2",
    url: "https://youtube.com/playlist?list=PL456...",
    title: "Youth Ministry",
    lastSync: new Date(Date.now() - 1000 * 60 * 60 * 24), // 1 day ago
    status: "active",
    sermonCount: 5,
    autoPublish: true,
    defaultSpeaker: "Pastor Tim",
    defaultTags: "Youth",
  },
];

interface PlaylistManagerProps {
  onConnect: () => void;
}

export function PlaylistManager({ onConnect }: PlaylistManagerProps) {
  const [playlists, setPlaylists] = useState<ConnectedPlaylist[]>(mockPlaylists);
  const [syncingIds, setSyncingIds] = useState<Set<string>>(new Set());
  
  // Settings Dialog State
  const [editingPlaylist, setEditingPlaylist] = useState<ConnectedPlaylist | null>(null);
  const [editForm, setEditForm] = useState<{ autoPublish: boolean; defaultSpeaker: string; defaultTags: string }>({
      autoPublish: false,
      defaultSpeaker: "",
      defaultTags: ""
  });

  const handleSync = (id: string) => {
    setSyncingIds((prev) => new Set(prev).add(id));
    // Simulate sync
    setTimeout(() => {
      setPlaylists((prev) =>
        prev.map((p) =>
          p.id === id ? { ...p, lastSync: new Date(), status: "active" } : p
        )
      );
      setSyncingIds((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }, 2000);
  };

  const handleDisconnect = (id: string) => {
      if(confirm("Are you sure? This will stop syncing new videos. Existing sermons will remain.")) {
          setPlaylists(prev => prev.filter(p => p.id !== id));
      }
  }

  const toggleAutoPublish = (id: string) => {
      setPlaylists(prev => prev.map(p => p.id === id ? {...p, autoPublish: !p.autoPublish} : p));
  }
  
  const openSettings = (playlist: ConnectedPlaylist) => {
      setEditingPlaylist(playlist);
      setEditForm({
          autoPublish: playlist.autoPublish,
          defaultSpeaker: playlist.defaultSpeaker || "",
          defaultTags: playlist.defaultTags || ""
      });
  }

  const saveSettings = () => {
      if (!editingPlaylist) return;
      
      setPlaylists(prev => prev.map(p => 
          p.id === editingPlaylist.id 
              ? { 
                  ...p, 
                  autoPublish: editForm.autoPublish,
                  defaultSpeaker: editForm.defaultSpeaker,
                  defaultTags: editForm.defaultTags
                }
              : p
      ));
      setEditingPlaylist(null);
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
           {/* Header is handled in parent, but we can add sub-header or filter if needed */}
        </div>
        <Button variant="outline" onClick={onConnect}>
          <Youtube className="mr-2 h-4 w-4 text-red-600" />
          Connect New Playlist
        </Button>
      </div>

      <div className="rounded-md border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Playlist Details</TableHead>
              <TableHead>Sync Status</TableHead>
              <TableHead>Configuration</TableHead>
              <TableHead className="text-right">Last Synced</TableHead>
              <TableHead className="w-[50px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {playlists.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                  No playlists connected. Connect a YouTube playlist to auto-sync sermons.
                </TableCell>
              </TableRow>
            ) : (
              playlists.map((playlist) => (
                <TableRow key={playlist.id}>
                  <TableCell>
                    <div className="flex flex-col gap-1">
                      <span className="font-medium">{playlist.title}</span>
                      <a 
                        href={playlist.url} 
                        target="_blank" 
                        rel="noreferrer" 
                        className="text-xs text-muted-foreground flex items-center hover:underline"
                      >
                        {playlist.url.substring(0, 30)}...
                        <ExternalLink className="ml-1 h-3 w-3" />
                      </a>
                      <Badge variant="outline" className="w-fit text-[10px] mt-1">
                        {playlist.sermonCount} videos imported
                      </Badge>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                        {syncingIds.has(playlist.id) ? (
                            <div className="flex items-center text-xs text-muted-foreground">
                                <RefreshCw className="mr-2 h-3 w-3 animate-spin" />
                                Syncing...
                            </div>
                        ) : playlist.status === "active" ? (
                             <div className="flex items-center text-xs text-green-600">
                                <CheckCircle2 className="mr-2 h-3 w-3" />
                                Active
                            </div>
                        ) : (
                            <div className="flex items-center text-xs text-red-600">
                                <AlertCircle className="mr-2 h-3 w-3" />
                                Error
                            </div>
                        )}
                    </div>
                  </TableCell>
                  <TableCell>
                      <div className="flex flex-col gap-2">
                          <div className="flex items-center gap-2">
                              <Switch 
                                checked={playlist.autoPublish}
                                onCheckedChange={() => toggleAutoPublish(playlist.id)}
                                id={`auto-publish-${playlist.id}`}
                                className="scale-75 origin-left"
                              />
                              <label 
                                htmlFor={`auto-publish-${playlist.id}`}
                                className="text-xs text-muted-foreground cursor-pointer"
                              >
                                  Auto-publish new videos
                              </label>
                          </div>
                          {playlist.defaultSpeaker && (
                              <span className="text-xs text-muted-foreground">
                                  Default Speaker: {playlist.defaultSpeaker}
                              </span>
                          )}
                      </div>
                  </TableCell>
                  <TableCell className="text-right text-xs text-muted-foreground">
                    {format(playlist.lastSync, "MMM d, h:mm a")}
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <span className="sr-only">Open menu</span>
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleSync(playlist.id)}>
                          <RefreshCw className="mr-2 h-4 w-4" />
                          Sync Now
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => openSettings(playlist)}>
                          <Settings className="mr-2 h-4 w-4" />
                          Edit Settings
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem 
                            className="text-destructive"
                            onClick={() => handleDisconnect(playlist.id)}
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Disconnect Playlist
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Edit Settings Dialog */}
      <Dialog open={!!editingPlaylist} onOpenChange={(open) => !open && setEditingPlaylist(null)}>
        <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
                <DialogTitle>Edit Playlist Settings</DialogTitle>
                <DialogDescription>
                    Configure how videos from "{editingPlaylist?.title}" are imported.
                </DialogDescription>
            </DialogHeader>
            <div className="grid gap-6 py-4">
                <div className="space-y-4">
                    <h4 className="text-sm font-medium leading-none">Import Configuration</h4>
                    
                    <div className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                        <div className="space-y-0.5">
                            <Label htmlFor="edit-auto-publish" className="text-base">Auto-publish</Label>
                            <DialogDescription className="text-xs">
                                Automatically publish imported sermons without review
                            </DialogDescription>
                        </div>
                        <Switch
                            id="edit-auto-publish"
                            checked={editForm.autoPublish}
                            onCheckedChange={(val) => setEditForm(prev => ({ ...prev, autoPublish: val }))}
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                         <div className="space-y-2">
                            <Label htmlFor="edit-default-speaker">Default Speaker</Label>
                            <Input 
                                id="edit-default-speaker" 
                                placeholder="e.g. Pastor John" 
                                value={editForm.defaultSpeaker}
                                onChange={(e) => setEditForm(prev => ({ ...prev, defaultSpeaker: e.target.value }))}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="edit-default-tags">Default Tags</Label>
                            <Input 
                                id="edit-default-tags" 
                                placeholder="e.g. Sunday Service" 
                                value={editForm.defaultTags}
                                onChange={(e) => setEditForm(prev => ({ ...prev, defaultTags: e.target.value }))}
                            />
                        </div>
                    </div>
                </div>
            </div>
            <DialogFooter>
                <Button variant="outline" onClick={() => setEditingPlaylist(null)}>Cancel</Button>
                <Button onClick={saveSettings}>
                    Save Changes
                </Button>
            </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
