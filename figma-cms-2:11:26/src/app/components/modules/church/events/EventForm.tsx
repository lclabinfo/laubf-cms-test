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
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/app/components/ui/popover"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/app/components/ui/dialog"
import { Checkbox } from "@/app/components/ui/checkbox"
import { cn } from "@/app/components/ui/utils"
import { 
    CalendarIcon, 
    Loader2, 
    MapPin, 
    UploadCloud, 
    User, 
    Eye, 
    Sparkles, 
    Image as ImageIcon, 
    Link,
    Clock,
    Repeat,
    X,
    Plus
} from "lucide-react"
import { format, addWeeks, addMonths, addYears } from "date-fns"
import { useState, useEffect } from "react"
import { Separator } from "@/app/components/ui/separator"
import { RadioGroup, RadioGroupItem } from "@/app/components/ui/radio-group"
import { Badge } from "@/app/components/ui/badge"
import { RichTextEditor } from "@/app/components/ui/rich-text-editor"
import { ToggleGroup, ToggleGroupItem } from "@/app/components/ui/toggle-group"
import { mockEvents, MockEvent } from "./data"
import { MediaSelectorDialog } from "../media-selector/MediaSelectorDialog"

const eventSchema = z.object({
  title: z.string().min(2, "Title is required."),
  type: z.enum(["event", "meeting", "program"]),
  
  startDate: z.date(),
  endDate: z.date(),
  startTime: z.string(),
  endTime: z.string(),
  
  recurrence: z.object({
      pattern: z.enum(['none', 'daily', 'weekly', 'monthly', 'yearly', 'weekday', 'custom']),
      interval: z.number().min(1).default(1),
      daysOfWeek: z.array(z.string()).default([]), // "0"=Sun, "6"=Sat
      endOption: z.enum(['never', 'date', 'after']),
      endDate: z.date().optional(),
      endOccurrences: z.number().min(1).optional()
  }),

  locationType: z.enum(["in-person", "online"]),
  location: z.string().min(2, "Location is required."),
  description: z.string().optional(),
  welcomeMessage: z.string().optional(),
  ministry: z.string().optional(),
  contactPeople: z.array(z.string()).default([]),
  coverImage: z.string().optional(),
  status: z.enum(["draft", "published"]),
})

type EventFormValues = z.infer<typeof eventSchema>

const defaultValues: EventFormValues = {
  title: "",
  type: "event",
  startDate: new Date(),
  endDate: new Date(),
  startTime: "10:00",
  endTime: "11:30",
  recurrence: {
      pattern: 'none',
      interval: 1,
      daysOfWeek: [],
      endOption: 'never',
      endOccurrences: 13
  },
  locationType: "in-person",
  location: "",
  description: "",
  welcomeMessage: "",
  ministry: "",
  contactPeople: [],
  coverImage: "",
  status: "draft",
}

interface EventFormProps {
  mode: "create" | "edit"
  eventId: string | null
  onCancel: () => void
  onSave: () => void
}

export function EventForm({ mode, eventId, onCancel, onSave }: EventFormProps) {
  const [isSaving, setIsSaving] = useState(false)
  const [isPreviewOpen, setIsPreviewOpen] = useState(false)
  const [isMediaSelectorOpen, setIsMediaSelectorOpen] = useState(false)
  const [isCustomRecurrenceOpen, setIsCustomRecurrenceOpen] = useState(false)
  const [contactInput, setContactInput] = useState("")
  
  // Find event from mock data if editing
  const initialData = mode === "edit" && eventId 
      ? mockEvents.find(e => e.id === eventId) 
      : null;

  const form = useForm<EventFormValues>({
    resolver: zodResolver(eventSchema),
    defaultValues: initialData ? {
        ...initialData,
        // Ensure recurrence structure is complete if partial in mock data
        recurrence: {
            interval: 1,
            daysOfWeek: [],
            endOption: 'never',
            ...initialData.recurrence
        }
    } : defaultValues,
  })

  // Watch for changes to update UI immediately
  const recurrenceValues = form.watch("recurrence");
  const startDate = form.watch("startDate");

  function onSubmit(data: EventFormValues) {
    setIsSaving(true)
    setTimeout(() => {
      console.log(data)
      setIsSaving(false)
      onSave()
    }, 1000)
  }

  const handleGenerateImage = () => {
      // Simulate AI generation
      form.setValue("coverImage", "https://images.unsplash.com/photo-1519791883288-dc8bd696e667?w=800&auto=format&fit=crop&q=60")
  }

  const handleAddContact = () => {
      if (contactInput.trim()) {
          const current = form.getValues("contactPeople") || []
          if (!current.includes(contactInput.trim())) {
              form.setValue("contactPeople", [...current, contactInput.trim()])
          }
          setContactInput("")
      }
  }

  const handleRemoveContact = (person: string) => {
      const current = form.getValues("contactPeople") || []
      form.setValue("contactPeople", current.filter(p => p !== person))
  }

  // Helper to format the recurrence text
  const getRecurrenceLabel = (pattern: string) => {
      switch (pattern) {
          case 'none': return "Does not repeat";
          case 'daily': return "Daily";
          case 'weekly': return `Weekly on ${format(startDate, 'EEEE')}`;
          case 'monthly': return "Monthly on the third Sunday"; // simplified for demo
          case 'yearly': return `Annually on ${format(startDate, 'MMMM d')}`;
          case 'weekday': return "Every weekday (Monday to Friday)";
          case 'custom': 
             // Build custom string: "Weekly on Sunday, Wednesday, until Apr 19..."
             const { interval, daysOfWeek, endOption, endDate, endOccurrences } = recurrenceValues;
             const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
             
             let label = interval > 1 ? `Every ${interval} weeks` : "Weekly";
             
             if (daysOfWeek && daysOfWeek.length > 0) {
                 // Sort days
                 const sortedDays = [...daysOfWeek].sort((a, b) => parseInt(a) - parseInt(b));
                 const daysStr = sortedDays.map(d => dayNames[parseInt(d)]).join(", ");
                 label += ` on ${daysStr}`;
             }

             if (endOption === 'date' && endDate) {
                 label += `, until ${format(endDate, 'MMM d, yyyy')}`;
             } else if (endOption === 'after' && endOccurrences) {
                 label += `, for ${endOccurrences} occurrences`;
             }
             
             return label;
          default: return "Does not repeat";
      }
  }

  return (
    <div className="space-y-6">
       <div className="flex items-center justify-between">
         <div className="flex flex-col gap-1">
            <h2 className="text-xl font-semibold">
            {mode === "create" ? "New Event" : "Edit Event"}
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
                Save Event
            </Button>
        </div>
      </div>
      <Separator />

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
                 {/* Main Column */}
                 <div className="lg:col-span-2 space-y-6">
                    
                    {/* Title */}
                    <FormField
                        control={form.control}
                        name="title"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel className="text-base font-semibold text-foreground">Title</FormLabel>
                                <FormControl>
                                    <Input 
                                        placeholder="Add title" 
                                        className="bg-muted/50 border-transparent focus-visible:ring-0 focus-visible:bg-muted" 
                                        {...field} 
                                    />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    {/* Date & Time Section */}
                    <div className="bg-muted/30 p-4 rounded-lg space-y-4">
                        <div className="flex flex-col gap-4">
                            <FormLabel className="sr-only">Date and Time</FormLabel>
                            <div className="flex flex-wrap items-center gap-2">
                                {/* Start Date */}
                                <FormField
                                    control={form.control}
                                    name="startDate"
                                    render={({ field }) => (
                                        <Popover>
                                            <PopoverTrigger asChild>
                                                <Button
                                                    variant={"outline"}
                                                    className={cn(
                                                        "justify-start text-left font-normal bg-card h-10 px-3 min-w-[180px]",
                                                        !field.value && "text-muted-foreground"
                                                    )}
                                                >
                                                    {field.value ? (
                                                        format(field.value, "EEEE, MMMM d")
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
                                
                                {/* Time Range */}
                                <div className="flex items-center gap-2 bg-card border rounded-md px-2 h-10">
                                    <FormField
                                        control={form.control}
                                        name="startTime"
                                        render={({ field }) => (
                                            <Input 
                                                type="time" 
                                                className="w-[100px] border-0 focus-visible:ring-0 p-0 h-auto text-center" 
                                                {...field} 
                                            />
                                        )}
                                    />
                                    <span className="text-muted-foreground">-</span>
                                    <FormField
                                        control={form.control}
                                        name="endTime"
                                        render={({ field }) => (
                                            <Input 
                                                type="time" 
                                                className="w-[100px] border-0 focus-visible:ring-0 p-0 h-auto text-center" 
                                                {...field} 
                                            />
                                        )}
                                    />
                                </div>

                                {/* End Date */}
                                <FormField
                                    control={form.control}
                                    name="endDate"
                                    render={({ field }) => (
                                        <Popover>
                                            <PopoverTrigger asChild>
                                                <Button
                                                    variant={"outline"}
                                                    className={cn(
                                                        "justify-start text-left font-normal bg-card h-10 px-3 min-w-[180px]",
                                                        !field.value && "text-muted-foreground"
                                                    )}
                                                >
                                                    {field.value ? (
                                                        format(field.value, "EEEE, MMMM d")
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
                            </div>
                        </div>
                        
                        {/* Recurrence Dropdown */}
                        <div className="flex items-center gap-2">
                             <Repeat className="h-4 w-4 text-muted-foreground" />
                             <FormField
                                control={form.control}
                                name="recurrence.pattern"
                                render={({ field }) => (
                                    <FormItem className="flex-1">
                                        <Select 
                                            onValueChange={(val) => {
                                                if (val === 'custom') {
                                                    setIsCustomRecurrenceOpen(true);
                                                } 
                                                field.onChange(val)
                                            }} 
                                            value={field.value}
                                        >
                                            <FormControl>
                                                <SelectTrigger className="w-fit min-w-[200px] h-8 border-0 shadow-none bg-transparent hover:bg-muted p-0 px-2 -ml-2 text-muted-foreground data-[state=open]:bg-muted focus:ring-0">
                                                    <SelectValue placeholder="Does not repeat">
                                                        {getRecurrenceLabel(field.value)}
                                                    </SelectValue>
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                <SelectItem value="none">Does not repeat</SelectItem>
                                                <SelectItem value="daily">Daily</SelectItem>
                                                <SelectItem value="weekly">Weekly on {format(startDate, 'EEEE')}</SelectItem>
                                                <SelectItem value="monthly">Monthly on the third Sunday</SelectItem>
                                                <SelectItem value="yearly">Annually on {format(startDate, 'MMMM d')}</SelectItem>
                                                <SelectItem value="weekday">Every weekday (Monday to Friday)</SelectItem>
                                                <SelectItem value="custom">Custom...</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </FormItem>
                                )}
                            />
                        </div>
                    </div>

                    {/* Custom Recurrence Dialog */}
                    <Dialog open={isCustomRecurrenceOpen} onOpenChange={setIsCustomRecurrenceOpen}>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Custom recurrence</DialogTitle>
                            </DialogHeader>
                            <div className="space-y-6 py-4">
                                <div className="flex items-center gap-2">
                                    <span className="text-sm font-medium">Repeat every</span>
                                    <FormField
                                        control={form.control}
                                        name="recurrence.interval"
                                        render={({ field }) => (
                                            <Input 
                                                type="number" 
                                                min={1} 
                                                className="w-16 text-center" 
                                                {...field} 
                                                onChange={e => field.onChange(parseInt(e.target.value))}
                                            />
                                        )}
                                    />
                                     <span className="text-sm font-medium">week</span>
                                </div>

                                <div className="space-y-3">
                                    <span className="text-sm font-medium block">Repeat on</span>
                                    <FormField
                                        control={form.control}
                                        name="recurrence.daysOfWeek"
                                        render={({ field }) => (
                                            <ToggleGroup type="multiple" variant="outline" value={field.value} onValueChange={field.onChange} className="justify-start gap-2">
                                                {['S','M','T','W','T','F','S'].map((day, i) => (
                                                    <ToggleGroupItem 
                                                        key={i} 
                                                        value={i.toString()} 
                                                        className="h-9 w-9 rounded-full p-0 data-[state=on]:bg-blue-600 data-[state=on]:text-white data-[state=on]:border-blue-600"
                                                        aria-label={day}
                                                    >
                                                        {day}
                                                    </ToggleGroupItem>
                                                ))}
                                            </ToggleGroup>
                                        )}
                                    />
                                </div>

                                <div className="space-y-3">
                                    <span className="text-sm font-medium block">Ends</span>
                                    <FormField
                                        control={form.control}
                                        name="recurrence.endOption"
                                        render={({ field }) => (
                                            <RadioGroup value={field.value} onValueChange={field.onChange} className="space-y-3">
                                                <div className="flex items-center space-x-2">
                                                    <RadioGroupItem value="never" id="r-never" />
                                                    <label htmlFor="r-never" className="text-sm">Never</label>
                                                </div>
                                                <div className="flex items-center space-x-2">
                                                    <RadioGroupItem value="date" id="r-date" />
                                                    <label htmlFor="r-date" className="text-sm w-16">On</label>
                                                    <FormField
                                                        control={form.control}
                                                        name="recurrence.endDate"
                                                        render={({ field: dateField }) => (
                                                            <Popover>
                                                                <PopoverTrigger asChild>
                                                                    <Button
                                                                        variant={"outline"}
                                                                        className={cn(
                                                                            "w-[160px] pl-3 text-left font-normal h-8",
                                                                            !dateField.value && "text-muted-foreground"
                                                                        )}
                                                                        disabled={field.value !== 'date'}
                                                                    >
                                                                        {dateField.value ? (
                                                                            format(dateField.value, "PPP")
                                                                        ) : (
                                                                            <span>Pick a date</span>
                                                                        )}
                                                                    </Button>
                                                                </PopoverTrigger>
                                                                <PopoverContent className="w-auto p-0" align="start">
                                                                    <Calendar
                                                                        mode="single"
                                                                        selected={dateField.value}
                                                                        onSelect={dateField.onChange}
                                                                        initialFocus
                                                                    />
                                                                </PopoverContent>
                                                            </Popover>
                                                        )}
                                                    />
                                                </div>
                                                <div className="flex items-center space-x-2">
                                                    <RadioGroupItem value="after" id="r-after" />
                                                    <label htmlFor="r-after" className="text-sm w-16">After</label>
                                                     <FormField
                                                        control={form.control}
                                                        name="recurrence.endOccurrences"
                                                        render={({ field: countField }) => (
                                                            <div className="flex items-center gap-2">
                                                                <Input 
                                                                    type="number" 
                                                                    min={1} 
                                                                    className="w-16 h-8 text-center" 
                                                                    {...countField} 
                                                                    disabled={field.value !== 'after'}
                                                                    onChange={e => countField.onChange(parseInt(e.target.value))}
                                                                />
                                                                <span className="text-sm text-muted-foreground">occurrences</span>
                                                            </div>
                                                        )}
                                                    />
                                                </div>
                                            </RadioGroup>
                                        )}
                                    />
                                </div>
                            </div>
                            <DialogFooter>
                                <Button variant="outline" onClick={() => setIsCustomRecurrenceOpen(false)}>Cancel</Button>
                                <Button onClick={() => setIsCustomRecurrenceOpen(false)}>Done</Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>

                    <FormField
                        control={form.control}
                        name="locationType"
                        render={({ field }) => (
                            <FormItem className="space-y-3">
                                <FormLabel>Location</FormLabel>
                                <FormControl>
                                    <div className="flex flex-col gap-4">
                                         <RadioGroup
                                            onValueChange={field.onChange}
                                            defaultValue={field.value}
                                            className="flex flex-row space-x-4"
                                        >
                                            <FormItem className="flex items-center space-x-2 space-y-0">
                                                <FormControl>
                                                    <RadioGroupItem value="in-person" />
                                                </FormControl>
                                                <FormLabel className="font-normal">
                                                    In-Person
                                                </FormLabel>
                                            </FormItem>
                                            <FormItem className="flex items-center space-x-2 space-y-0">
                                                <FormControl>
                                                    <RadioGroupItem value="online" />
                                                </FormControl>
                                                <FormLabel className="font-normal">
                                                    Online / Remote
                                                </FormLabel>
                                            </FormItem>
                                        </RadioGroup>
                                        
                                        <FormField
                                            control={form.control}
                                            name="location"
                                            render={({ field: locField }) => (
                                                <div className="flex gap-2">
                                                    <div className="relative flex-1">
                                                        <MapPin className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                                        <Input 
                                                            placeholder={field.value === "online" ? "Add video conferencing link" : "Add location"} 
                                                            className="pl-9"
                                                            {...locField} 
                                                        />
                                                    </div>
                                                </div>
                                            )}
                                        />
                                    </div>
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
                                <FormLabel>Description</FormLabel>
                                <FormControl>
                                    <RichTextEditor 
                                        value={field.value || ""} 
                                        onChange={field.onChange}
                                        placeholder="Add description, agenda, or notes..."
                                        className="min-h-[250px]"
                                    />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    
                    <FormField
                        control={form.control}
                        name="welcomeMessage"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Welcome Message (Optional)</FormLabel>
                                <FormControl>
                                    <Input placeholder="e.g. First time? We'd love to meet you!" {...field} />
                                </FormControl>
                                <FormDescription>
                                    A custom message displayed prominently for new visitors.
                                </FormDescription>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                 </div>

                 {/* Sidebar Column */}
                 <div className="space-y-6">
                    <div className="rounded-lg border bg-card text-card-foreground shadow-sm p-6 space-y-4">
                        <h3 className="font-semibold leading-none tracking-tight">Organization</h3>
                        
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
                                        </SelectContent>
                                    </Select>
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="type"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Event Type</FormLabel>
                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                        <FormControl>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select type" />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            <SelectItem value="event">Event</SelectItem>
                                            <SelectItem value="meeting">Meeting</SelectItem>
                                            <SelectItem value="program">Program</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </FormItem>
                            )}
                        />
                        
                         <FormField
                            control={form.control}
                            name="ministry"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Ministry / Category</FormLabel>
                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                        <FormControl>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select ministry" />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            <SelectItem value="Worship">Worship</SelectItem>
                                            <SelectItem value="Youth">Youth</SelectItem>
                                            <SelectItem value="Kids">Kids</SelectItem>
                                            <SelectItem value="Outreach">Outreach</SelectItem>
                                            <SelectItem value="Leadership">Leadership</SelectItem>
                                            <SelectItem value="Education">Education</SelectItem>
                                            <SelectItem value="Prayer">Prayer</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </FormItem>
                            )}
                        />

                         <FormField
                            control={form.control}
                            name="contactPeople"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Points of Contact</FormLabel>
                                    <div className="flex flex-col gap-2">
                                        <div className="flex flex-wrap gap-2">
                                            {field.value.map((person, index) => (
                                                <Badge key={index} variant="secondary" className="flex items-center gap-1 pr-1 h-7">
                                                    {person}
                                                    <Button 
                                                        type="button" 
                                                        variant="ghost" 
                                                        size="sm" 
                                                        className="h-4 w-4 p-0 hover:bg-transparent text-muted-foreground hover:text-foreground"
                                                        onClick={() => handleRemoveContact(person)}
                                                    >
                                                        <X className="h-3 w-3" />
                                                    </Button>
                                                </Badge>
                                            ))}
                                        </div>
                                        <div className="flex gap-2">
                                            <Input 
                                                placeholder="Add person..." 
                                                value={contactInput}
                                                onChange={(e) => setContactInput(e.target.value)}
                                                onKeyDown={(e) => {
                                                    if (e.key === 'Enter') {
                                                        e.preventDefault();
                                                        handleAddContact();
                                                    }
                                                }}
                                            />
                                            <Button type="button" variant="outline" size="icon" onClick={handleAddContact}>
                                                <Plus className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </div>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </div>

                    <div className="rounded-lg border bg-card text-card-foreground shadow-sm p-6 space-y-4">
                         <h3 className="font-semibold leading-none tracking-tight">Cover Image</h3>
                         
                         <FormField
                             control={form.control}
                             name="coverImage"
                             render={({ field }) => (
                                 <FormItem>
                                     <FormLabel className="sr-only">Cover Image</FormLabel>
                                     <FormControl>
                                        <div className="space-y-3">
                                            {field.value ? (
                                                <div className="relative aspect-video w-full rounded-md overflow-hidden border">
                                                    <img src={field.value} alt="Cover" className="object-cover w-full h-full" />
                                                    <Button 
                                                        type="button" 
                                                        variant="secondary" 
                                                        size="sm" 
                                                        className="absolute top-2 right-2 h-8 px-2"
                                                        onClick={() => field.onChange("")}
                                                    >
                                                        Remove
                                                    </Button>
                                                </div>
                                            ) : (
                                                <div className="aspect-video w-full rounded-md bg-muted flex flex-col items-center justify-center text-muted-foreground border-2 border-dashed gap-2">
                                                    <ImageIcon className="h-8 w-8" />
                                                    <span className="text-xs">No image selected</span>
                                                </div>
                                            )}
                                            
                                            <div className="grid grid-cols-3 gap-2">
                                                <Button type="button" variant="outline" size="sm" className="w-full">
                                                    <UploadCloud className="mr-2 h-3 w-3" />
                                                    Upload
                                                </Button>
                                                <Button type="button" variant="outline" size="sm" className="w-full" onClick={handleGenerateImage}>
                                                    <Sparkles className="mr-2 h-3 w-3" />
                                                    Generate AI
                                                </Button>
                                                <Button type="button" variant="outline" size="sm" className="w-full" onClick={() => setIsMediaSelectorOpen(true)}>
                                                    <ImageIcon className="mr-2 h-3 w-3" />
                                                    Library
                                                </Button>
                                            </div>
                                        </div>
                                     </FormControl>
                                     <FormMessage />
                                 </FormItem>
                             )}
                         />
                    </div>
                 </div>
            </div>
        </form>
      </Form>

      <MediaSelectorDialog 
        open={isMediaSelectorOpen} 
        onOpenChange={setIsMediaSelectorOpen}
        onSelect={(url) => form.setValue("coverImage", url)}
      />
    </div>
  )
}
