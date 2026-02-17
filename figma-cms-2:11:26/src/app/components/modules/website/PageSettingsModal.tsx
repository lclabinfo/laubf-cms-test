"use client";

import { useState, useEffect } from "react";
import { 
    Dialog, 
    DialogContent, 
    DialogHeader, 
    DialogTitle, 
    DialogFooter, 
    DialogDescription 
} from "@/app/components/ui/dialog";
import { Button } from "@/app/components/ui/button";
import { Label } from "@/app/components/ui/label";
import { Input } from "@/app/components/ui/input";
import { 
    Select, 
    SelectContent, 
    SelectItem, 
    SelectTrigger, 
    SelectValue 
} from "@/app/components/ui/select";
import { Database, Trash2 } from "lucide-react";
import { Page } from "./pages/WebsiteNavbar";

interface PageSettingsModalProps {
    isOpen: boolean;
    onClose: () => void;
    page: Page | null;
    ministries: { id: string, name: string }[];
    onUpdate: (updatedPage: Page) => void;
    onDelete: (pageId: string) => void;
}

export function PageSettingsModal({ isOpen, onClose, page, ministries, onUpdate, onDelete }: PageSettingsModalProps) {
    const [title, setTitle] = useState("");
    const [url, setUrl] = useState("");
    const [ministryId, setMinistryId] = useState("");

    useEffect(() => {
        if (page) {
            setTitle(page.title);
            setUrl(page.url || `#${page.title.toLowerCase().replace(/\s+/g, '-')}`);
            setMinistryId(page.ministryId || page.id);
        }
    }, [page]);

    const handleMinistryChange = (newId: string) => {
        setMinistryId(newId);
        
        const selectedMinistry = ministries.find(m => m.id === newId);
        if (selectedMinistry) {
            const newTitle = selectedMinistry.name;
            const newSlug = `#${newTitle.toLowerCase().replace(/\s+/g, '-')}`;
            
            setTitle(newTitle);
            setUrl(newSlug);
        }
    };

    const handleSave = () => {
        if (!page) return;
        
        onUpdate({
            ...page,
            title,
            url,
            ministryId: page.type === 'ministry' ? ministryId : undefined
        });
        onClose();
    };

    if (!page) return null;

    const isMinistryPage = page.type === 'ministry';

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Page Settings</DialogTitle>
                    <DialogDescription>
                        Configure settings for <strong>{page.title}</strong>
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-6 py-4">
                    <div className="space-y-2">
                        <Label>Page Title</Label>
                        <Input 
                            value={title} 
                            onChange={(e) => setTitle(e.target.value)} 
                            placeholder="e.g. About Us"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label>URL Slug</Label>
                        <div className="flex rounded-md shadow-sm">
                            <span className="flex items-center px-3 rounded-l-md border border-r-0 border-input bg-muted text-muted-foreground text-sm">
                                /
                            </span>
                            <Input 
                                value={url.replace('#', '')} 
                                onChange={(e) => setUrl(`#${e.target.value}`)} 
                                className="rounded-l-none"
                                placeholder="about-us"
                            />
                        </div>
                    </div>

                    {isMinistryPage && (
                        <div className="space-y-2 pt-2 border-t">
                            <div className="flex items-center gap-2 mb-2">
                                <Database className="w-4 h-4 text-blue-600" />
                                <Label className="text-blue-900">Connected Ministry</Label>
                            </div>
                            <div className="p-3 bg-blue-50 rounded-lg border border-blue-100 text-sm text-blue-800 mb-3">
                                This page is powered by the <strong>Ministry Module</strong>. Content is synced automatically.
                            </div>
                            <Select value={ministryId} onValueChange={handleMinistryChange}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select a ministry..." />
                                </SelectTrigger>
                                <SelectContent>
                                    {ministries.map(m => (
                                        <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    )}
                </div>

                <DialogFooter className="flex justify-between sm:justify-between w-full">
                     <Button 
                        variant="destructive" 
                        size="sm"
                        onClick={() => {
                            if (confirm("Are you sure you want to delete this page?")) {
                                onDelete(page.id);
                                onClose();
                            }
                        }}
                    >
                        <Trash2 className="w-4 h-4 mr-2" /> Delete
                    </Button>
                    <div className="flex gap-2">
                        <Button variant="outline" onClick={onClose}>Cancel</Button>
                        <Button onClick={handleSave}>Save Changes</Button>
                    </div>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
