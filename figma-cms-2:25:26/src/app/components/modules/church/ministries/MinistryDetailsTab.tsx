"use client";

import { UseFormReturn, useFieldArray } from "react-hook-form"
import {
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
import { Button } from "@/app/components/ui/button"
import { Plus, Trash2, MapPin, Clock, Calendar, Video } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/app/components/ui/card"
import { Separator } from "@/app/components/ui/separator"

interface MinistryDetailsTabProps {
    form: UseFormReturn<any>
}

export function MinistryDetailsTab({ form }: MinistryDetailsTabProps) {
    const { fields, append, remove } = useFieldArray({
        control: form.control,
        name: "meetings",
    })

    return (
        <div className="space-y-6">
            {/* Core Metadata */}
            <Card>
                <CardHeader>
                    <CardTitle>Basic Information</CardTitle>
                </CardHeader>
                <CardContent className="grid gap-6">
                    <FormField
                        control={form.control}
                        name="name"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Ministry Name</FormLabel>
                                <FormControl>
                                    <Input placeholder="e.g. Youth Ministry" {...field} />
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
                                <FormLabel>Description / About Us</FormLabel>
                                <FormControl>
                                    <Textarea 
                                        placeholder="Brief description of the ministry..." 
                                        className="min-h-[100px]"
                                        {...field} 
                                    />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <div className="grid grid-cols-2 gap-4">
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
                                            <SelectItem value="archived">Archived</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </div>
                </CardContent>
            </Card>

            {/* Meetings */}
            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle>Meeting Schedule</CardTitle>
                    <Button 
                        type="button" 
                        variant="outline" 
                        size="sm" 
                        onClick={() => append({ 
                            label: "Weekly Meeting", 
                            location: "", 
                            day: "Sunday", 
                            time: "10:00 AM", 
                            type: "in-person" 
                        })}
                    >
                        <Plus className="mr-2 h-4 w-4" />
                        Add Meeting
                    </Button>
                </CardHeader>
                <CardContent className="space-y-6">
                    {fields.length === 0 && (
                        <p className="text-sm text-muted-foreground text-center py-4">No meetings scheduled.</p>
                    )}
                    
                    {fields.map((field, index) => (
                        <div key={field.id} className="relative grid gap-4 p-4 border rounded-lg bg-muted/10">
                            <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="absolute right-2 top-2 text-muted-foreground hover:text-destructive"
                                onClick={() => remove(index)}
                            >
                                <Trash2 className="h-4 w-4" />
                            </Button>

                            <div className="grid grid-cols-2 gap-4 pr-8">
                                <FormField
                                    control={form.control}
                                    name={`meetings.${index}.label`}
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="text-xs">Label</FormLabel>
                                            <FormControl>
                                                <Input placeholder="e.g. Sunday Service" {...field} />
                                            </FormControl>
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name={`meetings.${index}.type`}
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="text-xs">Type</FormLabel>
                                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                <FormControl>
                                                    <SelectTrigger>
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent>
                                                    <SelectItem value="in-person">In-Person</SelectItem>
                                                    <SelectItem value="online">Online</SelectItem>
                                                    <SelectItem value="hybrid">Hybrid</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </FormItem>
                                    )}
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <FormField
                                    control={form.control}
                                    name={`meetings.${index}.day`}
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="text-xs">Day</FormLabel>
                                            <FormControl>
                                                <Input placeholder="e.g. Sunday" {...field} />
                                            </FormControl>
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name={`meetings.${index}.time`}
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="text-xs">Time</FormLabel>
                                            <FormControl>
                                                <Input placeholder="e.g. 10:00 AM" {...field} />
                                            </FormControl>
                                        </FormItem>
                                    )}
                                />
                            </div>

                            <FormField
                                control={form.control}
                                name={`meetings.${index}.location`}
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="text-xs">Location</FormLabel>
                                        <FormControl>
                                            <div className="relative">
                                                <MapPin className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                                <Input className="pl-8" placeholder="Room 101 or Address" {...field} />
                                            </div>
                                        </FormControl>
                                    </FormItem>
                                )}
                            />

                            <div className="grid grid-cols-2 gap-4">
                                <FormField
                                    control={form.control}
                                    name={`meetings.${index}.mapLink`}
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="text-xs">Map Link (Optional)</FormLabel>
                                            <FormControl>
                                                <Input placeholder="https://maps.google.com/..." {...field} />
                                            </FormControl>
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name={`meetings.${index}.zoomLink`}
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="text-xs">Zoom/Video Link (Optional)</FormLabel>
                                            <FormControl>
                                                <div className="relative">
                                                    <Video className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                                    <Input className="pl-8" placeholder="https://zoom.us/..." {...field} />
                                                </div>
                                            </FormControl>
                                        </FormItem>
                                    )}
                                />
                            </div>
                        </div>
                    ))}
                </CardContent>
            </Card>
        </div>
    )
}
