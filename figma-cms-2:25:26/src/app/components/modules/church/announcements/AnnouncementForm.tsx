"use client";

import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Button } from "@/app/components/ui/button"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/app/components/ui/form"
import { Input } from "@/app/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/app/components/ui/select"
import { Calendar } from "@/app/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/app/components/ui/popover"
import { Badge } from "@/app/components/ui/badge"
import { RichTextEditor } from "@/app/components/ui/rich-text-editor"
import { Switch } from "@/app/components/ui/switch"
import { Separator } from "@/app/components/ui/separator"
import { Checkbox } from "@/app/components/ui/checkbox"
import { 
    CalendarIcon, 
    Loader2, 
    UploadCloud, 
    FileText,
    Link as LinkIcon,
    X,
    Paperclip
} from "lucide-react"
import { format } from "date-fns"
import { useState } from "react"
import { cn } from "@/app/components/ui/utils"
import { mockAnnouncements } from "./data"

const announcementSchema = z.object({
  title: z.string().min(2, "Title is required."),
  category: z.enum(["general", "urgent", "news", "event"]),
  ministry: z.string().min(1, "Ministry is required."),
  
  publishDate: z.date(),
  publishTime: z.string(),
  
  status: z.enum(["draft", "scheduled", "published", "archived"]),
  
  content: z.string().min(10, "Content must be at least 10 characters."),
  
  author: z.string().min(2),
  showAuthor: z.boolean().default(true),
  isPinned: z.boolean().default(false),
  
  attachmentUrls: z.array(z.string()).optional(),
})

type AnnouncementFormValues = z.infer<typeof announcementSchema>

const defaultValues: AnnouncementFormValues = {
  title: "",
  category: "general",
  ministry: "Church Wide",
  publishDate: new Date(),
  publishTime: "09:00",
  status: "draft",
  content: "",
  author: "Admin",
  showAuthor: true,
  isPinned: false,
  attachmentUrls: [],
}

interface AnnouncementFormProps {
  mode: "create" | "edit"
  id: string | null
  onCancel: () => void
  onSave: () => void
}

export function AnnouncementForm({ mode, id, onCancel, onSave }: AnnouncementFormProps) {
  const [isSaving, setIsSaving] = useState(false)
  
  const initialData = mode === "edit" && id 
      ? mockAnnouncements.find(e => e.id === id) 
      : null;

  const form = useForm<AnnouncementFormValues>({
    resolver: zodResolver(announcementSchema),
    defaultValues: initialData ? {
        ...initialData,
        publishTime: format(initialData.publishDate, "HH:mm"),
        ministry: initialData.ministry,
    } : defaultValues,
  })

  function onSubmit(data: AnnouncementFormValues) {
    setIsSaving(true)
    setTimeout(() => {
      console.log(data)
      setIsSaving(false)
      onSave()
    }, 1000)
  }

  const handleImport = (source: 'docx' | 'google') => {
      form.setValue("content", "<h2>Imported Content</h2><p>This content was simulated as imported from " + (source === 'docx' ? "a Word Document" : "Google Docs") + ".</p>");
  }

  return (
    <div className="space-y-6">
       <div className="flex items-center justify-between">
         <div className="flex flex-col gap-1">
            <h2 className="text-xl font-semibold">
            {mode === "create" ? "New Announcement" : "Edit Announcement"}
            </h2>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Badge variant={form.watch("status") === "published" ? "default" : "secondary"}>
                    {form.watch("status")}
                </Badge>
                {form.formState.isDirty && <span>- Unsaved changes</span>}
            </div>
        </div>
        <div className="flex gap-2">
            <Button variant="outline" onClick={onCancel}>Cancel</Button>
            <Button onClick={form.handleSubmit(onSubmit)} disabled={isSaving}>
                {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {form.watch("status") === 'published' ? 'Update & Publish' : 'Save Draft'}
            </Button>
        </div>
      </div>
      <Separator />

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
                 {/* Main Column */}
                 <div className="lg:col-span-2 space-y-6">
                    
                    {/* Title with Label */}
                    <FormField
                        control={form.control}
                        name="title"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Title</FormLabel>
                                <FormControl>
                                    <Input placeholder="Enter announcement title" className="text-lg font-medium" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    {/* Content Editor */}
                    <FormField
                        control={form.control}
                        name="content"
                        render={({ field }) => (
                            <FormItem>
                                <div className="flex items-center justify-between mb-2">
                                    <FormLabel>Content</FormLabel>
                                    <div className="flex items-center gap-2">
                                        <Button type="button" variant="ghost" size="sm" className="h-7 text-xs" onClick={() => handleImport('google')}>
                                            <FileText className="mr-1 h-3 w-3" /> Import Google Doc
                                        </Button>
                                        <Button type="button" variant="ghost" size="sm" className="h-7 text-xs" onClick={() => handleImport('docx')}>
                                            <UploadCloud className="mr-1 h-3 w-3" /> Import .docx
                                        </Button>
                                    </div>
                                </div>
                                <FormControl>
                                    <RichTextEditor 
                                        value={field.value || ""} 
                                        onChange={field.onChange}
                                        placeholder="Write your announcement here..."
                                        className="min-h-[400px]"
                                    />
                                </FormControl>
                                <FormDescription>
                                    Drag and drop images directly into the editor.
                                </FormDescription>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    {/* Generic Attachments Section */}
                    <div className="rounded-lg border p-4 bg-muted/20">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-sm font-medium flex items-center gap-2">
                                <Paperclip className="h-4 w-4" />
                                Attachments
                            </h3>
                            <Button type="button" variant="outline" size="sm">
                                <UploadCloud className="mr-2 h-3 w-3" /> Add File or Link
                            </Button>
                        </div>
                        <div className="text-center py-6 border-2 border-dashed rounded-md text-muted-foreground text-sm bg-background/50">
                            No files attached yet.
                        </div>
                    </div>
                 </div>

                 {/* Sidebar Column */}
                 <div className="space-y-6">
                    {/* Publishing Card */}
                    <div className="rounded-lg border bg-card text-card-foreground shadow-sm p-6 space-y-4">
                        <h3 className="font-semibold leading-none tracking-tight">Publishing</h3>
                        
                        <FormField
                            control={form.control}
                            name="status"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Status</FormLabel>
                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                        <FormControl>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select status" />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            <SelectItem value="draft">Draft</SelectItem>
                                            <SelectItem value="published">Published</SelectItem>
                                            <SelectItem value="scheduled">Scheduled</SelectItem>
                                            <SelectItem value="archived">Archived</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </FormItem>
                            )}
                        />
                        
                        <div className="space-y-2">
                             <FormLabel>Publish Date & Time</FormLabel>
                             <div className="flex flex-col gap-2">
                                <FormField
                                    control={form.control}
                                    name="publishDate"
                                    render={({ field }) => (
                                        <Popover>
                                            <PopoverTrigger asChild>
                                                <Button
                                                    variant={"outline"}
                                                    className={cn(
                                                        "justify-start text-left font-normal w-full",
                                                        !field.value && "text-muted-foreground"
                                                    )}
                                                >
                                                    <CalendarIcon className="mr-2 h-4 w-4" />
                                                    {field.value ? (
                                                        format(field.value, "PPP")
                                                    ) : (
                                                        <span>Pick a date</span>
                                                    )}
                                                </Button>
                                            </PopoverTrigger>
                                            <PopoverContent className="w-auto p-0" align="start">
                                                <Calendar
                                                    mode="single"
                                                    selected={field.value}
                                                    onSelect={field.onChange}
                                                    initialFocus
                                                />
                                            </PopoverContent>
                                        </Popover>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="publishTime"
                                    render={({ field }) => (
                                        <Input type="time" {...field} />
                                    )}
                                />
                             </div>
                        </div>

                         <FormField
                            control={form.control}
                            name="isPinned"
                            render={({ field }) => (
                                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                                    <div className="space-y-0.5">
                                        <FormLabel className="text-sm">Pin to top</FormLabel>
                                    </div>
                                    <FormControl>
                                        <Switch
                                            checked={field.value}
                                            onCheckedChange={field.onChange}
                                        />
                                    </FormControl>
                                </FormItem>
                            )}
                        />
                    </div>

                    {/* Metadata Card */}
                    <div className="rounded-lg border bg-card text-card-foreground shadow-sm p-6 space-y-4">
                         <h3 className="font-semibold leading-none tracking-tight">Organization</h3>
                         
                         <FormField
                            control={form.control}
                            name="category"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Category</FormLabel>
                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                        <FormControl>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select category" />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            <SelectItem value="general">General</SelectItem>
                                            <SelectItem value="urgent">Urgent</SelectItem>
                                            <SelectItem value="news">News</SelectItem>
                                            <SelectItem value="event">Event</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </FormItem>
                            )}
                        />

                        {/* Replaced Target Audience with Ministry */}
                         <FormField
                            control={form.control}
                            name="ministry"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Ministry</FormLabel>
                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                        <FormControl>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select ministry" />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            <SelectItem value="Church Wide">Church Wide</SelectItem>
                                            <SelectItem value="Worship">Worship</SelectItem>
                                            <SelectItem value="Youth">Youth</SelectItem>
                                            <SelectItem value="Kids">Kids</SelectItem>
                                            <SelectItem value="Outreach">Outreach</SelectItem>
                                            <SelectItem value="Finance">Finance</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </FormItem>
                            )}
                        />

                        <div className="pt-2">
                            <FormField
                                control={form.control}
                                name="author"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Author / Posted By</FormLabel>
                                        <FormControl>
                                            <Input placeholder="Name..." {...field} />
                                        </FormControl>
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="showAuthor"
                                render={({ field }) => (
                                    <FormItem className="flex flex-row items-start space-x-3 space-y-0 mt-2">
                                        <FormControl>
                                            <Checkbox
                                                checked={field.value}
                                                onCheckedChange={field.onChange}
                                            />
                                        </FormControl>
                                        <div className="space-y-1 leading-none">
                                            <FormLabel>
                                                Show publicly
                                            </FormLabel>
                                        </div>
                                    </FormItem>
                                )}
                            />
                        </div>
                    </div>
                 </div>
            </div>
        </form>
      </Form>
    </div>
  )
}
