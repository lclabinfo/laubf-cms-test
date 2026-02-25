"use client";

import { UseFormReturn, useFieldArray } from "react-hook-form"
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/app/components/ui/form"
import { Input } from "@/app/components/ui/input"
import { Textarea } from "@/app/components/ui/textarea"
import { Button } from "@/app/components/ui/button"
import { Plus, Trash2, MessageSquare, HelpCircle } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/app/components/ui/card"
import { Separator } from "@/app/components/ui/separator"

interface MinistryContentTabProps {
    form: UseFormReturn<any>
}

export function MinistryContentTab({ form }: MinistryContentTabProps) {
    const { fields: testimonialFields, append: appendTestimonial, remove: removeTestimonial } = useFieldArray({
        control: form.control,
        name: "testimonials",
    })

    const { fields: faqFields, append: appendFaq, remove: removeFaq } = useFieldArray({
        control: form.control,
        name: "faqs",
    })

    return (
        <div className="space-y-6">
            {/* Testimonials */}
            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                        <MessageSquare className="h-5 w-5" />
                        Testimonials
                    </CardTitle>
                    <Button 
                        type="button" 
                        variant="outline" 
                        size="sm" 
                        onClick={() => appendTestimonial({ 
                            author: "", 
                            role: "", 
                            content: "" 
                        })}
                    >
                        <Plus className="mr-2 h-4 w-4" />
                        Add Testimonial
                    </Button>
                </CardHeader>
                <CardContent className="space-y-6">
                    {testimonialFields.length === 0 && (
                        <p className="text-sm text-muted-foreground text-center py-4">No testimonials added.</p>
                    )}

                    {testimonialFields.map((field, index) => (
                        <div key={field.id} className="relative p-4 border rounded-lg space-y-4">
                            <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="absolute right-2 top-2 text-muted-foreground hover:text-destructive"
                                onClick={() => removeTestimonial(index)}
                            >
                                <Trash2 className="h-4 w-4" />
                            </Button>

                            <div className="grid grid-cols-2 gap-4 pr-8">
                                <FormField
                                    control={form.control}
                                    name={`testimonials.${index}.author`}
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="text-xs">Author</FormLabel>
                                            <FormControl>
                                                <Input placeholder="Name" {...field} />
                                            </FormControl>
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name={`testimonials.${index}.role`}
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="text-xs">Role (Optional)</FormLabel>
                                            <FormControl>
                                                <Input placeholder="e.g. Parent, Student" {...field} />
                                            </FormControl>
                                        </FormItem>
                                    )}
                                />
                            </div>

                            <FormField
                                control={form.control}
                                name={`testimonials.${index}.content`}
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="text-xs">Quote</FormLabel>
                                        <FormControl>
                                            <Textarea placeholder="What did they say?" {...field} />
                                        </FormControl>
                                    </FormItem>
                                )}
                            />
                        </div>
                    ))}
                </CardContent>
            </Card>

            {/* FAQs */}
            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                        <HelpCircle className="h-5 w-5" />
                        Frequently Asked Questions
                    </CardTitle>
                    <Button 
                        type="button" 
                        variant="outline" 
                        size="sm" 
                        onClick={() => appendFaq({ 
                            question: "", 
                            answer: "" 
                        })}
                    >
                        <Plus className="mr-2 h-4 w-4" />
                        Add FAQ
                    </Button>
                </CardHeader>
                <CardContent className="space-y-6">
                    {faqFields.length === 0 && (
                        <p className="text-sm text-muted-foreground text-center py-4">No FAQs added.</p>
                    )}

                    {faqFields.map((field, index) => (
                        <div key={field.id} className="relative p-4 border rounded-lg space-y-4">
                            <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="absolute right-2 top-2 text-muted-foreground hover:text-destructive"
                                onClick={() => removeFaq(index)}
                            >
                                <Trash2 className="h-4 w-4" />
                            </Button>

                            <FormField
                                control={form.control}
                                name={`faqs.${index}.question`}
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="text-xs">Question</FormLabel>
                                        <FormControl>
                                            <Input placeholder="e.g. Is there parking?" className="font-medium" {...field} />
                                        </FormControl>
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name={`faqs.${index}.answer`}
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="text-xs">Answer</FormLabel>
                                        <FormControl>
                                            <Textarea placeholder="Answer..." {...field} />
                                        </FormControl>
                                    </FormItem>
                                )}
                            />
                        </div>
                    ))}
                </CardContent>
            </Card>
        </div>
    )
}
