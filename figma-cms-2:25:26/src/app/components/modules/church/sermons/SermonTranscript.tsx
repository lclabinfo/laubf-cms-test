"use client";

import { useState, useEffect, useRef } from "react"
import { Button } from "@/app/components/ui/button"
import { Textarea } from "@/app/components/ui/textarea"
import { 
    FileText, 
    Upload, 
    Youtube, 
    Wand2, 
    Play, 
    Plus, 
    Trash2, 
    Download, 
    AlignLeft,
    ListVideo,
    Check,
    AlertCircle
} from "lucide-react"
import { ScrollArea } from "@/app/components/ui/scroll-area"
import { Separator } from "@/app/components/ui/separator"
import { cn } from "@/app/components/ui/utils"
import { Alert, AlertDescription, AlertTitle } from "@/app/components/ui/alert"

interface TranscriptSegment {
    id: string;
    timestamp: string;
    text: string;
}

interface SermonTranscriptProps {
    videoId?: string | null;
    initialTranscript?: string;
    onChange: (transcript: string) => void;
}

export function SermonTranscript({ videoId, initialTranscript, onChange }: SermonTranscriptProps) {
    // Mode state: 'raw' or 'synced'
    const [mode, setMode] = useState<"raw" | "synced">("synced")
    
    // Data states
    const [rawText, setRawText] = useState("")
    const [segments, setSegments] = useState<TranscriptSegment[]>([])
    
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [successMessage, setSuccessMessage] = useState<string | null>(null)

    // Hidden file input refs
    const rawFileRef = useRef<HTMLInputElement>(null)
    const captionFileRef = useRef<HTMLInputElement>(null)

    // Initialize state
    useEffect(() => {
        if (!initialTranscript && segments.length === 0 && !rawText) {
             setSegments([
                { id: "1", timestamp: "00:00", text: "Welcome everyone to our service today." },
                { id: "2", timestamp: "00:15", text: "We are so glad you are joining us from wherever you are." },
                { id: "3", timestamp: "00:45", text: "Today we are continuing our series on Faith." },
            ])
        }
    }, [])

    // --- Sync Logic: Live -> Raw ---
    // Whenever segments change, update the raw text representation automatically
    useEffect(() => {
        if (segments.length > 0) {
            const textContent = segments.map(s => s.text).join('\n\n');
            setRawText(textContent);
        }
    }, [segments]);

    // --- Parent Sync: Report changes to parent form ---
    useEffect(() => {
        // Serialize the current state to a string format for storage
        // If we have segments, prefer that (richer data). Otherwise raw text.
        let val = "";
        if (segments.length > 0) {
            val = segments.map(s => `[${s.timestamp}] ${s.text}`).join('\n');
        } else {
            val = rawText;
        }
        onChange(val);
    }, [segments, rawText, onChange]);

    // Clear messages on mode change
    useEffect(() => {
        setError(null)
        setSuccessMessage(null)
    }, [mode])

    // --- Helpers ---

    const showSuccess = (msg: string) => {
        setSuccessMessage(msg)
        setTimeout(() => setSuccessMessage(null), 3000)
    }

    const showError = (msg: string) => {
        setError(msg)
        setTimeout(() => setError(null), 4000)
    }

    // --- Raw Mode Handlers ---

    const handleRawFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return;

        setIsLoading(true)
        setTimeout(() => {
            setRawText("This is the imported text from your file.\nIt has been successfully loaded into the editor.\nYou can now edit this text or use AI to generate timestamps.")
            setIsLoading(false)
            showSuccess(`Imported ${file.name}`)
        }, 800)
    }

    const handleConvertToSynced = () => {
        if (!rawText.trim()) {
            showError("Please enter some text first.")
            return
        }

        setIsLoading(true)
        setTimeout(() => {
            const lines = rawText.split('\n').filter(l => l.trim())
            const newSegments = lines.map((line, i) => ({
                id: `ai-${Date.now()}-${i}`,
                timestamp: `00:${(i * 5).toString().padStart(2, '0')}`, 
                text: line
            }))
            
            if (newSegments.length === 0) {
                 newSegments.push({ id: 'err', timestamp: '00:00', text: rawText })
            }

            setSegments(newSegments)
            setMode("synced")
            setIsLoading(false)
            showSuccess("Text aligned with video successfully!")
        }, 1500)
    }

    // --- Synced Mode Handlers ---

    const handleCaptionFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return;

        setIsLoading(true)
        setTimeout(() => {
            setSegments([
                { id: "file-1", timestamp: "00:00", text: "[Imported from .srt file]" },
                { id: "file-2", timestamp: "00:10", text: "This content represents captions uploaded from your computer." }
            ])
            setIsLoading(false)
            showSuccess(`Imported captions from ${file.name}`)
        }, 1000)
    }

    const handleImportYouTube = () => {
        if (!videoId) {
            showError("No YouTube video found. Please add a video URL in the Details tab.")
            return;
        }

        setIsLoading(true)
        setTimeout(() => {
            const newSegments = [
                { id: "yt-1", timestamp: "00:00", text: "[Music playing]" },
                { id: "yt-2", timestamp: "00:23", text: "Good morning church!" },
                { id: "yt-3", timestamp: "00:25", text: "It is wonderful to be here with you." },
                { id: "yt-4", timestamp: "01:12", text: "Open your bibles to Hebrews chapter 11." },
            ];
            setSegments(newSegments);
            // Raw text update is handled by the useEffect
            setIsLoading(false)
            showSuccess("Captions imported from YouTube")
        }, 1200)
    }

    const handleGenerateFromAudio = () => {
        setIsLoading(true)
        setTimeout(() => {
            setSegments([
                { id: "audio-1", timestamp: "00:00", text: "Welcome." },
                { id: "audio-2", timestamp: "00:02", text: "This transcript was generated directly from the video audio." },
                { id: "audio-3", timestamp: "00:08", text: "Our AI analyzed the speech track." }
            ])
            setIsLoading(false)
            showSuccess("Transcript generated from audio")
        }, 2000)
    }

    // --- Shared Handlers ---

    const handleSegmentChange = (id: string, field: keyof TranscriptSegment, value: string) => {
        setSegments(prev => prev.map(seg => 
            seg.id === id ? { ...seg, [field]: value } : seg
        ))
    }

    const handleDeleteSegment = (id: string) => {
        setSegments(prev => prev.filter(seg => seg.id !== id))
    }

    const handleAddSegment = () => {
        const lastTimestamp = segments[segments.length - 1]?.timestamp || "00:00"
        const newSegment = {
            id: Math.random().toString(36).substr(2, 9),
            timestamp: lastTimestamp, 
            text: ""
        }
        setSegments([...segments, newSegment])
    }

    return (
        <div className="space-y-6">
            
            {/* Hidden Inputs for File Upload */}
            <input 
                type="file" 
                ref={rawFileRef} 
                className="hidden" 
                accept=".txt,.doc,.docx,.md"
                onChange={handleRawFileUpload}
            />
            <input 
                type="file" 
                ref={captionFileRef} 
                className="hidden" 
                accept=".vtt,.srt,.sbv"
                onChange={handleCaptionFileUpload}
            />

            {/* Error/Success Feedback */}
            {error && (
                <Alert variant="destructive" className="animate-in fade-in slide-in-from-top-2">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Error</AlertTitle>
                    <AlertDescription>{error}</AlertDescription>
                </Alert>
            )}
            {successMessage && (
                <Alert className="border-green-500 text-green-700 bg-green-50 animate-in fade-in slide-in-from-top-2">
                    <Check className="h-4 w-4" />
                    <AlertTitle>Success</AlertTitle>
                    <AlertDescription>{successMessage}</AlertDescription>
                </Alert>
            )}

            {/* Mode Switcher */}
            <div className="flex justify-center">
                <div className="inline-flex h-10 items-center justify-center rounded-full bg-muted p-1 text-muted-foreground shadow-inner">
                    <button
                        type="button"
                        onClick={() => setMode("raw")}
                        className={cn(
                            "inline-flex items-center justify-center whitespace-nowrap rounded-full px-6 py-1.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
                            mode === "raw" ? "bg-background text-foreground shadow-sm" : "hover:bg-background/50 hover:text-foreground"
                        )}
                    >
                        <AlignLeft className="mr-2 h-4 w-4" />
                        Raw Transcript
                    </button>
                    <button
                        type="button"
                        onClick={() => setMode("synced")}
                        className={cn(
                            "inline-flex items-center justify-center whitespace-nowrap rounded-full px-6 py-1.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
                            mode === "synced" ? "bg-background text-foreground shadow-sm" : "hover:bg-background/50 hover:text-foreground"
                        )}
                    >
                        <ListVideo className="mr-2 h-4 w-4" />
                        Live Transcript
                    </button>
                </div>
            </div>

            {/* Editor Container */}
            <div className="border rounded-xl bg-card shadow-sm overflow-hidden flex flex-col h-[600px] relative">
                
                {isLoading && (
                    <div className="absolute inset-0 bg-background/80 z-50 flex flex-col items-center justify-center gap-2 backdrop-blur-sm">
                        <Wand2 className="h-8 w-8 text-primary animate-pulse" />
                        <p className="text-sm font-medium text-muted-foreground">Processing...</p>
                    </div>
                )}

                {/* --- LIVE TRANSCRIPT MODE --- */}
                {mode === "synced" && (
                    <>
                        {/* Synced Toolbar */}
                        <div className="flex flex-wrap items-center justify-between p-3 border-b bg-muted/30 gap-3">
                            <div className="flex items-center gap-2">
                                <Button 
                                    type="button"
                                    variant="outline" 
                                    size="sm" 
                                    className="h-8 text-xs bg-background"
                                    onClick={() => captionFileRef.current?.click()}
                                >
                                    <Upload className="mr-2 h-3.5 w-3.5" />
                                    Upload .SRT/.VTT
                                </Button>
                                <Button 
                                    type="button"
                                    variant="outline" 
                                    size="sm" 
                                    className="h-8 text-xs bg-background"
                                    onClick={handleImportYouTube}
                                >
                                    <Youtube className="mr-2 h-3.5 w-3.5 text-red-600" />
                                    YouTube Import
                                </Button>
                                <Button 
                                    type="button"
                                    variant="secondary" 
                                    size="sm" 
                                    className="h-8 text-xs bg-purple-100 text-purple-700 hover:bg-purple-200 border-none"
                                    onClick={handleGenerateFromAudio}
                                >
                                    <Wand2 className="mr-2 h-3.5 w-3.5" />
                                    Generate from Audio
                                </Button>
                            </div>
                            
                            <div className="flex items-center gap-2">
                                <Separator orientation="vertical" className="h-4 hidden sm:block" />
                                <span className="text-xs text-muted-foreground px-2 hidden sm:block">
                                    {segments.length} segments
                                </span>
                                <Button type="button" variant="ghost" size="sm" className="h-8 text-xs text-destructive hover:text-destructive hover:bg-destructive/10" onClick={() => setSegments([])}>
                                    Clear
                                </Button>
                            </div>
                        </div>

                        {/* Synced List */}
                        <ScrollArea className="flex-1 p-4 bg-muted/5">
                            <div className="space-y-3">
                                {segments.length === 0 ? (
                                    <div className="flex flex-col items-center justify-center h-[300px] text-muted-foreground gap-4 border-2 border-dashed rounded-xl m-4">
                                        <div className="rounded-full bg-muted p-4">
                                            <ListVideo className="h-8 w-8 text-muted-foreground/50" />
                                        </div>
                                        <div className="text-center space-y-1">
                                            <p className="font-medium">No captions yet</p>
                                            <p className="text-xs max-w-[250px]">Upload a caption file, import from YouTube, or generate one from the video audio.</p>
                                        </div>
                                    </div>
                                ) : (
                                    segments.map((segment) => (
                                        <div key={segment.id} className="group flex gap-3 items-start p-2 rounded-lg hover:bg-white hover:shadow-sm transition-all border border-transparent hover:border-border/50">
                                            {/* Timestamp Control - Compact & Hugged */}
                                            <div className="shrink-0 pt-1">
                                                <div className="flex items-center gap-0.5 bg-muted px-1.5 py-0.5 rounded-md text-[10px] font-mono font-medium text-muted-foreground hover:bg-primary hover:text-primary-foreground cursor-pointer transition-colors w-fit" title="Jump to this time">
                                                    <Play className="h-2 w-2" />
                                                    <input 
                                                        value={segment.timestamp}
                                                        onChange={(e) => handleSegmentChange(segment.id, 'timestamp', e.target.value)}
                                                        className="bg-transparent border-none w-[34px] focus:outline-none focus:ring-0 p-0 text-center cursor-pointer font-medium tracking-tighter"
                                                    />
                                                </div>
                                            </div>

                                            {/* Text Editor */}
                                            <Textarea 
                                                value={segment.text}
                                                onChange={(e) => handleSegmentChange(segment.id, 'text', e.target.value)}
                                                className="min-h-[38px] h-[38px] resize-none border-none shadow-none focus-visible:ring-0 p-1 bg-transparent text-sm leading-relaxed text-foreground"
                                                rows={1}
                                                onInput={(e) => {
                                                    const target = e.target as HTMLTextAreaElement;
                                                    target.style.height = 'auto';
                                                    target.style.height = `${target.scrollHeight}px`;
                                                }}
                                            />

                                            {/* Actions */}
                                            <div className="opacity-0 group-hover:opacity-100 transition-opacity pt-1 flex gap-1">
                                                 <Button type="button" variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground hover:text-destructive" onClick={() => handleDeleteSegment(segment.id)}>
                                                    <Trash2 className="h-3.5 w-3.5" />
                                                </Button>
                                            </div>
                                        </div>
                                    ))
                                )}

                                {/* Add New Segment Button */}
                                {segments.length > 0 && (
                                    <Button type="button" variant="ghost" className="w-full border-dashed border py-6 text-muted-foreground hover:text-primary rounded-xl hover:bg-background" onClick={handleAddSegment}>
                                        <Plus className="mr-2 h-4 w-4" />
                                        Add Timestamp Segment
                                    </Button>
                                )}
                            </div>
                        </ScrollArea>
                    </>
                )}

                {/* --- RAW TRANSCRIPT MODE --- */}
                {mode === "raw" && (
                     <div className="flex flex-col h-full">
                        {/* Raw Toolbar */}
                        <div className="flex items-center justify-between p-3 border-b bg-muted/30">
                            <div className="flex items-center gap-2">
                                <Button 
                                    type="button"
                                    variant="outline" 
                                    size="sm" 
                                    className="h-8 text-xs bg-background"
                                    onClick={() => rawFileRef.current?.click()}
                                >
                                    <Upload className="mr-2 h-3.5 w-3.5" />
                                    Upload Text File
                                </Button>
                                <Button 
                                    type="button"
                                    variant="secondary" 
                                    size="sm" 
                                    className="h-8 text-xs bg-blue-100 text-blue-700 hover:bg-blue-200 border-none"
                                    onClick={handleConvertToSynced}
                                    disabled={!rawText.trim()}
                                >
                                    <Wand2 className="mr-2 h-3.5 w-3.5" />
                                    AI: Align with Video
                                </Button>
                            </div>
                            <Button type="button" variant="ghost" size="sm" className="h-8 text-xs text-muted-foreground" onClick={() => setRawText("")}>
                                Clear Text
                            </Button>
                        </div>
                        
                        <Textarea 
                            value={rawText}
                            onChange={(e) => setRawText(e.target.value)}
                            placeholder="Type or paste your sermon transcript here.&#10;We'll help you sync it with the video later."
                            className="flex-1 resize-none border-none shadow-none p-6 text-base leading-relaxed focus-visible:ring-0 font-serif"
                        />
                     </div>
                )}
                
                {/* Note: Save button removed. Parent form handles saving. */}
                <div className="p-2 border-t bg-muted/10 flex justify-end">
                     <Button type="button" variant="ghost" size="sm" className="text-xs text-muted-foreground h-7" onClick={() => showSuccess("Downloaded current transcript")}>
                        <Download className="mr-2 h-3 w-3" />
                        Download {mode === 'raw' ? '.txt' : '.srt'}
                    </Button>
                </div>
            </div>
        </div>
    )
}
