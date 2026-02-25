"use client";

import { Button } from "@/app/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/app/components/ui/card"
import { Label } from "@/app/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/app/components/ui/radio-group"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/app/components/ui/select"
import { Slider } from "@/app/components/ui/slider"
import { Palette, Type, Layout, Check } from "lucide-react"

export function ThemePage() {
  return (
    <div className="flex flex-col md:flex-row gap-6 h-[calc(100vh-140px)]">
      {/* Controls */}
      <div className="w-full md:w-[350px] space-y-6 overflow-y-auto pr-2">
        <div>
            <h2 className="text-2xl font-bold tracking-tight mb-2">Theme</h2>
            <p className="text-muted-foreground mb-6">Global design settings for your entire site.</p>
        </div>

        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                    <Type className="h-4 w-4" />
                    Typography
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="space-y-2">
                    <Label>Font Pairing</Label>
                    <Select defaultValue="inter">
                        <SelectTrigger>
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="inter">Inter & Inter (Modern)</SelectItem>
                            <SelectItem value="serif">Merriweather & Open Sans (Classic)</SelectItem>
                            <SelectItem value="mono">Space Grotesk & Inter (Bold)</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
                <div className="space-y-2">
                    <Label>Base Size</Label>
                    <div className="flex items-center gap-4">
                        <span className="text-xs">A</span>
                        <Slider defaultValue={[16]} max={20} min={14} step={1} />
                        <span className="text-lg">A</span>
                    </div>
                </div>
            </CardContent>
        </Card>

        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                    <Palette className="h-4 w-4" />
                    Colors
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="space-y-2">
                    <Label>Primary Brand Color</Label>
                    <div className="flex gap-2 flex-wrap">
                        {['bg-blue-600', 'bg-indigo-600', 'bg-purple-600', 'bg-rose-600', 'bg-orange-500', 'bg-emerald-600', 'bg-slate-900'].map((color, i) => (
                            <div key={i} className={`h-8 w-8 rounded-full ${color} cursor-pointer ring-offset-2 hover:ring-2 ring-slate-400 ${i === 0 ? 'ring-2 ring-slate-900' : ''}`}></div>
                        ))}
                    </div>
                </div>
                <div className="space-y-2">
                    <Label>Background Tone</Label>
                    <RadioGroup defaultValue="light">
                        <div className="flex items-center space-x-2">
                            <RadioGroupItem value="light" id="bg-light" />
                            <Label htmlFor="bg-light">Pure White</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                            <RadioGroupItem value="off-white" id="bg-off" />
                            <Label htmlFor="bg-off">Off-White / Cream</Label>
                        </div>
                    </RadioGroup>
                </div>
            </CardContent>
        </Card>

        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                    <Layout className="h-4 w-4" />
                    Spacing & Radius
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="space-y-2">
                    <Label>Spacing Scale</Label>
                    <Select defaultValue="comfortable">
                        <SelectTrigger>
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="compact">Compact</SelectItem>
                            <SelectItem value="comfortable">Comfortable</SelectItem>
                            <SelectItem value="spacious">Spacious</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
                <div className="space-y-2">
                    <Label>Corner Radius</Label>
                    <Select defaultValue="md">
                        <SelectTrigger>
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="none">Square (0px)</SelectItem>
                            <SelectItem value="sm">Small (4px)</SelectItem>
                            <SelectItem value="md">Medium (8px)</SelectItem>
                            <SelectItem value="full">Round (20px)</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </CardContent>
        </Card>

        <Button className="w-full">Save Changes</Button>
      </div>

      {/* Preview */}
      <div className="flex-1 bg-slate-100 rounded-lg border overflow-hidden flex flex-col">
        <div className="bg-white border-b px-4 py-2 text-xs text-muted-foreground flex justify-between">
            <span>Live Preview</span>
            <span>Home Page</span>
        </div>
        <div className="flex-1 overflow-y-auto p-8">
            <div className="bg-white shadow-sm min-h-[600px] w-full max-w-4xl mx-auto">
                <div className="h-64 bg-blue-600 text-white flex items-center justify-center flex-col p-8 text-center">
                    <h1 className="text-4xl font-bold mb-4">Welcome to Grace Church</h1>
                    <p className="text-lg opacity-90">Loving God, Loving People</p>
                    <Button variant="secondary" className="mt-6">Join Us this Sunday</Button>
                </div>
                <div className="p-12 max-w-2xl mx-auto text-center space-y-6">
                    <h2 className="text-2xl font-bold text-slate-900">A Community of Faith</h2>
                    <p className="text-slate-600 leading-relaxed">
                        Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam.
                    </p>
                    <div className="grid grid-cols-2 gap-4 mt-8">
                        <div className="p-4 bg-slate-50 rounded-lg">
                            <h3 className="font-bold">Service Times</h3>
                            <p className="text-sm text-slate-500">Sundays at 9AM & 11AM</p>
                        </div>
                        <div className="p-4 bg-slate-50 rounded-lg">
                            <h3 className="font-bold">Location</h3>
                            <p className="text-sm text-slate-500">123 Main St, Cityville</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
      </div>
    </div>
  )
}
