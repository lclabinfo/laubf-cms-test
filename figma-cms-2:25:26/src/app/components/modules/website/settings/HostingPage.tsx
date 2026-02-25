"use client";

import { Button } from "@/app/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/app/components/ui/card"
import { Input } from "@/app/components/ui/input"
import { Label } from "@/app/components/ui/label"
import { Badge } from "@/app/components/ui/badge"
import { CheckCircle2, Globe, AlertCircle, RefreshCw } from "lucide-react"

export function HostingPage() {
  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Hosting & Domain</h2>
        <p className="text-muted-foreground">Manage your custom domain and publishing settings.</p>
      </div>

      <Card>
        <CardHeader>
            <CardTitle className="flex items-center gap-2">
                <Globe className="h-5 w-5" />
                Custom Domain
            </CardTitle>
            <CardDescription>Connect your own domain name (e.g., grace.church)</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
            <div className="flex items-center gap-4 p-4 bg-green-50 border border-green-200 rounded-lg text-green-800">
                <CheckCircle2 className="h-5 w-5" />
                <div className="flex-1">
                    <span className="font-semibold block">grace.church is active</span>
                    <span className="text-sm opacity-90">SSL Certificate is valid and auto-renewing.</span>
                </div>
                <Badge className="bg-green-600 hover:bg-green-700">Connected</Badge>
            </div>

            <div className="space-y-4">
                <div className="grid gap-2">
                    <Label>Primary Domain</Label>
                    <div className="flex gap-2">
                        <Input value="grace.church" readOnly />
                        <Button variant="outline">Manage DNS</Button>
                    </div>
                </div>
                
                <div className="grid gap-2">
                    <Label>Staging Domain</Label>
                    <div className="flex gap-2">
                        <Input value="grace-church.chms-staging.com" readOnly className="bg-slate-50 text-muted-foreground" />
                        <Button variant="ghost" size="icon"><RefreshCw className="h-4 w-4" /></Button>
                    </div>
                </div>
            </div>
        </CardContent>
        <CardFooter className="border-t pt-6 bg-slate-50">
            <Button variant="destructive" className="ml-auto">Disconnect Domain</Button>
        </CardFooter>
      </Card>

      <Card>
        <CardHeader>
            <CardTitle>Publishing Settings</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
             <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                    <div className="font-medium">Search Engine Indexing</div>
                    <div className="text-sm text-muted-foreground">Allow Google and other search engines to crawl your site.</div>
                </div>
                <div className="h-6 w-11 bg-slate-200 rounded-full relative cursor-pointer">
                    <div className="absolute right-0.5 top-0.5 h-5 w-5 bg-white rounded-full shadow-sm border" />
                </div>
             </div>
             <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                    <div className="font-medium">Force HTTPS</div>
                    <div className="text-sm text-muted-foreground">Redirect all HTTP traffic to HTTPS.</div>
                </div>
                <div className="h-6 w-11 bg-blue-600 rounded-full relative cursor-pointer">
                    <div className="absolute right-0.5 top-0.5 h-5 w-5 bg-white rounded-full shadow-sm" />
                </div>
             </div>
        </CardContent>
      </Card>
    </div>
  )
}
