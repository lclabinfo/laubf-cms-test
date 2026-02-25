"use client";

import { Button } from "@/app/components/ui/button"
import { Badge } from "@/app/components/ui/badge"
import { Separator } from "@/app/components/ui/separator"
import { 
    ArrowLeft, 
    Edit, 
    Trash2, 
    FileText, 
    Calendar, 
    User, 
    BookOpen, 
    Link as LinkIcon,
    Download
} from "lucide-react"
import { format } from "date-fns"
import { type Study, mockSermons } from "@/app/data/store"

interface BibleStudyDetailProps {
    study: Study
    onBack: () => void
    onEdit: () => void
    onDelete: () => void
}

export function BibleStudyDetail({ study, onBack, onEdit, onDelete }: BibleStudyDetailProps) {
    const linkedSermon = study.linkedSermonId ? mockSermons.find(s => s.id === study.linkedSermonId) : null;

    return (
        <div className="space-y-6 animate-in fade-in duration-300">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" onClick={onBack}>
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                    <div>
                        <h2 className="text-2xl font-bold tracking-tight">{study.title}</h2>
                        <div className="flex items-center gap-2 text-muted-foreground mt-1">
                            <Badge variant={study.status === "published" ? "default" : "secondary"}>
                                {study.status}
                            </Badge>
                            <span>•</span>
                            <span className="text-sm">Last modified {format(new Date(study.lastModified), "MMM d, yyyy")}</span>
                        </div>
                    </div>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" onClick={onEdit}>
                        <Edit className="mr-2 h-4 w-4" />
                        Edit
                    </Button>
                    <Button variant="outline" className="text-destructive hover:text-destructive" onClick={onDelete}>
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete
                    </Button>
                </div>
            </div>

            <Separator />

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Main Content */}
                <div className="lg:col-span-2 space-y-8">
                    {/* Questions Section */}
                    <div className="space-y-4">
                        <h3 className="text-lg font-semibold flex items-center gap-2">
                            <FileText className="h-5 w-5 text-primary" />
                            Discussion Questions
                        </h3>
                        <div className="bg-muted/30 p-6 rounded-lg border min-h-[200px] whitespace-pre-wrap">
                            {study.questionsContent || "No questions content available."}
                        </div>
                    </div>

                    {/* Guide Section */}
                    {study.guideContent && (
                        <div className="space-y-4">
                            <h3 className="text-lg font-semibold flex items-center gap-2">
                                <BookOpen className="h-5 w-5 text-primary" />
                                Leader's Guide
                            </h3>
                            <div className="bg-muted/30 p-6 rounded-lg border min-h-[200px] whitespace-pre-wrap">
                                {study.guideContent}
                            </div>
                        </div>
                    )}
                </div>

                {/* Sidebar */}
                <div className="space-y-6">
                    {/* Metadata Card */}
                    <div className="rounded-lg border bg-card p-4 space-y-4">
                        <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider">Details</h3>
                        
                        <div className="space-y-3">
                            <div className="flex items-center gap-3">
                                <BookOpen className="h-4 w-4 text-muted-foreground" />
                                <div>
                                    <div className="text-sm font-medium">Passage</div>
                                    <div className="text-sm text-muted-foreground">{study.passage}</div>
                                </div>
                            </div>
                            
                            <div className="flex items-center gap-3">
                                <User className="h-4 w-4 text-muted-foreground" />
                                <div>
                                    <div className="text-sm font-medium">Author</div>
                                    <div className="text-sm text-muted-foreground">{study.author}</div>
                                </div>
                            </div>
                            
                            {study.series && (
                                <div className="flex items-center gap-3">
                                    <FileText className="h-4 w-4 text-muted-foreground" />
                                    <div>
                                        <div className="text-sm font-medium">Series</div>
                                        <div className="text-sm text-muted-foreground">{study.series}</div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Linked Sermon Card */}
                    <div className="rounded-lg border bg-card p-4 space-y-4">
                        <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider">Linked Sermon</h3>
                        
                        {linkedSermon ? (
                            <div className="flex items-start gap-3 p-3 bg-blue-50/50 rounded-md border border-blue-100">
                                <div className="mt-1 bg-blue-100 p-1.5 rounded-full">
                                    <LinkIcon className="h-3 w-3 text-blue-700" />
                                </div>
                                <div>
                                    <div className="text-sm font-medium text-blue-900">{linkedSermon.title}</div>
                                    <div className="text-xs text-blue-700">{linkedSermon.speaker} • {format(new Date(linkedSermon.date), "MMM d")}</div>
                                </div>
                            </div>
                        ) : (
                            <div className="text-sm text-muted-foreground italic">
                                No sermon linked.
                                <Button variant="link" size="sm" className="px-0 ml-1 h-auto" onClick={onEdit}>
                                    Link now
                                </Button>
                            </div>
                        )}
                    </div>
                    
                    <Button variant="outline" className="w-full">
                        <Download className="mr-2 h-4 w-4" />
                        Download PDF
                    </Button>
                </div>
            </div>
        </div>
    )
}
