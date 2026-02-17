"use client";

import { useState } from "react"
import { UseFormReturn, useFieldArray } from "react-hook-form"
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription
} from "@/app/components/ui/form"
import { Input } from "@/app/components/ui/input"
import { Textarea } from "@/app/components/ui/textarea"
import { Button } from "@/app/components/ui/button"
import { Checkbox } from "@/app/components/ui/checkbox"
import { Plus, Trash2, User, Upload } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/app/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/app/components/ui/avatar"
import { PersonSelector } from "../../people/PersonSelector"
import { Person } from "../../people/data"

interface MinistryPeopleTabProps {
    form: UseFormReturn<any>
}

export function MinistryPeopleTab({ form }: MinistryPeopleTabProps) {
    const [isPersonSelectorOpen, setIsPersonSelectorOpen] = useState(false);
    const { fields, append, remove } = useFieldArray({
        control: form.control,
        name: "leaders",
    })

    const handleSelectPerson = (person: Person) => {
        append({ 
            name: `${person.firstName} ${person.lastName}`, 
            role: "Ministry Leader", 
            imageUrl: person.photoUrl,
            bio: "",
            isContactPerson: false,
            socials: []
        });
    };

    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between">
                <div>
                    <CardTitle>Leadership Team</CardTitle>
                    <CardDescription>Manage ministry leaders and point of contact.</CardDescription>
                </div>
                <Button 
                    type="button" 
                    variant="outline" 
                    size="sm" 
                    onClick={() => setIsPersonSelectorOpen(true)}
                >
                    <Plus className="mr-2 h-4 w-4" />
                    Add Leader
                </Button>
            </CardHeader>
            <CardContent className="space-y-6">
                {fields.length === 0 && (
                    <p className="text-sm text-muted-foreground text-center py-4">No leaders assigned.</p>
                )}

                {fields.map((field, index) => (
                    <div key={field.id} className="flex flex-col sm:flex-row gap-6 p-6 border rounded-lg items-start">
                        {/* Avatar Upload Simulation */}
                        <div className="flex flex-col items-center gap-2">
                            <Avatar className="h-20 w-20">
                                <AvatarImage src={form.getValues(`leaders.${index}.imageUrl`)} />
                                <AvatarFallback><User className="h-8 w-8 text-muted-foreground" /></AvatarFallback>
                            </Avatar>
                            <Button variant="ghost" size="sm" className="text-xs h-auto py-1">
                                <Upload className="mr-1 h-3 w-3" />
                                Change
                            </Button>
                        </div>

                        <div className="flex-1 grid gap-4 w-full">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <FormField
                                    control={form.control}
                                    name={`leaders.${index}.name`}
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="text-xs">Name</FormLabel>
                                            <FormControl>
                                                <Input placeholder="Full Name" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name={`leaders.${index}.role`}
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="text-xs">Role / Title</FormLabel>
                                            <FormControl>
                                                <Input placeholder="e.g. Director" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>

                            <FormField
                                control={form.control}
                                name={`leaders.${index}.bio`}
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="text-xs">Bio</FormLabel>
                                        <FormControl>
                                            <Textarea placeholder="Short biography..." className="min-h-[80px]" {...field} />
                                        </FormControl>
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name={`leaders.${index}.isContactPerson`}
                                render={({ field }) => (
                                    <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                                        <FormControl>
                                            <Checkbox
                                                checked={field.value}
                                                onCheckedChange={field.onChange}
                                            />
                                        </FormControl>
                                        <div className="space-y-1 leading-none">
                                            <FormLabel>
                                                Main Point of Contact
                                            </FormLabel>
                                            <FormDescription>
                                                This person will be highlighted as the primary contact for inquiries.
                                            </FormDescription>
                                        </div>
                                    </FormItem>
                                )}
                            />
                        </div>

                        <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="text-muted-foreground hover:text-destructive shrink-0"
                            onClick={() => remove(index)}
                        >
                            <Trash2 className="h-4 w-4" />
                        </Button>
                    </div>
                ))}
            </CardContent>
            
            <PersonSelector 
                isOpen={isPersonSelectorOpen}
                onClose={() => setIsPersonSelectorOpen(false)}
                onSelect={handleSelectPerson}
            />
        </Card>
    )
}
