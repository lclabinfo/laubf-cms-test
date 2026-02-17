"use client";

import * as React from "react";
import { format } from "date-fns";
import { 
    X, 
    ExternalLink,
    Calendar,
    Image as ImageIcon,
    LayoutTemplate
} from "lucide-react";
import { Button } from "@/app/components/ui/button";
import { Separator } from "@/app/components/ui/separator";
import { type MediaFolder } from "./data";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/app/components/ui/dialog";

interface GoogleAlbumDetailsProps {
    album: MediaFolder | null;
    isOpen: boolean;
    onClose: () => void;
}

export function GoogleAlbumDetails({ 
    album, 
    isOpen, 
    onClose 
}: GoogleAlbumDetailsProps) {
    if (!album) return null;

    // Mock details
    const uploadedDate = new Date(); 
    // Logic for "Used" sections - if connected/active, show some mock sections
    const isUsed = album.status === "Connected" || album.status === "Active" || album.status === "Used";
    
    const usedInSections = isUsed ? [
        "Home Page > Hero Carousel",
        "Events > Summer Camp Gallery"
    ] : [];

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="max-w-2xl p-0 overflow-hidden gap-0">
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b">
                        <div className="flex items-center gap-2 font-semibold">
                            <div className="bg-blue-100 p-1.5 rounded-md text-blue-600">
                                <ImageIcon className="h-4 w-4" />
                            </div>
                            Google Album Details
                        </div>
                        {/* Close button is handled by DialogContent automatically, but we can have one here too if we want explicit control, though standard Dialog has one top-right. 
                            The standard DialogContent has a close X top right.
                        */}
                </div>
                
                <div className="p-6 max-h-[80vh] overflow-y-auto">
                    <DialogTitle className="sr-only">{album.name}</DialogTitle>
                    <div className="flex gap-6 mb-8">
                        {/* Cover Image */}
                        <div className="w-40 h-40 shrink-0 rounded-lg overflow-hidden bg-muted border shadow-sm">
                            {album.coverUrl ? (
                                <img 
                                    src={album.coverUrl} 
                                    alt={album.name} 
                                    className="w-full h-full object-cover"
                                />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                                    <ImageIcon className="h-8 w-8" />
                                </div>
                            )}
                        </div>
                        
                        {/* Basic Info */}
                        <div className="flex-1 space-y-4">
                            <div>
                                <h2 className="text-xl font-bold tracking-tight">{album.name}</h2>
                                <p className="text-sm text-muted-foreground mt-1">
                                    {album.count} photos • Connected via Google Photos
                                </p>
                            </div>
                            
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <Calendar className="h-4 w-4" />
                                <span>Added on {format(uploadedDate, "MMMM d, yyyy")}</span>
                            </div>

                            {album.externalUrl && (
                                <Button 
                                    variant="outline" 
                                    size="sm" 
                                    className="gap-2"
                                    onClick={() => window.open(album.externalUrl, '_blank')}
                                >
                                    View on Google Photos
                                    <ExternalLink className="h-3 w-3" />
                                </Button>
                            )}
                        </div>
                    </div>

                    <Separator className="my-6" />

                    {/* Usage Section */}
                    <div className="space-y-4">
                        <h3 className="text-sm font-semibold flex items-center gap-2">
                            <LayoutTemplate className="h-4 w-4" />
                            Used In Sections
                        </h3>
                        
                        {usedInSections.length > 0 ? (
                            <div className="grid gap-2">
                                {usedInSections.map((section, i) => (
                                    <div key={i} className="flex items-center justify-between p-3 rounded-md bg-muted/30 border">
                                        <span className="text-sm font-medium">{section}</span>
                                        <Button variant="link" size="sm" className="h-auto p-0">
                                            View
                                        </Button>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="p-8 text-center border border-dashed rounded-lg bg-muted/10">
                                <p className="text-sm text-muted-foreground">
                                    This album is not currently used in any sections.
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}
