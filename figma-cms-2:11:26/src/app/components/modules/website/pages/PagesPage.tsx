"use client";

import { useState } from "react"
import { Button } from "@/app/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/app/components/ui/table"
import { Badge } from "@/app/components/ui/badge"
import { Input } from "@/app/components/ui/input"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/app/components/ui/dropdown-menu"
import { MoreHorizontal, Search, Plus, Edit, Copy, Eye, FileText } from "lucide-react"
import { Builder } from "./Builder"

interface WebsitePage {
    id: string;
    title: string;
    slug: string;
    status: 'published' | 'draft';
    type: 'template' | 'custom';
    templateName?: string;
    lastModified: string;
}

const mockPages: WebsitePage[] = [
    { id: '1', title: 'Home', slug: '/', status: 'published', type: 'template', templateName: 'Home Standard', lastModified: '2 days ago' },
    { id: '2', title: 'About Us', slug: '/about', status: 'published', type: 'template', templateName: 'Simple Content', lastModified: '1 week ago' },
    { id: '3', title: 'Ministries', slug: '/ministries', status: 'published', type: 'template', templateName: 'Ministry Index', lastModified: '3 days ago' },
    { id: '4', title: 'LBCC Campus', slug: '/ministries/lbcc', status: 'published', type: 'template', templateName: 'Ministry Page', lastModified: '2 hours ago' },
    { id: '5', title: 'Easter 2024', slug: '/events/easter', status: 'draft', type: 'custom', lastModified: '5 hours ago' },
];

export function PagesPage() {
  const [view, setView] = useState<'list' | 'builder'>('list');
  const [selectedPageId, setSelectedPageId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  const handleEdit = (id: string) => {
      setSelectedPageId(id);
      setView('builder');
  };

  const handleBack = () => {
      setSelectedPageId(null);
      setView('list');
  };

  const filteredPages = mockPages.filter(p => p.title.toLowerCase().includes(searchTerm.toLowerCase()));

  if (view === 'builder' && selectedPageId) {
      const page = mockPages.find(p => p.id === selectedPageId);
      return <Builder page={page!} onBack={handleBack} />;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Pages</h2>
          <p className="text-muted-foreground">Manage your website's pages and content.</p>
        </div>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          New Page
        </Button>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
                placeholder="Search pages..."
                className="pl-8"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
            />
        </div>
      </div>

      <div className="rounded-md border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[40%]">Page Title</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Last Modified</TableHead>
              <TableHead className="w-[50px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredPages.map((page) => (
              <TableRow 
                key={page.id} 
                className="cursor-pointer hover:bg-muted/50"
                onClick={() => handleEdit(page.id)}
              >
                <TableCell>
                  <div className="flex flex-col">
                    <span className="font-medium">{page.title}</span>
                    <span className="text-xs text-muted-foreground">{page.slug}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant={page.status === 'published' ? 'default' : 'secondary'} className="capitalize">
                    {page.status}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="capitalize font-normal text-xs">
                        {page.type}
                    </Badge>
                    {page.templateName && (
                        <span className="text-xs text-muted-foreground">{page.templateName}</span>
                    )}
                  </div>
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                    {page.lastModified}
                </TableCell>
                <TableCell onClick={(e) => e.stopPropagation()}>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="h-8 w-8 p-0">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => handleEdit(page.id)}>
                        <Edit className="mr-2 h-4 w-4" />
                        Edit Page
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        <Eye className="mr-2 h-4 w-4" />
                        Preview
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        <Copy className="mr-2 h-4 w-4" />
                        Duplicate
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem className="text-destructive">
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
