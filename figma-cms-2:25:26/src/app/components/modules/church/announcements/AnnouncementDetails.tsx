"use client";

import { useState } from "react";
import { format } from "date-fns";
import { 
    CalendarIcon, 
    ArrowLeft, 
    Edit, 
    Trash2, 
    Mail, 
    Send,
    Download,
    Eye,
    CheckCircle2,
    Paperclip,
    History,
    AlertCircle
} from "lucide-react";
import { Button } from "@/app/components/ui/button";
import { Badge } from "@/app/components/ui/badge";
import { Separator } from "@/app/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/app/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/app/components/ui/card";
import { Input } from "@/app/components/ui/input";
import { Label } from "@/app/components/ui/label";
import { RichTextEditor } from "@/app/components/ui/rich-text-editor";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/app/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/app/components/ui/select";
import { mockAnnouncements } from "./data";
import { cn } from "@/app/components/ui/utils";

interface AnnouncementDetailsProps {
    id: string;
    onBack: () => void;
    onEdit: (id: string) => void;
}

export function AnnouncementDetails({ id, onBack, onEdit }: AnnouncementDetailsProps) {
    const announcement = mockAnnouncements.find(a => a.id === id);
    const [activeTab, setActiveTab] = useState("preview");
    
    // Email Form State
    const [emailSubject, setEmailSubject] = useState(announcement?.title || "");
    const [emailContent, setEmailContent] = useState(announcement?.content || "");

    if (!announcement) {
        return <div>Announcement not found</div>;
    }

    const lastLog = announcement.emailLogs.length > 0 ? announcement.emailLogs[0] : null;

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" onClick={onBack}>
                        <ArrowLeft className="h-4 w-4" />
                    </Button>
                    <div>
                        <div className="flex items-center gap-3">
                            <h2 className="text-xl font-bold tracking-tight">{announcement.title}</h2>
                            <Badge variant={announcement.status === 'published' ? 'default' : 'secondary'}>
                                {announcement.status}
                            </Badge>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                            <span>{announcement.ministry}</span>
                            <span>•</span>
                            <span>{format(announcement.publishDate, "PPP")}</span>
                            <span>•</span>
                            <span>By {announcement.author}</span>
                        </div>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="outline" onClick={() => onEdit(id)}>
                        <Edit className="mr-2 h-4 w-4" /> Edit
                    </Button>
                    <Button variant="destructive" size="icon">
                        <Trash2 className="h-4 w-4" />
                    </Button>
                </div>
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
                <TabsList>
                    <TabsTrigger value="preview">Preview & Details</TabsTrigger>
                    <TabsTrigger value="email">Email Blast</TabsTrigger>
                </TabsList>

                {/* Preview Tab */}
                <TabsContent value="preview" className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="md:col-span-2 space-y-6">
                            {/* Main Content Card */}
                            <Card>
                                <CardContent className="p-8">
                                    <div 
                                        className="prose prose-sm md:prose-base dark:prose-invert max-w-none"
                                        dangerouslySetInnerHTML={{ __html: announcement.content }}
                                    />
                                    
                                    {/* Attachments Display */}
                                    {announcement.attachments.length > 0 && (
                                        <div className="mt-8 pt-6 border-t">
                                            <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
                                                <Paperclip className="h-4 w-4" /> Attachments
                                            </h4>
                                            <div className="flex flex-wrap gap-2">
                                                {announcement.attachments.map(att => (
                                                    <Button key={att.id} variant="outline" size="sm" className="h-auto py-2">
                                                        <Download className="mr-2 h-3 w-3" />
                                                        {att.name}
                                                    </Button>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        </div>
                        
                        <div className="space-y-6">
                            {/* Stats Card */}
                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-sm font-medium">Engagement</CardTitle>
                                </CardHeader>
                                <CardContent className="grid grid-cols-2 gap-4">
                                    <div>
                                        <div className="text-2xl font-bold">{announcement.views}</div>
                                        <p className="text-xs text-muted-foreground">Total Views</p>
                                    </div>
                                    <div>
                                        <div className="text-2xl font-bold">{announcement.clicks}</div>
                                        <p className="text-xs text-muted-foreground">Link Clicks</p>
                                    </div>
                                    {lastLog && (
                                        <div className="col-span-2 pt-4 border-t mt-2">
                                            <div className="text-sm font-medium text-green-600 flex items-center gap-2">
                                                <CheckCircle2 className="h-3 w-3" /> Email Sent
                                            </div>
                                            <p className="text-xs text-muted-foreground mt-1">
                                                Last sent: {format(lastLog.sentDate, "MMM d, yyyy")}
                                            </p>
                                            <div className="mt-2 flex items-center justify-between text-xs">
                                                <span>Open Rate</span>
                                                <span className="font-medium">{lastLog.openRate}%</span>
                                            </div>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>

                            {/* Info Card */}
                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-sm font-medium">Metadata</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4 text-sm">
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">Category</span>
                                        <span className="font-medium capitalize">{announcement.category}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">Ministry</span>
                                        <span className="font-medium">{announcement.ministry}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">Pinned</span>
                                        <span className="font-medium">{announcement.isPinned ? "Yes" : "No"}</span>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                </TabsContent>

                {/* Email Tab */}
                <TabsContent value="email" className="space-y-6">
                    {/* Compose Card */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Compose Email</CardTitle>
                            <CardDescription>
                                Customize the message before sending to your congregation.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="grid gap-4 md:grid-cols-2">
                                <div className="space-y-2">
                                    <Label>Subject Line</Label>
                                    <Input 
                                        value={emailSubject}
                                        onChange={(e) => setEmailSubject(e.target.value)}
                                        placeholder="Enter email subject"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Recipients</Label>
                                    <Select defaultValue={announcement.ministry === "Church Wide" ? "all" : "ministry"}>
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">All Members</SelectItem>
                                            <SelectItem value="ministry">Ministry Group: {announcement.ministry}</SelectItem>
                                            <SelectItem value="leaders">Leadership Only</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                            
                            <div className="space-y-2">
                                <Label>Email Content</Label>
                                <RichTextEditor 
                                    value={emailContent} 
                                    onChange={setEmailContent}
                                    className="min-h-[300px]"
                                />
                                <p className="text-xs text-muted-foreground">
                                    Changes made here only affect the email and do not update the original announcement.
                                </p>
                            </div>
                        </CardContent>
                        <CardFooter className="flex justify-between border-t p-6">
                            <div className="text-sm text-muted-foreground">
                                {announcement.emailLogs.length > 0 && (
                                    <span className="flex items-center gap-2 text-yellow-600">
                                        <AlertCircle className="h-4 w-4" />
                                        Warning: This announcement has already been sent {announcement.emailLogs.length} time(s).
                                    </span>
                                )}
                            </div>
                            <div className="flex gap-2">
                                <Button variant="outline">
                                    <Eye className="mr-2 h-4 w-4" /> Send Test
                                </Button>
                                <Button>
                                    <Send className="mr-2 h-4 w-4" /> Send Now
                                </Button>
                            </div>
                        </CardFooter>
                    </Card>

                    {/* Email History Log */}
                    <Card>
                         <CardHeader>
                            <div className="flex items-center gap-2">
                                <History className="h-5 w-5" />
                                <CardTitle>Sent History</CardTitle>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Date Sent</TableHead>
                                        <TableHead>Subject</TableHead>
                                        <TableHead>Recipients</TableHead>
                                        <TableHead>Open Rate</TableHead>
                                        <TableHead>Status</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {announcement.emailLogs.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={5} className="text-center text-muted-foreground h-24">
                                                No emails have been sent for this announcement yet.
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        announcement.emailLogs.map((log) => (
                                            <TableRow key={log.id}>
                                                <TableCell className="font-medium">
                                                    {format(log.sentDate, "MMM d, yyyy h:mm a")}
                                                </TableCell>
                                                <TableCell>{log.subject}</TableCell>
                                                <TableCell>
                                                    <div className="flex flex-col">
                                                        <span>{log.recipients}</span>
                                                        <span className="text-xs text-muted-foreground">{log.recipientCount} recipients</span>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    {log.openRate ? `${log.openRate}%` : "-"}
                                                </TableCell>
                                                <TableCell>
                                                    <Badge variant={log.status === "sent" ? "default" : "secondary"}>
                                                        {log.status}
                                                    </Badge>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}
