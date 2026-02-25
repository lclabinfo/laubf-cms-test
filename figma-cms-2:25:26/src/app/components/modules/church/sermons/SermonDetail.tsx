"use client";

import { Button } from "@/app/components/ui/button"
import { Badge } from "@/app/components/ui/badge"
import { Separator } from "@/app/components/ui/separator"
import { 
    ArrowLeft, 
    Edit, 
    Trash2, 
    Calendar, 
    User, 
    BookOpen, 
    Link as LinkIcon,
    Youtube,
    Eye,
    Share2,
    FileText
} from "lucide-react"
import { format } from "date-fns"
import { type Sermon, mockStudies } from "@/app/data/store"

interface SermonDetailProps {
    sermon: Sermon
    onBack: () => void
    onEdit: () => void
    onDelete: () => void
}

function getYouTubeId(url?: string) {
    if (!url) return null;
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
}

export function SermonDetail({ sermon, onBack, onEdit, onDelete }: SermonDetailProps) {
    const videoId = getYouTubeId(sermon.videoUrl);
    const linkedStudy = sermon.bibleStudyId ? mockStudies.find(s => s.id === sermon.bibleStudyId) : null;

    return (
        <div className="space-y-6 animate-in fade-in duration-300">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" onClick={onBack}>
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                    <div>
                        <h2 className="text-2xl font-bold tracking-tight">{sermon.title}</h2>
                        <div className="flex items-center gap-2 text-muted-foreground mt-1">
                            <Badge variant={sermon.status === "published" ? "default" : "secondary"}>
                                {sermon.status}
                            </Badge>
                            <span>•</span>
                            <span className="text-sm">Preached on {format(new Date(sermon.date), "MMM d, yyyy")}</span>
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
                    {/* Video Player */}
                    <div className="aspect-video bg-black rounded-lg overflow-hidden shadow-md">
                         {videoId ? (
                            <iframe 
                                width="100%" 
                                height="100%" 
                                src={`https://www.youtube.com/embed/${videoId}`} 
                                title="YouTube video player" 
                                frameBorder="0" 
                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                                allowFullScreen
                                className="w-full h-full"
                            ></iframe>
                        ) : (
                            <div className="w-full h-full flex flex-col items-center justify-center text-muted-foreground">
                                <Youtube className="h-16 w-16 mb-4 opacity-50" />
                                <p>No video linked</p>
                            </div>
                        )}
                    </div>

                    {/* Description */}
                    <div className="space-y-4">
                        <h3 className="text-lg font-semibold">Description</h3>
                        <p className="text-muted-foreground leading-relaxed">
                            {sermon.description || "No description provided."}
                        </p>
                    </div>

                    {/* Transcript Preview */}
                    <div className="space-y-4">
                        <h3 className="text-lg font-semibold">Transcript</h3>
                        <div className="bg-muted/30 p-4 rounded-lg border max-h-[300px] overflow-y-auto font-mono text-sm whitespace-pre-wrap">
                            {sermon.transcript || "No transcript available."}
                        </div>
                    </div>
                </div>

                {/* Sidebar */}
                <div className="space-y-6">
                    {/* Metadata Card */}
                    <div className="rounded-lg border bg-card p-4 space-y-4">
                        <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider">Details</h3>
                        
                        <div className="space-y-3">
                            <div className="flex items-center gap-3">
                                <User className="h-4 w-4 text-muted-foreground" />
                                <div>
                                    <div className="text-sm font-medium">Speaker</div>
                                    <div className="text-sm text-muted-foreground">{sermon.speaker}</div>
                                </div>
                            </div>

                            <div className="flex items-center gap-3">
                                <BookOpen className="h-4 w-4 text-muted-foreground" />
                                <div>
                                    <div className="text-sm font-medium">Passage</div>
                                    <div className="text-sm text-muted-foreground">{sermon.passage || "-"}</div>
                                </div>
                            </div>
                            
                            <div className="flex items-center gap-3">
                                <FileText className="h-4 w-4 text-muted-foreground" />
                                <div>
                                    <div className="text-sm font-medium">Series</div>
                                    <div className="text-sm text-muted-foreground">{sermon.series || "-"}</div>
                                </div>
                            </div>
                            
                            <div className="flex items-center gap-3">
                                <Eye className="h-4 w-4 text-muted-foreground" />
                                <div>
                                    <div className="text-sm font-medium">Views</div>
                                    <div className="text-sm text-muted-foreground">{sermon.views.toLocaleString()}</div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Linked Study Card */}
                    <div className="rounded-lg border bg-card p-4 space-y-4">
                        <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider">Linked Bible Study</h3>
                        
                        {linkedStudy ? (
                            <div className="flex items-start gap-3 p-3 bg-purple-50/50 rounded-md border border-purple-100">
                                <div className="mt-1 bg-purple-100 p-1.5 rounded-full">
                                    <FileText className="h-3 w-3 text-purple-700" />
                                </div>
                                <div>
                                    <div className="text-sm font-medium text-purple-900">{linkedStudy.title}</div>
                                    <div className="text-xs text-purple-700">{linkedStudy.passage}</div>
                                </div>
                            </div>
                        ) : (
                            <div className="text-sm text-muted-foreground italic">
                                No study linked.
                                <Button variant="link" size="sm" className="px-0 ml-1 h-auto" onClick={onEdit}>
                                    Link now
                                </Button>
                            </div>
                        )}
                    </div>
                    
                    <Button variant="outline" className="w-full">
                        <Share2 className="mr-2 h-4 w-4" />
                        Share Sermon
                    </Button>
                </div>
            </div>
        </div>
    )
}
