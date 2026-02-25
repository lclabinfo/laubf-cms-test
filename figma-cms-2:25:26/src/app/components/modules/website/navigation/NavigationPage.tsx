"use client";

import { useState } from "react"
import { Button } from "@/app/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/app/components/ui/card"
import { Input } from "@/app/components/ui/input"
import { Label } from "@/app/components/ui/label"
import { Badge } from "@/app/components/ui/badge"
import { GripVertical, Plus, Trash2, ChevronRight, ExternalLink } from "lucide-react"

interface NavItem {
    id: string;
    label: string;
    type: 'page' | 'link';
    destination: string;
    children?: NavItem[];
}

const initialNav: NavItem[] = [
    { id: '1', label: 'Home', type: 'page', destination: '/' },
    { id: '2', label: 'About', type: 'page', destination: '/about', children: [
        { id: '2a', label: 'Our Story', type: 'page', destination: '/about/story' },
        { id: '2b', label: 'Staff', type: 'page', destination: '/about/staff' },
    ] },
    { id: '3', label: 'Ministries', type: 'page', destination: '/ministries' },
    { id: '4', label: 'Events', type: 'page', destination: '/events' },
    { id: '5', label: 'Give', type: 'link', destination: 'https://giving.provider.com' },
];

export function NavigationPage() {
  const [navItems, setNavItems] = useState<NavItem[]>(initialNav);

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Navigation</h2>
        <p className="text-muted-foreground">Manage your website's main menu structure.</p>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Menu Editor */}
        <div className="md:col-span-2 space-y-4">
            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle className="text-base">Main Menu</CardTitle>
                    <Button size="sm" variant="outline">
                        <Plus className="h-4 w-4 mr-2" />
                        Add Item
                    </Button>
                </CardHeader>
                <CardContent className="space-y-3">
                    {navItems.map((item, index) => (
                        <div key={item.id} className="space-y-2">
                            {/* Parent Item */}
                            <div className="flex items-center gap-3 p-3 bg-white border rounded-lg group hover:border-blue-400 transition-colors">
                                <GripVertical className="h-4 w-4 text-muted-foreground cursor-grab" />
                                <div className="flex-1">
                                    <div className="font-medium text-sm flex items-center gap-2">
                                        {item.label}
                                        {item.type === 'link' && <ExternalLink className="h-3 w-3 text-muted-foreground" />}
                                    </div>
                                    <div className="text-xs text-muted-foreground">{item.destination}</div>
                                </div>
                                <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <Button size="icon" variant="ghost" className="h-7 w-7"><Plus className="h-3 w-3" /></Button>
                                    <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive"><Trash2 className="h-3 w-3" /></Button>
                                </div>
                            </div>

                            {/* Children */}
                            {item.children && (
                                <div className="pl-8 space-y-2">
                                    {item.children.map((child) => (
                                        <div key={child.id} className="flex items-center gap-3 p-2 bg-slate-50 border rounded-lg group hover:border-blue-400 transition-colors">
                                            <div className="w-4 flex justify-center"><div className="w-2 h-2 border-l border-b border-slate-300 rounded-bl-sm" /></div>
                                            <div className="flex-1">
                                                <div className="font-medium text-xs">{child.label}</div>
                                            </div>
                                            <Button size="icon" variant="ghost" className="h-6 w-6 text-destructive opacity-0 group-hover:opacity-100"><Trash2 className="h-3 w-3" /></Button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    ))}
                </CardContent>
            </Card>
            <Button>Save Menu</Button>
        </div>

        {/* Sidebar Help */}
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle className="text-sm">Available Pages</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="text-sm text-muted-foreground mb-4">
                        Drag pages here to add them to your menu.
                    </div>
                    <div className="space-y-2">
                        {['New Visitor', 'Sermons', 'Youth'].map(page => (
                            <div key={page} className="p-2 border rounded bg-white text-sm cursor-grab active:cursor-grabbing hover:bg-slate-50">
                                {page}
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>
        </div>
      </div>
    </div>
  )
}
