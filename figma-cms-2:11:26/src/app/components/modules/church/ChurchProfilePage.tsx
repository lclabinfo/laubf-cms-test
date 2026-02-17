"use client";

import { useState } from "react"
import { useForm, useFieldArray, Controller } from "react-hook-form"
import { Building2, MapPin, Phone, Mail, Clock, Globe, Plus, Trash2, Save, Facebook, Instagram, Youtube, Twitter } from "lucide-react"
import { Button } from "@/app/components/ui/button"
import { Input } from "@/app/components/ui/input"
import { Label } from "@/app/components/ui/label"
import { Textarea } from "@/app/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/app/components/ui/select"
import { Separator } from "@/app/components/ui/separator"
import { cn } from "@/app/components/ui/utils"
import { toast } from "sonner"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/app/components/ui/card"
import { PageHeader } from "./shared/PageLayout"

// Types
type SocialLink = {
    platform: string;
    url: string;
}

type ScheduleItem = {
    day: string;
    openTime: string;
    closeTime: string;
    description?: string; // e.g. "Sunday Service", "Office Hours"
}

type ChurchProfileForm = {
    name: string;
    description: string;
    address: {
        street: string;
        city: string;
        state: string;
        zip: string;
        country: string;
        notes: string; // "Additional comment"
    };
    emails: { value: string; label: string }[];
    phones: { value: string; label: string }[];
    schedule: ScheduleItem[];
    socials: {
        facebook: string;
        instagram: string;
        youtube: string;
        x: string;
        custom: SocialLink[];
    };
}

const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

const INITIAL_DATA: ChurchProfileForm = {
    name: "Grace Community Church",
    description: "A welcoming community dedicated to faith, hope, and love.",
    address: {
        street: "123 Faith Avenue",
        city: "Springfield",
        state: "IL",
        zip: "62704",
        country: "USA",
        notes: "Visitor parking is available on the north side of the building. Main entrance is through the glass doors."
    },
    emails: [
        { label: "General Inquiries", value: "info@gracecommunity.org" },
        { label: "Prayer Requests", value: "prayer@gracecommunity.org" }
    ],
    phones: [
        { label: "Main Office", value: "(555) 123-4567" }
    ],
    schedule: [
        { day: "Sunday", openTime: "09:00", closeTime: "12:00", description: "Sunday Service" },
        { day: "Wednesday", openTime: "18:30", closeTime: "20:00", description: "Bible Study" }
    ],
    socials: {
        facebook: "",
        instagram: "",
        youtube: "",
        x: "",
        custom: []
    }
}

export function ChurchProfilePage() {
    const [isSaving, setIsSaving] = useState(false);

    const { register, control, handleSubmit, formState: { errors } } = useForm<ChurchProfileForm>({
        defaultValues: INITIAL_DATA
    });

    const { fields: emailFields, append: appendEmail, remove: removeEmail } = useFieldArray({
        control,
        name: "emails"
    });

    const { fields: phoneFields, append: appendPhone, remove: removePhone } = useFieldArray({
        control,
        name: "phones"
    });

    const { fields: scheduleFields, append: appendSchedule, remove: removeSchedule } = useFieldArray({
        control,
        name: "schedule"
    });

    const { fields: customSocialFields, append: appendCustomSocial, remove: removeCustomSocial } = useFieldArray({
        control,
        name: "socials.custom"
    });

    const onSubmit = async (data: ChurchProfileForm) => {
        setIsSaving(true);
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 1000));
        console.log("Form Data:", data);
        toast.success("Church profile updated successfully");
        setIsSaving(false);
    };

    return (
        <div className="flex flex-col gap-4 pb-20">
            <PageHeader
                title="Church Profile"
                description="Manage your church's public identity, location, and contact information."
                actions={(
                    <Button onClick={handleSubmit(onSubmit)} disabled={isSaving}>
                        {isSaving ? (
                            <>Saving...</>
                        ) : (
                            <>
                                <Save className="mr-2 h-4 w-4" />
                                Save Changes
                            </>
                        )}
                    </Button>
                )}
            />

            <Separator />

            <div className="max-w-5xl mx-auto w-full">
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
                    {/* 1. Basic Info */}
                    <section className="space-y-4">
                        <div className="flex items-center gap-2 text-lg font-semibold text-primary">
                            <Building2 className="h-5 w-5" />
                            <h2>Identity & Description</h2>
                        </div>
                        <Card>
                            <CardHeader>
                                <CardTitle>Basic Information</CardTitle>
                                <CardDescription>The core details that identify your church.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="grid gap-2">
                                    <Label htmlFor="name">Church Name</Label>
                                    <Input 
                                        id="name" 
                                        {...register("name", { required: "Church name is required" })} 
                                        placeholder="e.g. Grace Community Church"
                                    />
                                    {errors.name && <span className="text-xs text-destructive">{errors.name.message}</span>}
                                </div>
                                
                                <div className="grid gap-2">
                                    <Label htmlFor="description">Description</Label>
                                    <Textarea 
                                        id="description" 
                                        {...register("description")} 
                                        placeholder="A brief description of your church's mission and values..."
                                        className="min-h-[100px]"
                                    />
                                    <p className="text-xs text-muted-foreground">
                                        This description may be used in search results and your website footer.
                                    </p>
                                </div>
                            </CardContent>
                        </Card>
                    </section>

                    {/* 2. Location */}
                    <section className="space-y-4">
                        <div className="flex items-center gap-2 text-lg font-semibold text-primary">
                            <MapPin className="h-5 w-5" />
                            <h2>Location</h2>
                        </div>
                        <Card>
                            <CardHeader>
                                <CardTitle>Address & Directions</CardTitle>
                                <CardDescription>Where people can find you.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="grid gap-2">
                                    <Label htmlFor="street">Street Address</Label>
                                    <Input id="street" {...register("address.street")} placeholder="123 Faith Avenue" />
                                </div>
                                
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                    <div className="grid gap-2 col-span-2">
                                        <Label htmlFor="city">City</Label>
                                        <Input id="city" {...register("address.city")} placeholder="Springfield" />
                                    </div>
                                    <div className="grid gap-2">
                                        <Label htmlFor="state">State / Province</Label>
                                        <Input id="state" {...register("address.state")} placeholder="IL" />
                                    </div>
                                    <div className="grid gap-2">
                                        <Label htmlFor="zip">Zip / Postal Code</Label>
                                        <Input id="zip" {...register("address.zip")} placeholder="62704" />
                                    </div>
                                </div>

                                <div className="grid gap-2">
                                    <Label htmlFor="notes">Additional Location Notes (Optional)</Label>
                                    <Textarea 
                                        id="notes" 
                                        {...register("address.notes")} 
                                        placeholder="Parking instructions, specific entrance details, etc."
                                    />
                                </div>
                            </CardContent>
                        </Card>
                    </section>

                    {/* 3. Contact Info */}
                    <section className="space-y-4">
                        <div className="flex items-center gap-2 text-lg font-semibold text-primary">
                            <Phone className="h-5 w-5" />
                            <h2>Contact Information</h2>
                        </div>
                        <div className="grid md:grid-cols-2 gap-6">
                            {/* Emails */}
                            <Card>
                                <CardHeader className="pb-3">
                                    <CardTitle className="text-base">Email Addresses</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    {emailFields.map((field, index) => (
                                        <div key={field.id} className="flex gap-2 items-start">
                                            <div className="grid gap-2 flex-1">
                                                <Input 
                                                    {...register(`emails.${index}.label`)} 
                                                    placeholder="Label (e.g. General)" 
                                                    className="h-8 text-xs"
                                                />
                                                <div className="relative">
                                                    <Mail className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                                    <Input 
                                                        {...register(`emails.${index}.value` as const, { required: true })} 
                                                        placeholder="email@example.com" 
                                                        className="pl-9"
                                                    />
                                                </div>
                                            </div>
                                            <Button 
                                                type="button" 
                                                variant="ghost" 
                                                size="icon" 
                                                className="mt-6 text-muted-foreground hover:text-destructive"
                                                onClick={() => removeEmail(index)}
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    ))}
                                    <Button 
                                        type="button" 
                                        variant="outline" 
                                        size="sm" 
                                        className="w-full border-dashed"
                                        onClick={() => appendEmail({ label: "", value: "" })}
                                    >
                                        <Plus className="mr-2 h-4 w-4" /> Add Email
                                    </Button>
                                </CardContent>
                            </Card>

                            {/* Phones */}
                            <Card>
                                <CardHeader className="pb-3">
                                    <CardTitle className="text-base">Phone Numbers</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    {phoneFields.map((field, index) => (
                                        <div key={field.id} className="flex gap-2 items-start">
                                            <div className="grid gap-2 flex-1">
                                                <Input 
                                                    {...register(`phones.${index}.label`)} 
                                                    placeholder="Label (e.g. Main Office)" 
                                                    className="h-8 text-xs"
                                                />
                                                <div className="relative">
                                                    <Phone className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                                    <Input 
                                                        {...register(`phones.${index}.value` as const, { required: true })} 
                                                        placeholder="(555) 555-5555" 
                                                        className="pl-9"
                                                    />
                                                </div>
                                            </div>
                                            <Button 
                                                type="button" 
                                                variant="ghost" 
                                                size="icon" 
                                                className="mt-6 text-muted-foreground hover:text-destructive"
                                                onClick={() => removePhone(index)}
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    ))}
                                    <Button 
                                        type="button" 
                                        variant="outline" 
                                        size="sm" 
                                        className="w-full border-dashed"
                                        onClick={() => appendPhone({ label: "", value: "" })}
                                    >
                                        <Plus className="mr-2 h-4 w-4" /> Add Phone
                                    </Button>
                                </CardContent>
                            </Card>
                        </div>
                    </section>

                    {/* 4. Hours / Schedule */}
                    <section className="space-y-4">
                        <div className="flex items-center gap-2 text-lg font-semibold text-primary">
                            <Clock className="h-5 w-5" />
                            <h2>Service Times & Office Hours</h2>
                        </div>
                        <Card>
                            <CardHeader>
                                <CardTitle>Weekly Schedule</CardTitle>
                                <CardDescription>Regular service times and operating hours.</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                    <div className="grid grid-cols-12 gap-4 font-medium text-sm text-muted-foreground mb-2 px-1">
                                        <div className="col-span-3">Day</div>
                                        <div className="col-span-3">Start Time</div>
                                        <div className="col-span-3">End Time</div>
                                        <div className="col-span-2">Description</div>
                                        <div className="col-span-1"></div>
                                    </div>
                                    {scheduleFields.map((field, index) => (
                                        <div key={field.id} className="grid grid-cols-12 gap-4 items-start">
                                            <div className="col-span-3">
                                                <Controller
                                                    control={control}
                                                    name={`schedule.${index}.day`}
                                                    render={({ field }) => (
                                                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                            <SelectTrigger>
                                                                <SelectValue placeholder="Select day" />
                                                            </SelectTrigger>
                                                            <SelectContent>
                                                                {DAYS.map(day => (
                                                                    <SelectItem key={day} value={day}>{day}</SelectItem>
                                                                ))}
                                                            </SelectContent>
                                                        </Select>
                                                    )}
                                                />
                                            </div>
                                            <div className="col-span-3">
                                                <Input type="time" {...register(`schedule.${index}.openTime`)} />
                                            </div>
                                            <div className="col-span-3">
                                                <Input type="time" {...register(`schedule.${index}.closeTime`)} />
                                            </div>
                                            <div className="col-span-2">
                                                <Input {...register(`schedule.${index}.description`)} placeholder="Service" />
                                            </div>
                                            <div className="col-span-1 flex justify-end">
                                                <Button 
                                                    type="button" 
                                                    variant="ghost" 
                                                    size="icon"
                                                    onClick={() => removeSchedule(index)}
                                                    className="text-muted-foreground hover:text-destructive"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </div>
                                    ))}
                                    <Button 
                                        type="button" 
                                        variant="outline" 
                                        size="sm" 
                                        className="border-dashed"
                                        onClick={() => appendSchedule({ day: "Sunday", openTime: "09:00", closeTime: "10:30", description: "" })}
                                    >
                                        <Plus className="mr-2 h-4 w-4" /> Add Schedule Item
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    </section>

                    {/* 5. Social Media */}
                    <section className="space-y-4">
                        <div className="flex items-center gap-2 text-lg font-semibold text-primary">
                            <Globe className="h-5 w-5" />
                            <h2>Social Media</h2>
                        </div>
                        <Card>
                            <CardHeader>
                                <CardTitle>Social Accounts</CardTitle>
                                <CardDescription>Connect your visitors to your online presence.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <div className="grid gap-4 max-w-xl">
                                    <div className="flex items-center gap-3">
                                        <Facebook className="h-5 w-5 text-blue-600 shrink-0" />
                                        <Input {...register("socials.facebook")} placeholder="Facebook Profile URL" />
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <Instagram className="h-5 w-5 text-pink-600 shrink-0" />
                                        <Input {...register("socials.instagram")} placeholder="Instagram Profile URL" />
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <Youtube className="h-5 w-5 text-red-600 shrink-0" />
                                        <Input {...register("socials.youtube")} placeholder="YouTube Channel URL" />
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <Twitter className="h-5 w-5 text-black shrink-0" />
                                        <Input {...register("socials.x")} placeholder="X (Twitter) Profile URL" />
                                    </div>
                                </div>

                                <Separator />

                                <div className="space-y-4">
                                    <div className="text-sm font-medium">Custom Links</div>
                                    {customSocialFields.map((field, index) => (
                                        <div key={field.id} className="flex gap-2 items-center">
                                            <div className="grid gap-2 flex-1 grid-cols-2">
                                                <Input 
                                                    {...register(`socials.custom.${index}.platform`)} 
                                                    placeholder="Platform Name (e.g. Spotify)" 
                                                />
                                                <Input 
                                                    {...register(`socials.custom.${index}.url`)} 
                                                    placeholder="URL" 
                                                />
                                            </div>
                                            <Button 
                                                type="button" 
                                                variant="ghost" 
                                                size="icon" 
                                                onClick={() => removeCustomSocial(index)}
                                                className="text-muted-foreground hover:text-destructive"
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    ))}
                                    <Button 
                                        type="button" 
                                        variant="outline" 
                                        size="sm" 
                                        className="border-dashed"
                                        onClick={() => appendCustomSocial({ platform: "", url: "" })}
                                    >
                                        <Plus className="mr-2 h-4 w-4" /> Add Custom Link
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    </section>
                </form>
            </div>
        </div>
    )
}
