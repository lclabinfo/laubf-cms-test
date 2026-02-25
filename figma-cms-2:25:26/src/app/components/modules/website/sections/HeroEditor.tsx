import React from "react";
import { Label } from "@/app/components/ui/label";
import { Input } from "@/app/components/ui/input";
import { Textarea } from "@/app/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/app/components/ui/select";
import { Separator } from "@/app/components/ui/separator";
import { ExternalLink, LayoutTemplate, AlignCenter, AlignLeft, ArrowDown } from "lucide-react";
import { Switch } from "@/app/components/ui/switch";
import { HeroSectionData, HeroLayout, HeroOverlay, HeroButton, DEFAULT_HERO_DATA } from "./HeroSection";

interface HeroEditorProps {
    data?: HeroSectionData;
    onUpdate: (newData: HeroSectionData) => void;
}

export function HeroEditor({ data = DEFAULT_HERO_DATA, onUpdate }: HeroEditorProps) {
    
    const handleChange = (field: keyof HeroSectionData, value: any) => {
        onUpdate({ ...data, [field]: value });
    };

    const handleButtonUpdate = (index: number, field: keyof HeroButton, value: any) => {
        const newButtons = [...data.buttons];
        newButtons[index] = { ...newButtons[index], [field]: value };
        handleChange('buttons', newButtons);
    };

    return (
        <div className="p-6 space-y-6 animate-in fade-in slide-in-from-right-2 pb-24">
            
            {/* Layout & Style */}
            <div className="space-y-4">
                <Label className="text-xs font-semibold uppercase tracking-wider text-slate-500">Design</Label>
                
                <div className="space-y-3">
                    <Label className="text-xs text-slate-600">Layout Style</Label>
                    <div className="grid grid-cols-3 gap-2">
                        <div 
                            className={`border rounded-lg p-2 cursor-pointer flex flex-col items-center justify-center gap-2 h-20 text-center hover:bg-slate-50 ${data.layout === 'split-bottom' ? 'ring-2 ring-blue-600 border-blue-600 bg-blue-50/50' : ''}`}
                            onClick={() => handleChange('layout', 'split-bottom')}
                        >
                            <LayoutTemplate className="w-5 h-5 opacity-70" />
                            <span className="text-[10px] font-medium leading-tight">Split Bottom</span>
                        </div>
                        <div 
                            className={`border rounded-lg p-2 cursor-pointer flex flex-col items-center justify-center gap-2 h-20 text-center hover:bg-slate-50 ${data.layout === 'center' ? 'ring-2 ring-blue-600 border-blue-600 bg-blue-50/50' : ''}`}
                            onClick={() => handleChange('layout', 'center')}
                        >
                            <AlignCenter className="w-5 h-5 opacity-70" />
                            <span className="text-[10px] font-medium leading-tight">Centered</span>
                        </div>
                        <div 
                            className={`border rounded-lg p-2 cursor-pointer flex flex-col items-center justify-center gap-2 h-20 text-center hover:bg-slate-50 ${data.layout === 'left-stack' ? 'ring-2 ring-blue-600 border-blue-600 bg-blue-50/50' : ''}`}
                            onClick={() => handleChange('layout', 'left-stack')}
                        >
                            <AlignLeft className="w-5 h-5 opacity-70" />
                            <span className="text-[10px] font-medium leading-tight">Left Stack</span>
                        </div>
                    </div>
                </div>

                <div className="space-y-1.5">
                    <Label className="text-xs text-slate-600">Overlay Opacity</Label>
                    <Select value={data.overlay} onValueChange={(v) => handleChange('overlay', v)}>
                        <SelectTrigger className="h-8 text-xs">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="none">None (Original Image)</SelectItem>
                            <SelectItem value="light">Light Tint</SelectItem>
                            <SelectItem value="gradient-heavy">Heavy Gradient (Readable)</SelectItem>
                            <SelectItem value="dark">Dark Dim</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>

            <Separator />

            {/* Background */}
            <div className="space-y-4">
                <Label className="text-xs font-semibold uppercase tracking-wider text-slate-500">Background Media</Label>
                <div className="space-y-1.5">
                    <Label className="text-xs text-slate-600">Image URL</Label>
                    <Input 
                        value={data.backgroundImage} 
                        onChange={(e) => handleChange('backgroundImage', e.target.value)}
                        className="text-xs font-mono"
                        placeholder="https://..."
                    />
                    <p className="text-[10px] text-slate-400">Paste a URL from Unsplash or your media library.</p>
                </div>
            </div>

            <Separator />

            {/* Content */}
            <div className="space-y-4">
                <Label className="text-xs font-semibold uppercase tracking-wider text-slate-500">Text Content</Label>
                <div className="space-y-1.5">
                    <Label className="text-xs text-slate-600">Pre-Title (Small)</Label>
                    <Input 
                        value={data.pretitle} 
                        onChange={(e) => handleChange('pretitle', e.target.value)}
                        className=""
                    />
                </div>
                <div className="space-y-1.5">
                    <Label className="text-xs text-slate-600">Main Title (Large)</Label>
                    <Input 
                        value={data.title} 
                        onChange={(e) => handleChange('title', e.target.value)}
                        className="font-bold text-lg"
                    />
                </div>
                <div className="space-y-1.5">
                    <Label className="text-xs text-slate-600">Description</Label>
                    <Textarea 
                        value={data.description} 
                        onChange={(e) => handleChange('description', e.target.value)}
                        className="min-h-[80px] text-xs resize-none"
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
                                placeholder="Label"
                                className="h-8 text-xs bg-white"
                             />
                             <Select value={btn.variant} onValueChange={(v) => handleButtonUpdate(index, 'variant', v)}>
                                <SelectTrigger className="h-8 text-xs w-[100px] bg-white">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="primary">Solid</SelectItem>
                                    <SelectItem value="secondary">Outline</SelectItem>
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
                                        id={`hero-new-tab-${btn.id}`}
                                        checked={btn.newTab}
                                        onCheckedChange={(checked) => handleButtonUpdate(index, 'newTab', checked)}
                                        className="scale-75 origin-left"
                                    />
                                    <Label htmlFor={`hero-new-tab-${btn.id}`} className="text-xs text-slate-500 cursor-pointer flex items-center gap-1">
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
