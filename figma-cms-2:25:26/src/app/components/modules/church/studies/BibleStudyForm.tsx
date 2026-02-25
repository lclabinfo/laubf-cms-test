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
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/app/components/ui/tabs"
import { Badge } from "@/app/components/ui/badge"
import { Separator } from "@/app/components/ui/separator"
import { 
    Loader2, 
    UploadCloud, 
    FileText, 
    Link as LinkIcon, 
    Plus, 
    X,
    Image as ImageIcon,
    Youtube,
    File,
    RefreshCw,
    Check,
    Play
} from "lucide-react"
import { useState } from "react"
import { cn } from "@/app/components/ui/utils"
import { toast } from "sonner"
import { addSermon, type Sermon } from "@/app/data/store"

// Helper to extract YouTube ID
function getYouTubeID(url: string) {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
}

const studySchema = z.object({
  title: z.string().min(2, "Title is required."),
  passage: z.string().min(2, "Bible passage is required."),
  seriesId: z.string().optional(),
  
  // Sermon Linking
  sermonLinkType: z.enum(["existing", "new"]).default("existing"),
  linkedSermonId: z.string().optional(),
  createSermonUrl: z.string().optional(),
  
  // Content Sections
  guideContent: z.string().optional(),
  questionsContent: z.string().optional(),
  transcriptContent: z.string().optional(),
  
  // Custom Tabs
  customTabs: z.array(z.object({
      title: z.string(),
      content: z.string()
  })).optional(),

  // Attachments
  attachments: z.array(z.object({
      name: z.string(),
      size: z.string(),
      type: z.string()
  })).optional(),

  status: z.enum(["draft", "published", "archived"]),
})

export type StudyFormValues = z.infer<typeof studySchema>

const defaultValues: StudyFormValues = {
  title: "",
  passage: "",
  seriesId: "",
  sermonLinkType: "existing",
  linkedSermonId: "",
  createSermonUrl: "",
  guideContent: "",
  questionsContent: "",
  transcriptContent: "",
  customTabs: [],
  attachments: [],
  status: "draft",
}

interface BibleStudyFormProps {
  mode: "create" | "edit"
  studyId: string | null
  onCancel: () => void
  onSave: (data: StudyFormValues) => void
}

export function BibleStudyForm({ mode, studyId, onCancel, onSave }: BibleStudyFormProps) {
  const [isSaving, setIsSaving] = useState(false)
  const [activeEditorTab, setActiveEditorTab] = useState("questions") // Default to Questions
  const [isSyncingTranscript, setIsSyncingTranscript] = useState(false)
  const [previewVideoId, setPreviewVideoId] = useState<string | null>(null)

  const form = useForm<StudyFormValues>({
    resolver: zodResolver(studySchema),
    defaultValues: mode === "edit" ? {
        ...defaultValues,
        title: "Understanding Grace",
        passage: "Romans 3:21-26",
        status: "published",
        guideContent: "<h1>Introduction</h1><p>Grace is a central theme in Romans...</p>",
        questionsContent: "1. What does Paul mean by 'all have sinned'?",
        linkedSermonId: "sermon1",
        sermonLinkType: "existing",
        transcriptContent: "00:00 Welcome everyone to our service today...",
        attachments: [
            { name: "Original_Handout.pdf", size: "1.2 MB", type: "pdf" }
        ]
    } : defaultValues,
  })

  const { fields: customFields, append: appendCustom, remove: removeCustom } = useFieldArray({
    control: form.control,
    name: "customTabs",
  })

  const { fields: attachmentFields, append: appendAttachment, remove: removeAttachment } = useFieldArray({
    control: form.control,
    name: "attachments",
  })

  async function onSubmit(data: StudyFormValues) {
    // Validate youtube link if creating new
    if (data.sermonLinkType === "new" && data.createSermonUrl) {
        const id = getYouTubeID(data.createSermonUrl);
        if (!id) {
            form.setError("createSermonUrl", { message: "Please enter a valid YouTube URL" });
            toast.error("Invalid YouTube URL");
            return;
        }
    }

    setIsSaving(true)

    // Simulate Network Request / Processing
    if (data.sermonLinkType === "new" && data.createSermonUrl) {
        const toastId = toast.loading("Processing YouTube Video...", {
            description: "Importing metadata and generating transcript placeholder."
        });

        // Simulate 2s delay
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Create Mock Sermon
        const newSermon: Sermon = {
            id: Math.random().toString(36).substring(7),
            title: `Sermon: ${data.title}`,
            speaker: "Unknown Speaker", // User hasn't provided this, defaults
            date: new Date().toISOString(),
            passage: data.passage,
            series: data.seriesId === "s1" ? "Romans Series" : "Unknown Series",
            status: "draft",
            views: 0,
            featured: false,
            source: "youtube_playlist", // Mocking "imported"
            videoUrl: data.createSermonUrl,
            description: "Automatically created from Bible Study entry.",
            transcript: "00:00 [Generating transcript...]"
        };
        
        addSermon(newSermon);
        
        toast.dismiss(toastId);
        
        toast.success("Bible Study & Sermon Created", {
             description: "The sermon has been added to your library.",
             action: {
                 label: "View Sermon",
                 onClick: () => {
                     // Dispatch navigation event
                     window.dispatchEvent(new CustomEvent('navigate', { 
                         detail: { module: 'content', page: 'sermons', itemId: newSermon.id } 
                     }));
                 }
             },
             duration: 5000,
        });

    } else {
         await new Promise(resolve => setTimeout(resolve, 1000));
         toast.success("Bible Study Saved", {
             description: "Your changes have been saved successfully."
         });
    }

    setIsSaving(false)
    onSave(data)
  }

  const handleImport = (source: 'pdf' | 'docx' | 'google' | 'sermon') => {
      if (source === 'sermon') {
          setIsSyncingTranscript(true);
          setTimeout(() => {
              form.setValue('transcriptContent', "00:00 [Synced Transcript from 'Understanding Grace']\n\nPastor John: Welcome everyone. Today we are continuing our series in Romans. \n\n00:45 Let's turn to chapter 3. The main point I want to make today is about the nature of Grace...");
              setIsSyncingTranscript(false);
          }, 1000);
          return;
      }

      // Simulate other imports
      const currentContent = form.getValues(
          activeEditorTab === 'guide' ? 'guideContent' : 
          activeEditorTab === 'questions' ? 'questionsContent' : 'transcriptContent'
      );
      
      const importedText = "\n[Imported Document Content]\nSection 1...";
      
      const fieldName = activeEditorTab === 'guide' ? 'guideContent' : 
                        activeEditorTab === 'questions' ? 'questionsContent' : 'transcriptContent';
      
      form.setValue(fieldName, (currentContent || "") + importedText);
  }

  const handleFileUpload = () => {
      // Mock upload
      appendAttachment({
          name: "New_Upload.docx",
          size: "450 KB",
          type: "docx"
      })
  }

  const handlePreview = () => {
      const url = form.getValues("createSermonUrl");
      if (!url) return;
      
      const id = getYouTubeID(url);
      if (id) {
          setPreviewVideoId(id);
          toast.success("Video found!");
      } else {
          setPreviewVideoId(null);
          form.setError("createSermonUrl", { message: "Invalid YouTube URL" });
          toast.error("Invalid YouTube URL");
      }
  }
  
  const linkedSermonId = form.watch("linkedSermonId");
  const sermonLinkType = form.watch("sermonLinkType");
  const createSermonUrl = form.watch("createSermonUrl");

  return (
    <div className="space-y-6">
       <div className="flex items-center justify-between">
         <div className="flex flex-col gap-1">
            <h2 className="text-xl font-semibold">
            {mode === "create" ? "New Bible Study" : "Edit Bible Study"}
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
                Save Changes
            </Button>
        </div>
      </div>
      <Separator />

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
                 {/* Left Column: Editor */}
                 <div className="lg:col-span-2 space-y-6">
                    {/* Basic Info */}
                    <div className="grid gap-4">
                        <FormField
                            control={form.control}
                            name="title"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Title</FormLabel>
                                    <FormControl>
                                        <Input placeholder="e.g. Week 1: Introduction" className="text-lg" {...field} />
                                    </FormControl>
                                    <FormMessage />
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
                                        <Input placeholder="e.g. Romans 8:1-4" {...field} />
                                    </FormControl>
                                    <FormDescription>
                                        Automatically links to BibleGateway.
                                    </FormDescription>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </div>

                    {/* Content Editor */}
                    <div className="space-y-2">
                        <div className="flex items-center justify-between">
                            <FormLabel className="text-base">Content</FormLabel>
                            {activeEditorTab !== 'transcript' && (
                                <div className="flex items-center gap-2">
                                    <Button type="button" variant="outline" size="sm" onClick={() => handleImport('google')}>
                                        <FileText className="mr-2 h-3 w-3 text-blue-600" />
                                        Import Google Doc
                                    </Button>
                                    <Button type="button" variant="outline" size="sm" onClick={() => handleImport('pdf')}>
                                        <UploadCloud className="mr-2 h-3 w-3" />
                                        Import PDF/Doc
                                    </Button>
                                </div>
                            )}
                        </div>
                        
                        <Tabs value={activeEditorTab} onValueChange={setActiveEditorTab} className="w-full">
                            <TabsList className="w-full justify-start h-auto p-0 bg-transparent border-b rounded-none gap-4">
                                <TabsTrigger 
                                    value="questions"
                                    className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:shadow-none px-4 py-2"
                                >
                                    Questions
                                </TabsTrigger>
                                <TabsTrigger 
                                    value="guide" 
                                    className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:shadow-none px-4 py-2"
                                >
                                    Answers
                                </TabsTrigger>
                                <TabsTrigger 
                                    value="transcript"
                                    className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:shadow-none px-4 py-2"
                                >
                                    Transcript
                                </TabsTrigger>
                                {customFields.map((field, index) => (
                                    <TabsTrigger 
                                        key={field.id} 
                                        value={`custom-${index}`}
                                        className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:shadow-none px-4 py-2"
                                    >
                                        {field.title}
                                    </TabsTrigger>
                                ))}
                                <Button 
                                    type="button" 
                                    variant="ghost" 
                                    size="sm" 
                                    onClick={() => appendCustom({ title: "New Tab", content: "" })}
                                    className="ml-auto"
                                >
                                    <Plus className="h-4 w-4" />
                                </Button>
                            </TabsList>

                            <div className="mt-4 border rounded-md min-h-[400px] flex flex-col">
                                {activeEditorTab !== 'transcript' && (
                                    /* Toolbar Mock - Hidden for Transcript if it's read-only/synced? No, kept for minor edits */
                                    <div className="border-b p-2 flex gap-1 bg-muted/20">
                                        <Button type="button" variant="ghost" size="sm" className="h-8 w-8 p-0 font-bold">B</Button>
                                        <Button type="button" variant="ghost" size="sm" className="h-8 w-8 p-0 italic">I</Button>
                                        <Button type="button" variant="ghost" size="sm" className="h-8 w-8 p-0 underline">U</Button>
                                        <Separator orientation="vertical" className="h-6 mx-2" />
                                        <Button type="button" variant="ghost" size="sm" className="h-8 w-8 p-0">H1</Button>
                                        <Button type="button" variant="ghost" size="sm" className="h-8 w-8 p-0">H2</Button>
                                    </div>
                                )}
                                
                                <TabsContent value="questions" className="flex-1 m-0 p-0">
                                    <FormField
                                        control={form.control}
                                        name="questionsContent"
                                        render={({ field }) => (
                                            <Textarea 
                                                className="border-0 focus-visible:ring-0 resize-none h-full p-4 font-mono text-sm leading-relaxed" 
                                                placeholder="Write discussion questions here..."
                                                {...field}
                                            />
                                        )}
                                    />
                                </TabsContent>
                                <TabsContent value="guide" className="flex-1 m-0 p-0">
                                    <FormField
                                        control={form.control}
                                        name="guideContent"
                                        render={({ field }) => (
                                            <Textarea 
                                                className="border-0 focus-visible:ring-0 resize-none h-full p-4 font-mono text-sm leading-relaxed" 
                                                placeholder="Write the study guide / answers here..."
                                                {...field}
                                            />
                                        )}
                                    />
                                </TabsContent>
                                <TabsContent value="transcript" className="flex-1 m-0 p-0">
                                    <div className="flex flex-col h-full">
                                        {sermonLinkType === 'existing' && linkedSermonId && (
                                             <div className="p-3 border-b bg-blue-50/50 flex items-center justify-between">
                                                <div className="flex items-center gap-2 text-sm text-blue-700">
                                                    <LinkIcon className="h-4 w-4" />
                                                    <span>Linked to sermon: <strong>Understanding Grace</strong></span>
                                                </div>
                                                <Button 
                                                    type="button" 
                                                    variant="secondary" 
                                                    size="sm" 
                                                    onClick={() => handleImport('sermon')} 
                                                    disabled={isSyncingTranscript}
                                                    className="h-8"
                                                >
                                                    {isSyncingTranscript ? (
                                                        <>
                                                            <RefreshCw className="mr-2 h-3 w-3 animate-spin" />
                                                            Syncing...
                                                        </>
                                                    ) : (
                                                        <>
                                                            <RefreshCw className="mr-2 h-3 w-3" />
                                                            Resync Transcript
                                                        </>
                                                    )}
                                                </Button>
                                            </div>
                                        )}
                                        
                                        {sermonLinkType === 'new' && createSermonUrl && (
                                            <div className="p-3 border-b bg-blue-50/50 flex items-center gap-2 text-sm text-blue-700">
                                                <Youtube className="h-4 w-4" />
                                                <span>New sermon will be created from YouTube. Transcript will be imported after saving.</span>
                                            </div>
                                        )}

                                        {(!linkedSermonId && !createSermonUrl) && (
                                            <div className="p-3 border-b bg-yellow-50/50 text-sm text-yellow-700 flex items-center gap-2">
                                                <FileText className="h-4 w-4" />
                                                <span>Link a sermon in "Organization" to automatically import its transcript.</span>
                                            </div>
                                        )}
                                        
                                        <FormField
                                            control={form.control}
                                            name="transcriptContent"
                                            render={({ field }) => (
                                                <Textarea 
                                                    className="border-0 focus-visible:ring-0 resize-none h-full p-4 font-mono text-sm leading-relaxed" 
                                                    placeholder={linkedSermonId || createSermonUrl ? "Transcript..." : "Enter transcript manually or link a sermon..."}
                                                    {...field}
                                                />
                                            )}
                                        />
                                    </div>
                                </TabsContent>
                                {customFields.map((field, index) => (
                                    <TabsContent key={field.id} value={`custom-${index}`} className="flex-1 m-0 p-0 relative">
                                        <div className="absolute right-2 top-2 z-10">
                                            <Button type="button" variant="ghost" size="sm" onClick={() => removeCustom(index)}>
                                                <X className="h-4 w-4 text-destructive" />
                                            </Button>
                                        </div>
                                        <FormField
                                            control={form.control}
                                            name={`customTabs.${index}.content`}
                                            render={({ field }) => (
                                                <Textarea 
                                                    className="border-0 focus-visible:ring-0 resize-none h-full p-4 font-mono text-sm leading-relaxed" 
                                                    placeholder="Custom content..."
                                                    {...field}
                                                />
                                            )}
                                        />
                                    </TabsContent>
                                ))}
                            </div>
                        </Tabs>
                    </div>
                 </div>

                 {/* Right Column: Metadata */}
                 <div className="space-y-6">
                    {/* Publishing */}
                    <div className="rounded-lg border bg-card text-card-foreground shadow-sm p-5 space-y-4">
                        <h3 className="font-semibold text-sm">Publishing</h3>
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
                                            <SelectItem value="archived">Archived</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </FormItem>
                            )}
                        />
                    </div>

                    {/* Organization */}
                    <div className="rounded-lg border bg-card text-card-foreground shadow-sm p-5 space-y-4">
                        <h3 className="font-semibold text-sm">Organization</h3>
                        <FormField
                            control={form.control}
                            name="seriesId"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Series / Folder</FormLabel>
                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                        <FormControl>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select series" />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            <SelectItem value="s1">Romans Series</SelectItem>
                                            <SelectItem value="s2">Community Life</SelectItem>
                                            <SelectItem value="create_new">+ Create New Series</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </FormItem>
                            )}
                        />
                        
                        <div className="space-y-3 pt-2">
                             <FormLabel>Linked Sermon</FormLabel>
                             <Tabs 
                                value={sermonLinkType} 
                                onValueChange={(val) => {
                                    form.setValue("sermonLinkType", val as "existing" | "new")
                                    // Clear preview if switching
                                    if (val === "existing") setPreviewVideoId(null);
                                }}
                                className="w-full"
                             >
                                <TabsList className="grid w-full grid-cols-2 mb-3">
                                    <TabsTrigger value="existing">Existing</TabsTrigger>
                                    <TabsTrigger value="new">Create New</TabsTrigger>
                                </TabsList>
                                
                                <TabsContent value="existing" className="mt-0">
                                    <FormField
                                        control={form.control}
                                        name="linkedSermonId"
                                        render={({ field }) => (
                                            <FormItem>
                                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                    <FormControl>
                                                        <SelectTrigger>
                                                            <SelectValue placeholder="Select existing sermon..." />
                                                        </SelectTrigger>
                                                    </FormControl>
                                                    <SelectContent>
                                                        <SelectItem value="sermon1">Understanding Grace (Pastor John)</SelectItem>
                                                        <SelectItem value="sermon2">Week 2: Law vs Gospel</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </FormItem>
                                        )}
                                    />
                                </TabsContent>
                                
                                <TabsContent value="new" className="mt-0 space-y-3">
                                    <FormField
                                        control={form.control}
                                        name="createSermonUrl"
                                        render={({ field }) => (
                                            <FormItem>
                                                <div className="flex gap-2">
                                                    <FormControl>
                                                        <div className="relative flex-1">
                                                            <Youtube className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                                            <Input 
                                                                placeholder="Paste YouTube URL..." 
                                                                className="pl-9"
                                                                {...field}
                                                                onChange={(e) => {
                                                                    field.onChange(e);
                                                                    if (!e.target.value) setPreviewVideoId(null);
                                                                }}
                                                            />
                                                        </div>
                                                    </FormControl>
                                                    <Button type="button" variant="secondary" onClick={handlePreview}>
                                                        Preview
                                                    </Button>
                                                </div>
                                                <FormDescription className="text-xs">
                                                    A new sermon will be created with this video.
                                                </FormDescription>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    
                                    {previewVideoId && (
                                        <div className="rounded-md overflow-hidden border aspect-video bg-black shadow-sm">
                                             <iframe 
                                                width="100%" 
                                                height="100%" 
                                                src={`https://www.youtube.com/embed/${previewVideoId}`} 
                                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                                allowFullScreen
                                                className="w-full h-full"
                                             />
                                        </div>
                                    )}
                                </TabsContent>
                             </Tabs>
                        </div>
                    </div>

                    {/* Attachments */}
                    <div className="rounded-lg border bg-card text-card-foreground shadow-sm p-5 space-y-4">
                         <div className="flex items-center justify-between">
                             <h3 className="font-semibold text-sm">Attachments</h3>
                             <Button type="button" variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={handleFileUpload}>
                                 <Plus className="h-4 w-4" />
                             </Button>
                         </div>
                         <div className="space-y-2">
                             {attachmentFields.map((file, index) => (
                                 <div key={file.id} className="flex items-center justify-between p-2 rounded bg-muted/50 text-sm">
                                     <div className="flex items-center gap-2 overflow-hidden">
                                         <FileText className="h-4 w-4 shrink-0 text-muted-foreground" />
                                         <div className="flex flex-col truncate">
                                             <span className="truncate font-medium">{file.name}</span>
                                             <span className="text-[10px] text-muted-foreground">{file.size}</span>
                                         </div>
                                     </div>
                                     <Button type="button" variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => removeAttachment(index)}>
                                         <X className="h-3 w-3" />
                                     </Button>
                                 </div>
                             ))}
                             {attachmentFields.length === 0 && (
                                 <div className="text-xs text-muted-foreground text-center py-4 border border-dashed rounded">
                                     No attachments
                                 </div>
                             )}
                             <Button type="button" variant="outline" size="sm" className="w-full" onClick={handleFileUpload}>
                                <UploadCloud className="mr-2 h-3 w-3" />
                                Upload File
                             </Button>
                         </div>
                    </div>
                 </div>
            </div>
        </form>
      </Form>
    </div>
  )
}
