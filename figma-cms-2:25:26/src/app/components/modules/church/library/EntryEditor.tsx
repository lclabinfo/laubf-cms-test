"use client";

import { useForm, useFieldArray } from "react-hook-form"
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
import { Textarea } from "@/app/components/ui/textarea"
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
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from "@/app/components/ui/command"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/app/components/ui/tabs"
import { Separator } from "@/app/components/ui/separator"
import { Badge } from "@/app/components/ui/badge"
import { 
    CalendarIcon, 
    Loader2, 
    Youtube, 
    ArrowLeft,
    BookOpen,
    Download,
    FileText as FileIcon,
    HardDrive,
    Video,
    Check,
    ChevronsUpDown,
    X
} from "lucide-react"
import { format } from "date-fns"
import { useState } from "react"
import { cn } from "@/app/components/ui/utils"
import { toast } from "sonner"
import { type Entry, type StudyTab, mockSeries } from "@/app/data/store"
import { SermonTranscript } from "../sermons/SermonTranscript"
import { RichTextEditor } from "@/app/components/ui/rich-text-editor"
import { AttachmentsList } from "./AttachmentsList"

const entrySchema = z.object({
  title: z.string().min(2, "Title is required"),
  date: z.date(),
  speaker: z.string().min(2, "Speaker is required"),
  seriesIds: z.array(z.string()).default([]),
  passage: z.string().optional(),
  
  // Universal Status
  status: z.enum(["published", "draft", "scheduled", "archived"]),
  
  // Sermon
  videoUrl: z.string().optional(),
  description: z.string().optional(),
  transcript: z.string().optional(),
  thumbnailMethod: z.enum(["youtube", "upload", "ai"]).default("youtube"),
  
  // Study
  studyTabs: z.array(z.object({
      id: z.string(),
      title: z.string(),
      content: z.string()
  })),
  attachments: z.array(z.object({
      name: z.string(),
      size: z.string(),
      type: z.string()
  })).optional(),
})

type EntryFormValues = z.infer<typeof entrySchema>

// Helper to ensure we only have Questions and Answers
function normalizeStudyTabs(tabs?: StudyTab[]) {
    const defaultTabs = [
        { id: "t1", title: "Questions", content: "" },
        { id: "t2", title: "Answers", content: "" }
    ];

    if (!tabs || tabs.length === 0) return defaultTabs;

    const questionsContent = tabs.find(t => t.title === "Questions")?.content || "";
    const answersContent = tabs.find(t => t.title === "Answers")?.content || "";

    return [
        { id: "t1", title: "Questions", content: questionsContent },
        { id: "t2", title: "Answers", content: answersContent }
    ];
}

const defaultValues: EntryFormValues = {
  title: "",
  date: new Date(),
  speaker: "",
  seriesIds: [],
  passage: "",
  status: "draft",
  videoUrl: "",
  description: "",
  transcript: "",
  thumbnailMethod: "youtube",
  studyTabs: normalizeStudyTabs([]),
  attachments: [],
}

interface EntryEditorProps {
  entry?: Entry
  onCancel: () => void
  onSave: (data: EntryFormValues) => void
}

function getYouTubeId(url?: string) {
    if (!url) return null;
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
}

export function EntryEditor({ entry, onCancel, onSave }: EntryEditorProps) {
  const [isSaving, setIsSaving] = useState(false)
  const [activeTab, setActiveTab] = useState("sermon")
  
  const form = useForm<EntryFormValues>({
    resolver: zodResolver(entrySchema),
    defaultValues: entry ? {
        title: entry.title,
        date: new Date(entry.date),
        speaker: entry.speaker,
        seriesIds: entry.seriesIds || [],
        passage: entry.passage,
        status: entry.status,
        videoUrl: entry.videoUrl || "",
        description: entry.description || "",
        transcript: entry.transcript || "",
        thumbnailMethod: entry.thumbnailMethod || "youtube",
        studyTabs: normalizeStudyTabs(entry.studyTabs),
        attachments: entry.attachments || []
    } : defaultValues,
  })

  // Set active study tab to "Questions" by default
  const [activeStudyTab, setActiveStudyTab] = useState("Questions");

  const { fields: attachmentFields, append: appendAttachment, remove: removeAttachment } = useFieldArray({
    control: form.control,
    name: "attachments",
  })

  const { fields: studyTabFields, update: updateStudyTab } = useFieldArray({
      control: form.control,
      name: "studyTabs"
  })

  function onSubmit(data: EntryFormValues) {
    setIsSaving(true)
    setTimeout(() => {
      onSave(data)
      setIsSaving(false)
    }, 1000)
  }

  const videoUrl = form.watch("videoUrl");
  const videoId = getYouTubeId(videoUrl);

  const handleImportFromYouTube = () => {
    if (!videoId) return;
    
    const promise = new Promise((resolve) => setTimeout(resolve, 1500));
    
    toast.promise(promise, {
        loading: 'Importing captions and metadata from YouTube...',
        success: () => {
            form.setValue("description", "Join us for this powerful sermon on faith and resilience...");
            form.setValue("transcript", "00:00:01,000 --> 00:00:05,000\nWelcome everyone...");
            return 'Successfully imported captions and metadata';
        },
        error: 'Failed to import from YouTube',
    });
  }

  const handleImportContent = (index: number, source: "docx" | "drive") => {
      const promise = new Promise((resolve) => setTimeout(resolve, 2000));
      const fileName = source === "docx" ? "Study_Notes_Draft.docx" : "Google_Drive_Import_v2.gdoc";
      
      toast.promise(promise, {
          loading: `Importing from ${source === 'docx' ? 'DOCX' : 'Google Drive'}...`,
          success: () => {
              const mockContent = `<h2>Imported Content: ${fileName}</h2><p>Here are the key points...</p>`;
              const currentTab = form.getValues(`studyTabs.${index}`);
              updateStudyTab(index, { ...currentTab, content: mockContent });
              appendAttachment({ name: fileName, size: "1.2 MB", type: source === "docx" ? "docx" : "gdoc" });
              return 'Content imported and file attached successfully';
          },
          error: 'Import failed'
      });
  }

  return (
    <div className="flex flex-col min-h-[calc(100vh-140px)] space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
         <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={onCancel} className="-ml-2">
                <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="flex flex-col gap-1">
                <h2 className="text-xl font-semibold leading-none">
                    {entry ? "Edit Message" : "New Message"}
                </h2>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <span>Manage video and study materials</span>
                </div>
            </div>
        </div>
        <div className="flex gap-2">
            <Button variant="outline" onClick={onCancel}>Cancel</Button>
            <Button onClick={form.handleSubmit(onSubmit)} disabled={isSaving}>
                {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save Changes
            </Button>
        </div>
      </div>
      
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col lg:flex-row gap-8">
            
            {/* Main Content Area */}
            <div className="flex-1 space-y-6">
                 {/* Title Input (Standardized) */}
                 <div className="bg-card border rounded-lg p-6">
                     <FormField
                        control={form.control}
                        name="title"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Message Title</FormLabel>
                                <FormControl>
                                    <Input 
                                        placeholder="e.g. Walking in Faith" 
                                        {...field} 
                                    />
                                </FormControl>
                                <FormDescription>
                                    The main title for this video and study entry.
                                </FormDescription>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>

                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                    <TabsList className="grid w-full grid-cols-2 lg:w-[400px] mb-6">
                        <TabsTrigger value="sermon" className="gap-2">
                            <Video className="h-4 w-4" />
                            Video
                        </TabsTrigger>
                        <TabsTrigger value="study" className="gap-2">
                            <BookOpen className="h-4 w-4" />
                            Bible Study
                        </TabsTrigger>
                    </TabsList>

                    {/* SERMON TAB */}
                    <TabsContent value="sermon" className="space-y-6">
                        <div className="bg-card border rounded-lg p-6 space-y-6">
                             <div className="flex items-center justify-between">
                                <h3 className="font-semibold flex items-center gap-2">
                                    <Video className="h-5 w-5 text-primary" />
                                    Video Details
                                </h3>
                             </div>
                             <Separator />
                             
                             <div className="grid gap-6">
                                <FormField
                                    control={form.control}
                                    name="videoUrl"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>YouTube Video URL</FormLabel>
                                            <div className="flex gap-2">
                                                <FormControl>
                                                    <Input placeholder="https://youtube.com/watch?v=..." {...field} />
                                                </FormControl>
                                                <Button type="button" variant="outline" size="icon" title="Check">
                                                    <Youtube className="h-4 w-4" />
                                                </Button>
                                            </div>
                                            <FormDescription>
                                                Paste a YouTube link to attach the video.
                                            </FormDescription>
                                        </FormItem>
                                    )}
                                />
                                
                                {videoId && (
                                    <div className="aspect-video bg-black rounded-md overflow-hidden">
                                        <iframe 
                                            width="100%" 
                                            height="100%" 
                                            src={`https://www.youtube.com/embed/${videoId}`} 
                                            allowFullScreen
                                            className="w-full h-full"
                                        />
                                    </div>
                                )}

                                {videoId && (
                                    <Button 
                                        type="button" 
                                        variant="secondary" 
                                        className="w-full gap-2"
                                        onClick={handleImportFromYouTube}
                                    >
                                        <Download className="h-4 w-4" />
                                        Import captions from YouTube
                                    </Button>
                                )}

                                <FormField
                                    control={form.control}
                                    name="description"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Description</FormLabel>
                                            <FormControl>
                                                <Textarea placeholder="Video description..." className="min-h-[100px]" {...field} />
                                            </FormControl>
                                        </FormItem>
                                    )}
                                />
                                
                                <div>
                                    <FormLabel className="mb-2 block">Transcript</FormLabel>
                                    <SermonTranscript 
                                        videoId={videoId}
                                        initialTranscript={form.getValues("transcript")}
                                        onChange={(val) => form.setValue("transcript", val)}
                                    />
                                </div>
                             </div>
                        </div>
                    </TabsContent>

                    {/* STUDY TAB */}
                    <TabsContent value="study" className="space-y-6">
                        <div className="bg-card border rounded-lg p-6 space-y-6">
                             <div className="flex items-center justify-between">
                                <h3 className="font-semibold flex items-center gap-2">
                                    <BookOpen className="h-5 w-5 text-primary" />
                                    Study Material
                                </h3>
                             </div>
                             <Separator />

                             <Tabs value={activeStudyTab} onValueChange={setActiveStudyTab} className="w-full">
                                <TabsList className="grid w-full grid-cols-2 mb-6">
                                    {studyTabFields.map((tab) => (
                                        <TabsTrigger key={tab.id} value={tab.title}>
                                            {tab.title}
                                        </TabsTrigger>
                                    ))}
                                </TabsList>
                                
                                {studyTabFields.map((tab, index) => (
                                    <TabsContent key={tab.id} value={tab.title} className="space-y-4 mt-0">
                                        <div className="flex justify-end gap-2 mb-2">
                                            <Button variant="outline" size="sm" onClick={() => handleImportContent(index, "docx")}>
                                                <FileIcon className="mr-2 h-4 w-4" />
                                                Import DOCX
                                            </Button>
                                            <Button variant="outline" size="sm" onClick={() => handleImportContent(index, "drive")}>
                                                <HardDrive className="mr-2 h-4 w-4" />
                                                Google Drive
                                            </Button>
                                        </div>
                                        <FormField
                                            control={form.control}
                                            name={`studyTabs.${index}.content`}
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormControl>
                                                        <RichTextEditor 
                                                            value={field.value} 
                                                            onChange={field.onChange}
                                                            placeholder={`Write ${tab.title.toLowerCase()} content...`}
                                                        />
                                                    </FormControl>
                                                </FormItem>
                                            )}
                                        />
                                    </TabsContent>
                                ))}
                             </Tabs>
                        </div>
                    </TabsContent>
                </Tabs>
            </div>

            {/* Sidebar Metadata */}
            <div className="w-full lg:w-[320px] shrink-0 space-y-6">
                <div className="bg-card border rounded-lg p-5 space-y-6">
                    <h3 className="font-semibold text-sm uppercase tracking-wider text-muted-foreground">Metadata</h3>
                    
                    {/* Status moved here */}
                    <FormField
                        control={form.control}
                        name="status"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Status</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                    <FormControl>
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        <SelectItem value="draft">Draft</SelectItem>
                                        <SelectItem value="published">Published</SelectItem>
                                        <SelectItem value="scheduled">Scheduled</SelectItem>
                                        <SelectItem value="archived">Archived</SelectItem>
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="date"
                        render={({ field }) => (
                            <FormItem className="flex flex-col">
                                <FormLabel>Date</FormLabel>
                                <Popover>
                                    <PopoverTrigger asChild>
                                        <FormControl>
                                            <Button
                                                variant={"outline"}
                                                className={cn(
                                                    "pl-3 text-left font-normal",
                                                    !field.value && "text-muted-foreground"
                                                )}
                                            >
                                                {field.value ? (
                                                    format(field.value, "PPP")
                                                ) : (
                                                    <span>Pick a date</span>
                                                )}
                                                <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                            </Button>
                                        </FormControl>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-auto p-0" align="start">
                                        <Calendar
                                            mode="single"
                                            selected={field.value}
                                            onSelect={field.onChange}
                                            disabled={(date) =>
                                                date < new Date("1900-01-01")
                                            }
                                            initialFocus
                                        />
                                    </PopoverContent>
                                </Popover>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    
                    <FormField
                        control={form.control}
                        name="speaker"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Speaker</FormLabel>
                                <FormControl>
                                    <Input placeholder="Pastor Name" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    {/* Series Multi-Select */}
                    <FormField
                        control={form.control}
                        name="seriesIds"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Series</FormLabel>
                                <Popover>
                                    <PopoverTrigger asChild>
                                        <FormControl>
                                            <Button
                                                variant="outline"
                                                role="combobox"
                                                className={cn(
                                                    "w-full justify-between h-auto min-h-[40px] px-3 py-2",
                                                    !field.value?.length && "text-muted-foreground"
                                                )}
                                            >
                                                {field.value?.length > 0 ? (
                                                    <div className="flex flex-wrap gap-1">
                                                        {field.value.map((seriesId) => {
                                                            const series = mockSeries.find(s => s.id === seriesId);
                                                            return series ? (
                                                                <Badge key={seriesId} variant="secondary" className="mr-1">
                                                                    {series.name}
                                                                </Badge>
                                                            ) : null;
                                                        })}
                                                    </div>
                                                ) : (
                                                    "Select series"
                                                )}
                                                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                            </Button>
                                        </FormControl>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-[300px] p-0">
                                        <Command>
                                            <CommandInput placeholder="Search series..." />
                                            <CommandList>
                                                <CommandEmpty>No series found.</CommandEmpty>
                                                <CommandGroup>
                                                    {mockSeries.map((series) => {
                                                        const isSelected = field.value?.includes(series.id);
                                                        return (
                                                            <CommandItem
                                                                value={series.name}
                                                                key={series.id}
                                                                onSelect={() => {
                                                                    const newValue = isSelected
                                                                        ? field.value.filter((id) => id !== series.id)
                                                                        : [...(field.value || []), series.id];
                                                                    field.onChange(newValue);
                                                                }}
                                                            >
                                                                <Check
                                                                    className={cn(
                                                                        "mr-2 h-4 w-4",
                                                                        isSelected ? "opacity-100" : "opacity-0"
                                                                    )}
                                                                />
                                                                {series.name}
                                                            </CommandItem>
                                                        )
                                                    })}
                                                </CommandGroup>
                                            </CommandList>
                                        </Command>
                                    </PopoverContent>
                                </Popover>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="passage"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Passage</FormLabel>
                                <FormControl>
                                    <Input placeholder="e.g. John 3:16" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <Separator />

                    <div>
                        <h4 className="font-medium mb-4 flex items-center gap-2">
                            <FileIcon className="h-4 w-4 text-muted-foreground" />
                            Attachments
                        </h4>
                        <AttachmentsList 
                            attachments={attachmentFields}
                            onAdd={(file) => appendAttachment(file)}
                            onRemove={(index) => removeAttachment(index)}
                        />
                    </div>
                </div>
            </div>
        </form>
      </Form>
    </div>
  )
}
