"use client";

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Button } from "@/app/components/ui/button"
import {
  Form,
} from "@/app/components/ui/form"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/app/components/ui/tabs"
import { 
    Loader2, 
    ArrowLeft,
    Info,
    Users,
    LayoutTemplate,
    MessageSquare,
    Save
} from "lucide-react"
import { type Ministry } from "./data"
import { MinistryDetailsTab } from "./MinistryDetailsTab"
import { MinistryPeopleTab } from "./MinistryPeopleTab"
import { MinistryContentTab } from "./MinistryContentTab"
import { toast } from "sonner"

// Define Zod Schema
const meetingSchema = z.object({
    id: z.string().optional(),
    label: z.string().min(1, "Label is required"),
    location: z.string().min(1, "Location is required"),
    day: z.string().min(1, "Day is required"),
    time: z.string().min(1, "Time is required"),
    type: z.enum(['in-person', 'online', 'hybrid']),
    mapLink: z.string().optional(),
    zoomLink: z.string().optional(),
})

const leaderSchema = z.object({
    id: z.string().optional(),
    name: z.string().min(1, "Name is required"),
    role: z.string().min(1, "Role is required"),
    bio: z.string().optional(),
    imageUrl: z.string().optional(),
    isContactPerson: z.boolean().default(false),
    socials: z.array(z.any()).default([])
})

const testimonialSchema = z.object({
    id: z.string().optional(),
    author: z.string().min(1, "Author is required"),
    role: z.string().optional(),
    content: z.string().min(1, "Content is required"),
    imageUrl: z.string().optional(),
})

const faqSchema = z.object({
    id: z.string().optional(),
    question: z.string().min(1, "Question is required"),
    answer: z.string().min(1, "Answer is required"),
})

const ministrySchema = z.object({
    name: z.string().min(2, "Name is required"),
    description: z.string().min(10, "Description must be at least 10 characters"),
    status: z.enum(['published', 'draft', 'archived']),
    bannerImage: z.string().optional(),
    meetings: z.array(meetingSchema),
    leaders: z.array(leaderSchema),
    testimonials: z.array(testimonialSchema),
    faqs: z.array(faqSchema),
    templateConfig: z.object({
        layoutVariant: z.enum(['standard', 'hero-focused', 'minimal']),
        colorTheme: z.enum(['default', 'ocean', 'sunset', 'forest']),
        showMeetingInfo: z.boolean(),
        showLeaders: z.boolean(),
        showTestimonials: z.boolean(),
        showFAQ: z.boolean(),
    })
})

type MinistryFormValues = z.infer<typeof ministrySchema>

interface MinistryEditorProps {
  ministry?: Ministry
  onCancel: () => void
  onSave: (data: Partial<Ministry>) => void
}

export function MinistryEditor({ ministry, onCancel, onSave }: MinistryEditorProps) {
  const [isSaving, setIsSaving] = useState(false)
  const [activeTab, setActiveTab] = useState("details")

  const defaultValues: Partial<MinistryFormValues> = {
      name: "",
      description: "",
      status: "draft",
      bannerImage: "",
      meetings: [],
      leaders: [],
      testimonials: [],
      faqs: [],
      templateConfig: {
          layoutVariant: 'standard',
          colorTheme: 'default',
          showMeetingInfo: true,
          showLeaders: true,
          showTestimonials: true,
          showFAQ: true
      },
      ...ministry // Override with existing values if editing
  }

  const form = useForm<MinistryFormValues>({
    resolver: zodResolver(ministrySchema),
    defaultValues: defaultValues,
    mode: "onChange"
  })

  function onSubmit(data: MinistryFormValues) {
    setIsSaving(true)
    setTimeout(() => {
      onSave(data as Partial<Ministry>)
      toast.success("Ministry saved successfully")
      setIsSaving(false)
    }, 1000)
  }

  return (
    <div className="flex flex-col min-h-[calc(100vh-140px)] space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between sticky top-0 z-10 bg-background/95 backdrop-blur py-2 border-b">
         <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={onCancel} className="-ml-2">
                <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="flex flex-col gap-1">
                <h2 className="text-xl font-semibold leading-none">
                    {ministry ? `Edit ${ministry.name}` : "New Ministry"}
                </h2>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <span>{ministry ? "Manage ministry details and settings" : "Create a new ministry page"}</span>
                </div>
            </div>
        </div>
        <div className="flex gap-2">
            <Button variant="outline" onClick={onCancel}>Cancel</Button>
            <Button onClick={form.handleSubmit(onSubmit)} disabled={isSaving}>
                {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                Save Changes
            </Button>
        </div>
      </div>
      
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8 pb-10">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid w-full grid-cols-3 lg:w-[450px] mb-6">
                    <TabsTrigger value="details" className="gap-2">
                        <Info className="h-4 w-4" />
                        Details
                    </TabsTrigger>
                    <TabsTrigger value="people" className="gap-2">
                        <Users className="h-4 w-4" />
                        People
                    </TabsTrigger>
                    <TabsTrigger value="content" className="gap-2">
                        <MessageSquare className="h-4 w-4" />
                        Content
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="details">
                    <MinistryDetailsTab form={form} />
                </TabsContent>

                <TabsContent value="people">
                    <MinistryPeopleTab form={form} />
                </TabsContent>

                <TabsContent value="content">
                    <MinistryContentTab form={form} />
                </TabsContent>
            </Tabs>
        </form>
      </Form>
    </div>
  )
}
