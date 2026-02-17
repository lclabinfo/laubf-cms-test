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
import { Textarea } from "@/app/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/app/components/ui/select"
import { Calendar } from "@/app/components/ui/calendar"
import { Label } from "@/app/components/ui/label"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/app/components/ui/popover"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/app/components/ui/alert-dialog"
import { cn } from "@/app/components/ui/utils"
import { 
    CalendarIcon, 
    Loader2, 
    Youtube, 
    Upload, 
    Wand2, 
    FileText, 
    Link as LinkIcon, 
    Image as ImageIcon,
    Copy,
    ExternalLink,
    MoreVertical,
    CheckCircle2,
    ArrowLeft
} from "lucide-react"
import { format } from "date-fns"
import { useState, useEffect } from "react"
import { Separator } from "@/app/components/ui/separator"
import { Badge } from "@/app/components/ui/badge"
import { Switch } from "@/app/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/app/components/ui/tabs"
import { SermonTranscript } from "./SermonTranscript"
import { useSidebar } from "@/app/components/ui/sidebar"
import { mockSermons } from "@/app/data/store"

const sermonSchema = z.object({
  title: z.string().min(2, "Title must be at least 2 characters."),
  videoUrl: z.string().url("Please enter a valid URL.").optional().or(z.literal("")),
  speaker: z.string().min(2, "Speaker name is required."),
  date: z.date({
    required_error: "A date of sermon is required.",
  }),
  passage: z.string().optional(),
  series: z.string().optional(),
  tags: z.string().optional(),
  description: z.string().optional(),
  status: z.enum(["draft", "published", "scheduled", "hidden"]),
  featured: z.boolean().default(false),
  transcript: z.string().optional(),
  bibleStudyId: z.string().optional(),
  thumbnailMethod: z.enum(["youtube", "upload", "ai"]).default("youtube"),
})

type SermonFormValues = z.infer<typeof sermonSchema>

// Mock default values for edit mode
const defaultValues: SermonFormValues = {
  title: "",
  videoUrl: "",
  speaker: "",
  date: new Date(),
  passage: "",
  series: "",
  tags: "",
  description: "",
  status: "draft",
  featured: false,
  transcript: "",
  bibleStudyId: "",
  thumbnailMethod: "youtube",
}

interface SermonFormProps {
  sermonId: string | null
  initialVideoUrl?: string
  onCancel: () => void
  onSave: () => void
}

function getYouTubeId(url: string) {
    if (!url) return null;
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
}

export function SermonForm({ sermonId, initialVideoUrl, onCancel, onSave }: SermonFormProps) {
  const [isSaving, setIsSaving] = useState(false)
  const [showExitWarning, setShowExitWarning] = useState(false)
  const { setOpen } = useSidebar()
  
  // Collapse sidebar on mount
  useEffect(() => {
    setOpen(false)
  }, [setOpen])
  
  // If we have an initial video URL (from the create dialog), use it to pre-fill content
  const isNewImport = sermonId === "new-draft" && !!initialVideoUrl;
  
  // Find sermon in store
  const foundSermon = sermonId && !isNewImport ? mockSermons.find(s => s.id === sermonId) : null;
  
  const form = useForm<SermonFormValues>({
    resolver: zodResolver(sermonSchema),
    defaultValues: isNewImport ? {
        ...defaultValues,
        title: "Imported: Sermon Title from YouTube",
        videoUrl: initialVideoUrl,
        speaker: "Pastor John Doe", // Mock default
        description: "This is the description imported automatically from the YouTube video. It contains all the links and details provided in the video description.",
        status: "draft",
    } : foundSermon ? {
        title: foundSermon.title,
        speaker: foundSermon.speaker,
        date: new Date(foundSermon.date),
        passage: foundSermon.passage,
        series: foundSermon.series,
        status: foundSermon.status,
        videoUrl: foundSermon.videoUrl || "",
        description: foundSermon.description || "",
        featured: foundSermon.featured,
        transcript: foundSermon.transcript || "",
        tags: "", // Not in store yet
        bibleStudyId: "", // Not in store yet
        thumbnailMethod: "youtube"
    } : defaultValues,
  })

  function onSubmit(data: SermonFormValues) {
    setIsSaving(true)
    // Simulate API call
    setTimeout(() => {
      console.log(data)
      setIsSaving(false)
      onSave()
    }, 1000)
  }

  const handleAIGenerateThumbnail = () => {
      alert("AI is generating a thumbnail based on the sermon title and passage...");
  }
  
  const handleCancel = () => {
      if (form.formState.isDirty) {
          setShowExitWarning(true);
      } else {
          onCancel();
      }
  }

  const handleCopyUrl = () => {
      const url = form.watch("videoUrl");
      if (!url) return;

      const copyToClipboardFallback = (text: string) => {
          try {
              const textArea = document.createElement("textarea");
              textArea.value = text;
              textArea.style.position = "fixed";
              textArea.style.opacity = "0";
              document.body.appendChild(textArea);
              textArea.focus();
              textArea.select();
              document.execCommand('copy');
              document.body.removeChild(textArea);
          } catch (err) {
              console.error('Fallback copy failed', err);
          }
      };

      if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(url).catch((err) => {
              console.warn("Clipboard API failed, using fallback", err);
              copyToClipboardFallback(url);
          });
      } else {
          copyToClipboardFallback(url);
      }
  }
  
  const videoUrl = form.watch("videoUrl") || "";
  const videoId = getYouTubeId(videoUrl);

  return (
    <div className="flex flex-col min-h-[calc(100vh-140px)]">
      
      {/* Exit Warning Dialog */}
      <AlertDialog open={showExitWarning} onOpenChange={setShowExitWarning}>
        <AlertDialogContent>
            <AlertDialogHeader>
                <AlertDialogTitle>Unsaved changes</AlertDialogTitle>
                <AlertDialogDescription>
                    You have unsaved changes. Are you sure you want to leave? Your changes will be lost.
                </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={onCancel} className="bg-destructive hover:bg-destructive/90">
                    Discard changes
                </AlertDialogAction>
            </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Header */}
      <div className="flex items-center justify-between mb-6 shrink-0">
        <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={handleCancel} className="-ml-2">
                <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="flex flex-col gap-1">
                <h2 className="text-xl font-semibold leading-none">
                    {form.watch("title") || "Untitled Sermon"}
                </h2>
                <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs font-normal">
                        {form.watch("status") === "published" ? "Published" : "Draft"}
                    </Badge>
                    {form.formState.isDirty && (
                        <span className="text-[10px] text-muted-foreground italic">
                            Unsaved changes
                        </span>
                    )}
                </div>
            </div>
        </div>
        <div className="flex gap-2">
            <Button 
                variant="ghost" 
                onClick={() => {
                    form.reset();
                }} 
                disabled={!form.formState.isDirty}
            >
                Undo changes
            </Button>
            <Button onClick={form.handleSubmit(onSubmit)} disabled={isSaving}>
                {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save
            </Button>
            <Button variant="ghost" size="icon">
                <MoreVertical className="h-4 w-4" />
            </Button>
        </div>
      </div>
      
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col lg:flex-row gap-8 h-full">
            
            {/* Left Column - Main Content */}
            <div className="flex-1 pr-4">
                <Tabs defaultValue="details" className="w-full">
                    {/* Modern Floating Pill Tab Design */}
                    <TabsList className="mb-6 h-auto w-auto gap-2 bg-transparent p-0">
                        <TabsTrigger 
                            value="details"
                            className="rounded-full border border-transparent px-6 py-2.5 font-medium text-muted-foreground data-[state=active]:bg-foreground data-[state=active]:text-background data-[state=active]:shadow-sm hover:text-foreground transition-all"
                        >
                            Details
                        </TabsTrigger>
                        <TabsTrigger 
                            value="transcript"
                            className="rounded-full border border-transparent px-6 py-2.5 font-medium text-muted-foreground data-[state=active]:bg-foreground data-[state=active]:text-background data-[state=active]:shadow-sm hover:text-foreground transition-all"
                        >
                            Transcript
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value="details" className="space-y-8 pb-10 mt-0">
                        <FormField
                            control={form.control}
                            name="title"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="text-base font-semibold text-foreground">Title</FormLabel>
                                    <FormControl>
                                        <Input 
                                            placeholder="Add a title that describes your sermon" 
                                            className="bg-muted/50 border-transparent focus-visible:ring-0 focus-visible:bg-muted" 
                                            {...field} 
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="description"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="text-base">Description</FormLabel>
                                    <FormControl>
                                        <Textarea 
                                            placeholder="Tell viewers about your sermon" 
                                            className="resize-none min-h-[200px] text-base" 
                                            {...field} 
                                            value={field.value || ""}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        {/* Thumbnail Section */}
                        <div className="space-y-4">
                            <FormLabel className="text-base">Thumbnail</FormLabel>
                            <p className="text-sm text-muted-foreground -mt-2">
                                Select or upload a picture that shows what's in your sermon. A good thumbnail stands out and draws viewers' attention.
                            </p>
                            
                            <FormField
                                control={form.control}
                                name="thumbnailMethod"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormControl>
                                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                                <div 
                                                    className={cn(
                                                        "aspect-video border rounded-sm flex flex-col items-center justify-center gap-2 cursor-pointer hover:bg-muted/50 transition-colors",
                                                        field.value === "upload" && "ring-2 ring-primary border-primary"
                                                    )}
                                                    onClick={() => field.onChange("upload")}
                                                >
                                                    <div className="rounded-full bg-muted p-2">
                                                        <Upload className="h-4 w-4" />
                                                    </div>
                                                    <span className="text-xs font-medium">Upload file</span>
                                                </div>

                                                {/* Mock Auto-generated thumbnails from video */}
                                                <div 
                                                    className={cn(
                                                        "aspect-video border rounded-sm relative cursor-pointer overflow-hidden group",
                                                        field.value === "youtube" && "ring-2 ring-primary border-primary"
                                                    )}
                                                    onClick={() => field.onChange("youtube")}
                                                >
                                                    {videoId ? (
                                                        <img 
                                                            src={`https://img.youtube.com/vi/${videoId}/hqdefault.jpg`} 
                                                            alt="YouTube Thumbnail" 
                                                            className="w-full h-full object-cover"
                                                        />
                                                    ) : (
                                                        <div className="absolute inset-0 flex items-center justify-center bg-muted">
                                                            <Youtube className="h-8 w-8 text-muted-foreground" />
                                                        </div>
                                                    )}
                                                    <div className="absolute inset-x-0 bottom-0 bg-black/60 p-1 text-[10px] text-white text-center opacity-0 group-hover:opacity-100 transition-opacity">
                                                        YouTube Default
                                                    </div>
                                                </div>

                                                <div 
                                                    className={cn(
                                                        "aspect-video border rounded-sm flex flex-col items-center justify-center gap-2 cursor-pointer hover:bg-muted/50 transition-colors",
                                                        field.value === "ai" && "ring-2 ring-primary border-primary"
                                                    )}
                                                    onClick={() => {
                                                        field.onChange("ai")
                                                        handleAIGenerateThumbnail()
                                                    }}
                                                >
                                                    <div className="rounded-full bg-muted p-2">
                                                        <Wand2 className="h-4 w-4" />
                                                    </div>
                                                    <span className="text-xs font-medium">Auto-generated</span>
                                                </div>
                                            </div>
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <Separator />

                        {/* Metadata Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <FormField
                                control={form.control}
                                name="speaker"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Speaker</FormLabel>
                                        <FormControl>
                                            <Input placeholder="e.g. Pastor John" {...field} />
                                        </FormControl>
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="series"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Series / Playlist</FormLabel>
                                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select series" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                <SelectItem value="Faith Foundations">Faith Foundations</SelectItem>
                                                <SelectItem value="Easter 2024">Easter 2024</SelectItem>
                                                <SelectItem value="Guest Series">Guest Series</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="passage"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Scripture Passage</FormLabel>
                                        <FormControl>
                                            <Input placeholder="e.g. John 3:16" {...field} />
                                        </FormControl>
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="tags"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Tags</FormLabel>
                                        <FormControl>
                                            <Input placeholder="faith, prayer, grace" {...field} value={field.value || ""} />
                                        </FormControl>
                                    </FormItem>
                                )}
                            />

                            {/* Linked Resource */}
                            <FormField
                                control={form.control}
                                name="bibleStudyId"
                                render={({ field }) => (
                                    <FormItem className="col-span-1 md:col-span-2">
                                        <FormLabel>Link Bible Study Material</FormLabel>
                                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select a Bible Study to attach..." />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                <SelectItem value="bs-1">Study: Walking in Faith (Hebrews)</SelectItem>
                                                <SelectItem value="bs-2">Study: Understanding Prayer</SelectItem>
                                                <SelectItem value="bs-3">Study: The Book of Romans</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <FormDescription>
                                            This will display a link to the study material on the sermon page.
                                        </FormDescription>
                                    </FormItem>
                                )}
                            />
                        </div>
                    </TabsContent>

                    <TabsContent value="transcript" className="mt-0">
                         <SermonTranscript 
                            videoId={videoId}
                            initialTranscript={form.getValues("transcript")}
                            onChange={(val) => {
                                form.setValue("transcript", val, { shouldDirty: true });
                            }}
                         />
                    </TabsContent>
                </Tabs>
            </div>

            {/* Right Column - Sticky Video Preview & Settings */}
            <div className="w-full lg:w-[350px] shrink-0 space-y-6">
                
                {/* Video Card */}
                <div className="rounded-lg border bg-card text-card-foreground shadow-sm overflow-hidden sticky top-6">
                    {/* Video Player */}
                    <div className="aspect-video bg-black relative flex items-center justify-center group">
                        {videoId ? (
                            <iframe 
                                width="100%" 
                                height="100%" 
                                src={`https://www.youtube.com/embed/${videoId}`} 
                                title="YouTube video player" 
                                frameBorder="0" 
                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                                allowFullScreen
                                className="absolute inset-0"
                            ></iframe>
                        ) : (
                            <div className="text-white text-center">
                                <Youtube className="h-12 w-12 mx-auto mb-2 text-red-600" />
                                <span className="text-xs opacity-70">Video Preview</span>
                             </div>
                        )}
                    </div>
                    
                    <div className="p-4 space-y-4">
                        <div className="space-y-1.5">
                            <div className="text-xs font-medium text-muted-foreground">Video link</div>
                            <div className="flex items-center justify-between gap-2 p-2 bg-muted/50 rounded border text-xs text-blue-600 break-all">
                                <span className="truncate">{form.watch("videoUrl") || "https://..."}</span>
                                <Button type="button" variant="ghost" size="icon" className="h-6 w-6 shrink-0 text-muted-foreground" onClick={handleCopyUrl}>
                                    <Copy className="h-3 w-3" />
                                </Button>
                            </div>
                        </div>

                         <div className="space-y-1.5">
                            <div className="text-xs font-medium text-muted-foreground">Video quality</div>
                            <div className="flex gap-1">
                                <Badge variant="secondary" className="text-[10px] h-5 px-1 rounded-sm bg-blue-100 text-blue-700 hover:bg-blue-100 border-none">SD</Badge>
                                <Badge variant="secondary" className="text-[10px] h-5 px-1 rounded-sm bg-green-100 text-green-700 hover:bg-green-100 border-none">HD</Badge>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Visibility Card */}
                <div className="rounded-lg border bg-card text-card-foreground shadow-sm p-4 space-y-4 sticky top-[340px]">
                    <h3 className="font-semibold text-sm">Visibility</h3>
                    
                    <FormField
                        control={form.control}
                        name="status"
                        render={({ field }) => (
                            <FormItem>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                    <FormControl>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select visibility" />
                                        </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        <SelectItem value="draft">
                                            <div className="flex flex-col">
                                                <span>Private (Draft)</span>
                                                <span className="text-xs text-muted-foreground">Only you can see this</span>
                                            </div>
                                        </SelectItem>
                                        <SelectItem value="published">
                                             <div className="flex flex-col">
                                                <span>Public</span>
                                                <span className="text-xs text-muted-foreground">Visible to everyone</span>
                                            </div>
                                        </SelectItem>
                                        <SelectItem value="scheduled">
                                             <div className="flex flex-col">
                                                <span>Scheduled</span>
                                                <span className="text-xs text-muted-foreground">Public on a specific date</span>
                                            </div>
                                        </SelectItem>
                                        <SelectItem value="hidden">
                                             <div className="flex flex-col">
                                                <span>Hidden</span>
                                                <span className="text-xs text-muted-foreground">Unlisted / Archive</span>
                                            </div>
                                        </SelectItem>
                                    </SelectContent>
                                </Select>
                            </FormItem>
                        )}
                    />
                    
                    <FormField
                        control={form.control}
                        name="date"
                        render={({ field }) => (
                            <FormItem className="flex flex-col">
                                <FormLabel className="text-xs font-normal text-muted-foreground">Publish Date</FormLabel>
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

                    <div className="flex items-center justify-between pt-2">
                        <div className="space-y-0.5">
                            <Label className="text-sm">Feature Sermon</Label>
                            <p className="text-xs text-muted-foreground">Pin to top of list</p>
                        </div>
                         <FormField
                            control={form.control}
                            name="featured"
                            render={({ field }) => (
                                <FormItem>
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
                </div>
            </div>
        </form>
      </Form>
    </div>
  )
}
