"use client";

import { Button } from "@/app/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/app/components/ui/tabs"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/app/components/ui/card"
import { Badge } from "@/app/components/ui/badge"
import { Layout, Plus, FilePlus } from "lucide-react"

const pageTemplates = [
    { title: "Home Standard", description: "Classic homepage with hero, features, and events.", tags: ["Home", "Generic"] },
    { title: "Ministry Page", description: "Showcase a specific ministry with leadership and schedule.", tags: ["Ministry", "Dynamic"] },
    { title: "Events Index", description: "Grid view of upcoming events with filters.", tags: ["Events"] },
    { title: "Sermon Archive", description: "Media library for past messages.", tags: ["Media"] },
    { title: "Contact Us", description: "Map, form, and contact details.", tags: ["Utility"] },
];

const sectionTemplates = [
    { title: "Hero Banner", description: "Large image with headline and CTA.", variants: ["Full", "Split", "Overlay"] },
    { title: "Ministry Overview", description: "Description text with stats.", variants: ["Standard", "Minimal"] },
    { title: "Event List", description: "Dynamic list of upcoming events.", variants: ["List", "Grid", "Calendar"] },
    { title: "Staff Directory", description: "Team members with photos and bios.", variants: ["Grid", "List"] },
    { title: "FAQ Accordion", description: "Collapsible questions and answers.", variants: ["Standard"] },
    { title: "Custom Section", description: "Designed for you by our team.", variants: ["Custom"], isCustom: true },
];

export function TemplatesPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Templates</h2>
          <p className="text-muted-foreground">Pre-designed layouts for pages and sections.</p>
        </div>
      </div>

      <Tabs defaultValue="pages" className="w-full">
        <TabsList className="grid w-full grid-cols-2 max-w-[400px]">
          <TabsTrigger value="pages">Page Templates</TabsTrigger>
          <TabsTrigger value="sections">Section Templates</TabsTrigger>
        </TabsList>
        
        <TabsContent value="pages" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {pageTemplates.map((template, i) => (
                <Card key={i} className="hover:shadow-md transition-shadow cursor-pointer group">
                    <div className="aspect-video bg-muted relative overflow-hidden rounded-t-lg">
                        <div className="absolute inset-0 bg-slate-200 flex items-center justify-center text-slate-400">
                            <Layout className="h-12 w-12" />
                        </div>
                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <Button variant="secondary">Preview</Button>
                        </div>
                    </div>
                    <CardHeader>
                        <CardTitle className="flex items-center justify-between text-base">
                            {template.title}
                        </CardTitle>
                        <CardDescription>{template.description}</CardDescription>
                    </CardHeader>
                    <CardFooter className="flex gap-2">
                        {template.tags.map(tag => (
                            <Badge key={tag} variant="secondary" className="font-normal text-xs">{tag}</Badge>
                        ))}
                    </CardFooter>
                </Card>
            ))}
          </div>
        </TabsContent>
        
        <TabsContent value="sections" className="mt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {sectionTemplates.map((template, i) => (
                <Card key={i} className={`hover:shadow-md transition-shadow cursor-pointer group ${template.isCustom ? 'border-primary/50 bg-primary/5' : ''}`}>
                    <div className="aspect-[3/1] bg-muted relative overflow-hidden rounded-t-lg">
                        <div className="absolute inset-0 bg-slate-100 flex items-center justify-center text-slate-300">
                            {template.isCustom ? <Plus className="h-8 w-8 text-primary" /> : <Layout className="h-8 w-8" />}
                        </div>
                    </div>
                    <CardHeader>
                        <CardTitle className="flex items-center justify-between text-base">
                            {template.title}
                            {template.isCustom && <Badge>Premium</Badge>}
                        </CardTitle>
                        <CardDescription>{template.description}</CardDescription>
                    </CardHeader>
                    <CardFooter>
                        <p className="text-xs text-muted-foreground">
                            Variants: {template.variants.join(", ")}
                        </p>
                    </CardFooter>
                </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
