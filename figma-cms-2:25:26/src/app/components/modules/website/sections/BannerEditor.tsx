import React from "react";
import { Label } from "@/app/components/ui/label";
import { Input } from "@/app/components/ui/input";
import { Textarea } from "@/app/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/app/components/ui/select";
import { Separator } from "@/app/components/ui/separator";
import { Button } from "@/app/components/ui/button";
import { Trash2, Plus, GripVertical, ExternalLink } from "lucide-react";
import { Switch } from "@/app/components/ui/switch";
import { BannerSectionData, BannerColorScheme, BannerHeight, BannerAlignment, BannerButton, DEFAULT_BANNER_DATA } from "./BannerSection";

interface BannerEditorProps {
    data?: BannerSectionData;
    onUpdate: (newData: BannerSectionData) => void;
}

export function BannerEditor({ data = DEFAULT_BANNER_DATA, onUpdate }: BannerEditorProps) {
    
    const handleChange = (field: keyof BannerSectionData, value: any) => {
        onUpdate({ ...data, [field]: value });
    };

    const handleButtonUpdate = (index: number, field: keyof BannerButton, value: any) => {
        const newButtons = [...data.buttons];
        newButtons[index] = { ...newButtons[index], [field]: value };
        handleChange('buttons', newButtons);
    };

    return (
        <div className="p-6 space-y-6 animate-in fade-in slide-in-from-right-2 pb-24">
            
            {/* Color Scheme */}
            <div className="space-y-3">
                <Label className="text-xs font-semibold uppercase tracking-wider text-slate-500">Color Scheme</Label>
                <div className="grid grid-cols-2 gap-3">
                    <div 
                        className={`border rounded-lg p-3 cursor-pointer flex items-center gap-2 ${data.colorScheme === 'dark' ? 'ring-2 ring-blue-600 border-blue-600' : 'hover:bg-slate-50'}`}
                        onClick={() => handleChange('colorScheme', 'dark')}
                    >
                        <div className="w-6 h-6 rounded-full bg-[#0d0d0d] border border-slate-700" />
                        <span className="text-sm font-medium">Dark</span>
                    </div>
                    <div 
                        className={`border rounded-lg p-3 cursor-pointer flex items-center gap-2 ${data.colorScheme === 'light' ? 'ring-2 ring-blue-600 border-blue-600' : 'hover:bg-slate-50'}`}
                        onClick={() => handleChange('colorScheme', 'light')}
                    >
                        <div className="w-6 h-6 rounded-full bg-white border border-slate-200" />
                        <span className="text-sm font-medium">Light</span>
                    </div>
                    <div 
                        className={`border rounded-lg p-3 cursor-pointer flex items-center gap-2 ${data.colorScheme === 'blue' ? 'ring-2 ring-blue-600 border-blue-600' : 'hover:bg-slate-50'}`}
                        onClick={() => handleChange('colorScheme', 'blue')}
                    >
                        <div className="w-6 h-6 rounded-full bg-blue-600 border border-blue-700" />
                        <span className="text-sm font-medium">Blue</span>
                    </div>
                    <div 
                        className={`border rounded-lg p-3 cursor-pointer flex items-center gap-2 ${data.colorScheme === 'navy' ? 'ring-2 ring-blue-600 border-blue-600' : 'hover:bg-slate-50'}`}
                        onClick={() => handleChange('colorScheme', 'navy')}
                    >
                        <div className="w-6 h-6 rounded-full bg-slate-900 border border-slate-800" />
                        <span className="text-sm font-medium">Navy</span>
                    </div>
                </div>
            </div>

            <Separator />

            {/* Layout */}
            <div className="space-y-4">
                <Label className="text-xs font-semibold uppercase tracking-wider text-slate-500">Layout</Label>
                
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                        <Label className="text-xs text-slate-600">Alignment</Label>
                        <Select value={data.alignment} onValueChange={(v) => handleChange('alignment', v)}>
                            <SelectTrigger className="h-8 text-xs">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="left">Left</SelectItem>
                                <SelectItem value="center">Center</SelectItem>
                                <SelectItem value="right">Right</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-1.5">
                        <Label className="text-xs text-slate-600">Height</Label>
                        <Select value={data.height} onValueChange={(v) => handleChange('height', v)}>
                            <SelectTrigger className="h-8 text-xs">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="sm">Small</SelectItem>
                                <SelectItem value="default">Default</SelectItem>
                                <SelectItem value="md">Medium</SelectItem>
                                <SelectItem value="lg">Large</SelectItem>
                                <SelectItem value="full">Full Screen</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>
            </div>

            <Separator />

            {/* Content */}
            <div className="space-y-4">
                <Label className="text-xs font-semibold uppercase tracking-wider text-slate-500">Content</Label>
                <div className="space-y-1.5">
                    <Label className="text-xs text-slate-600">Title</Label>
                    <Input 
                        value={data.title} 
                        onChange={(e) => handleChange('title', e.target.value)}
                        className="font-medium"
                    />
                </div>
                <div className="space-y-1.5">
                    <Label className="text-xs text-slate-600">Description</Label>
                    <Textarea 
                        value={data.description} 
                        onChange={(e) => handleChange('description', e.target.value)}
                        className="min-h-[100px] text-xs resize-none"
                    />
                </div>
            </div>

            <Separator />

            {/* Buttons */}
            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <Label className="text-xs font-semibold uppercase tracking-wider text-slate-500">Buttons</Label>
                    <span className="text-[10px] text-slate-400">Max 2 buttons</span>
                </div>
                
                {data.buttons.map((btn, index) => (
                    <div key={btn.id} className="border rounded-lg p-3 space-y-3 bg-slate-50/50">
                        <div className="flex gap-2">
                             <Input 
                                value={btn.label}
                                onChange={(e) => handleButtonUpdate(index, 'label', e.target.value)}
                                placeholder="Button Label (empty to hide)"
                                className="h-8 text-xs bg-white"
                             />
                             <Select value={btn.variant} onValueChange={(v) => handleButtonUpdate(index, 'variant', v)}>
                                <SelectTrigger className="h-8 text-xs w-[100px] bg-white">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="primary">Primary</SelectItem>
                                    <SelectItem value="secondary">Secondary</SelectItem>
                                </SelectContent>
                             </Select>
                        </div>
                        
                        {btn.label.trim() && (
                            <div className="space-y-2 animate-in slide-in-from-top-1 fade-in">
                                <Input 
                                    value={btn.link}
                                    onChange={(e) => handleButtonUpdate(index, 'link', e.target.value)}
                                    placeholder="https://..."
                                    className="h-8 text-xs bg-white"
                                />
                                <div className="flex items-center gap-2">
                                    <Switch 
                                        id={`new-tab-${btn.id}`}
                                        checked={btn.newTab}
                                        onCheckedChange={(checked) => handleButtonUpdate(index, 'newTab', checked)}
                                        className="scale-75 origin-left"
                                    />
                                    <Label htmlFor={`new-tab-${btn.id}`} className="text-xs text-slate-500 cursor-pointer flex items-center gap-1">
                                        Open in new tab <ExternalLink className="w-3 h-3" />
                                    </Label>
                                </div>
                            </div>
                        )}
                    </div>
                ))}
            </div>

        </div>
    );
}
