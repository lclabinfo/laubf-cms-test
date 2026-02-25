"use client";

import { Button } from "@/app/components/ui/button"
import { Badge } from "@/app/components/ui/badge"
import { MoreHorizontal, Lock, Eye } from "lucide-react"
import { HeroSection } from "@/app/components/modules/website/sections/HeroSection"

export function WebsiteThemesPage() {
  const triggerNavigate = (page: string) => {
      window.dispatchEvent(new CustomEvent('navigate', { 
          detail: { module: 'website', page: page } 
      }));
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-slate-900 flex items-center gap-2">
            <span className="text-slate-500 font-normal">Website</span>
            <span className="text-slate-300">/</span>
            Design
        </h2>
        <div className="flex items-center gap-3">
             <Button variant="outline" className="gap-2" onClick={() => window.open('https://demo-church.com', '_blank')}>
                <Eye className="w-4 h-4" />
                View your site
             </Button>
        </div>
      </div>

      <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
        <div className="grid lg:grid-cols-12 gap-0">
             {/* Preview Image - Using HeroSection component as requested */}
             <div className="lg:col-span-8 bg-slate-900 relative border-r overflow-hidden max-h-[500px] pointer-events-none select-none">
                <div className="scale-[0.6] origin-top-left w-[166.66%] h-[166.66%] absolute top-0 left-0">
                    <HeroSection />
                </div>
             </div>

             {/* Theme Info */}
             <div className="lg:col-span-4 p-8 flex flex-col h-full justify-between bg-white">
                <div className="space-y-6">
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                             <h3 className="text-lg font-bold text-slate-900">Sunday Clean</h3>
                             <Badge variant="secondary" className="bg-green-100 text-green-700 hover:bg-green-100 border-none px-2 py-0.5 font-medium">Current theme</Badge>
                        </div>
                        <p className="text-sm text-slate-500">Added: Today, 3:23 pm</p>
                        <p className="text-sm text-slate-500">Version 3.2.1</p>
                    </div>

                    <div className="p-4 bg-orange-50 border border-orange-100 rounded-lg flex gap-3 text-orange-800">
                        <Lock className="w-4 h-4 shrink-0 mt-0.5" />
                        <div className="text-sm">
                            <p className="font-medium mb-1">Password protected</p>
                            <p className="opacity-80">Visitors need a password to access your site.</p>
                        </div>
                    </div>
                </div>

                <div className="space-y-4">
                     <div className="flex items-center gap-3">
                        <Button 
                            className="flex-1 bg-slate-900 text-white hover:bg-slate-800 h-10 shadow-sm"
                            onClick={() => triggerNavigate('editor')}
                        >
                            Customize
                        </Button>
                        <Button variant="outline" size="icon" className="h-10 w-10">
                            <MoreHorizontal className="w-4 h-4 text-slate-500" />
                        </Button>
                     </div>
                </div>
             </div>
        </div>
      </div>

      <div className="pt-8 border-t">
          <h3 className="font-semibold text-lg mb-4">Theme Library</h3>
          <div className="grid md:grid-cols-3 gap-6">
               {[1, 2, 3].map((i) => (
                   <div key={i} className="group cursor-pointer">
                       <div className="aspect-[16/10] bg-slate-100 rounded-lg border overflow-hidden relative mb-3">
                           <div className="absolute inset-0 bg-slate-200 animate-pulse" />
                           <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors" />
                       </div>
                       <div className="flex items-center justify-between">
                           <h4 className="font-medium">Theme Variant {i}</h4>
                           <Button variant="ghost" size="sm">Preview</Button>
                       </div>
                   </div>
               ))}
          </div>
      </div>
    </div>
  )
}
