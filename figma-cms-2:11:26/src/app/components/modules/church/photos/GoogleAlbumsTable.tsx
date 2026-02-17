"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/app/components/ui/table";
import { Button } from "@/app/components/ui/button";
import { ExternalLink, Trash2, CheckCircle, AlertCircle, Loader2, Image as ImageIcon, Link as LinkIcon } from "lucide-react";
import { type MediaFolder } from "./data";
import { cn } from "@/app/components/ui/utils";

interface GoogleAlbumsTableProps {
  albums: MediaFolder[];
  onDelete: (id: string) => void;
  onViewDetails: (album: MediaFolder) => void;
}

export function GoogleAlbumsTable({ albums, onDelete, onViewDetails }: GoogleAlbumsTableProps) {
  if (albums.length === 0) {
      return (
          <div className="flex flex-col items-center justify-center py-20 text-center border rounded-lg bg-muted/10 border-dashed">
              <div className="bg-muted p-4 rounded-full mb-4">
                  <ImageIcon className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-medium">No Google Albums connected</h3>
              <p className="text-sm text-muted-foreground max-w-sm mt-1">
                  Connect a Google Photos album to display it here.
              </p>
          </div>
      )
  }

  return (
    <div className="border rounded-md">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[100px]">Cover</TableHead>
            <TableHead>Album Name</TableHead>
            <TableHead>Photos</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {albums.map((album) => {
             const isConnected = album.status === 'Used';
             
             return (
                <TableRow 
                    key={album.id} 
                    className="cursor-pointer group"
                    onClick={() => onViewDetails(album)}
                >
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    <div className="w-12 h-12 rounded overflow-hidden bg-muted relative shrink-0">
                        {album.coverUrl ? (
                            <img 
                                src={album.coverUrl} 
                                alt={album.name} 
                                className="w-full h-full object-cover"
                            />
                        ) : (
                            <div className="flex items-center justify-center w-full h-full bg-muted text-muted-foreground">
                                <ImageIcon className="h-4 w-4" />
                            </div>
                        )}
                    </div>
                  </TableCell>
                  <TableCell className="font-medium">
                    <span className="group-hover:text-primary transition-colors">{album.name}</span>
                  </TableCell>
                  <TableCell>{album.count}</TableCell>
                  <TableCell>
                    {isConnected ? (
                        <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border bg-green-50 text-green-700 border-green-200">
                             <CheckCircle className="h-3 w-3" />
                             Used
                        </div>
                    ) : (
                        <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border bg-muted text-muted-foreground border-border">
                             <AlertCircle className="h-3 w-3" />
                             Unused
                        </div>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2" onClick={(e) => e.stopPropagation()}>
                        {album.externalUrl && (
                            <Button 
                                variant="outline" 
                                size="sm" 
                                className="h-8 gap-2"
                                title="View on Google Photos"
                                onClick={() => window.open(album.externalUrl, '_blank')}
                            >
                                View on Google Photos
                                <ExternalLink className="h-3 w-3" />
                            </Button>
                        )}
                        <Button 
                            variant="ghost" 
                            size="icon"
                            className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                            title="Delete Album"
                            onClick={() => onDelete(album.id)}
                        >
                            <Trash2 className="h-4 w-4" />
                        </Button>
                    </div>
                  </TableCell>
                </TableRow>
             );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
