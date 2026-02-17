"use client";

import { Button } from "@/app/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/app/components/ui/card"
import { Badge } from "@/app/components/ui/badge"
import { ArrowRight, Globe, Layout, Palette, FileText } from "lucide-react"

export function WebsiteOverviewPage() {
  const triggerNavigate = (page: string) => {
      window.dispatchEvent(new CustomEvent('navigate', { 
          detail: { module: 'website', page: page } 
      }));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Website Overview</h2>
          <p className="text-muted-foreground">Manage your church's online presence.</p>
        </div>
        <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => window.open('https://demo-church.com', '_blank')}>
                View Live Site
            </Button>
            <Button onClick={() => triggerNavigate('pages')}>
                Edit Website
            </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Status</CardTitle>
            <Globe className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
                <div className="text-2xl font-bold">Published</div>
                <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
            </div>
            <p className="text-xs text-muted-foreground">Last published 2 hours ago</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Pages</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">12</div>
            <p className="text-xs text-muted-foreground">4 Custom, 8 Template</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Theme</CardTitle>
            <Palette className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Sunday Clean</div>
            <p className="text-xs text-muted-foreground">Version 2.0</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Domain</CardTitle>
            <Badge variant="secondary">Connected</Badge>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">grace.church</div>
            <p className="text-xs text-muted-foreground">SSL Secured</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Common tasks for managing your website.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4">
            <div className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 cursor-pointer transition-colors" onClick={() => triggerNavigate('pages')}>
                <div className="flex items-center gap-4">
                    <div className="h-10 w-10 bg-primary/10 rounded-full flex items-center justify-center">
                        <FileText className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                        <div className="font-medium">Manage Pages</div>
                        <div className="text-sm text-muted-foreground">Create or edit your website pages</div>
                    </div>
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 cursor-pointer transition-colors" onClick={() => triggerNavigate('themes')}>
                <div className="flex items-center gap-4">
                    <div className="h-10 w-10 bg-primary/10 rounded-full flex items-center justify-center">
                        <Palette className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                        <div className="font-medium">Theme Settings</div>
                        <div className="text-sm text-muted-foreground">Update fonts, colors, and styling</div>
                    </div>
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 cursor-pointer transition-colors" onClick={() => triggerNavigate('templates')}>
                <div className="flex items-center gap-4">
                    <div className="h-10 w-10 bg-primary/10 rounded-full flex items-center justify-center">
                        <Layout className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                        <div className="font-medium">Browse Templates</div>
                        <div className="text-sm text-muted-foreground">Add new sections or pages from templates</div>
                    </div>
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
        
        <Card className="col-span-3">
            <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
                <CardDescription>Latest changes to your website.</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="space-y-8">
                    <div className="flex items-center">
                        <div className="ml-4 space-y-1">
                            <p className="text-sm font-medium leading-none">Updated "Youth Ministry"</p>
                            <p className="text-sm text-muted-foreground">David Lim • 2 hours ago</p>
                        </div>
                    </div>
                    <div className="flex items-center">
                        <div className="ml-4 space-y-1">
                            <p className="text-sm font-medium leading-none">Published "Easter Service"</p>
                            <p className="text-sm text-muted-foreground">Sarah Chen • 5 hours ago</p>
                        </div>
                    </div>
                    <div className="flex items-center">
                        <div className="ml-4 space-y-1">
                            <p className="text-sm font-medium leading-none">Changed Global Theme</p>
                            <p className="text-sm text-muted-foreground">David Lim • Yesterday</p>
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
      </div>
    </div>
  )
}
