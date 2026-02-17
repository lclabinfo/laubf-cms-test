"use client";

import { Button } from "@/app/components/ui/button"
import { FileText, X, UploadCloud, File as FileIcon } from "lucide-react"
import { toast } from "sonner"

interface Attachment {
    name: string
    size: string
    type: string
}

interface AttachmentsListProps {
    attachments: Attachment[]
    onAdd: (attachment: Attachment) => void
    onRemove: (index: number) => void
    className?: string
}

export function AttachmentsList({ attachments, onAdd, onRemove, className }: AttachmentsListProps) {
    
    const handleFileUpload = () => {
        // Mock upload
        const newFile = {
            name: `Resource_${Math.floor(Math.random() * 1000)}.pdf`,
            size: `${Math.floor(Math.random() * 5000)} KB`,
            type: "pdf"
        }
        
        toast.promise(new Promise(resolve => setTimeout(resolve, 1000)), {
            loading: 'Uploading file...',
            success: () => {
                onAdd(newFile)
                return 'File uploaded successfully'
            },
            error: 'Upload failed'
        })
    }

    return (
        <div className={className}>
            <div className="space-y-3">
                {attachments.map((file, index) => (
                    <div key={index} className="flex items-center justify-between p-3 rounded-md bg-muted/40 border group hover:bg-muted/60 transition-colors">
                        <div className="flex items-center gap-3">
                            <div className="bg-background p-2 rounded border">
                                <FileIcon className="h-4 w-4 text-primary" />
                            </div>
                            <div>
                                <div className="font-medium text-sm text-foreground">{file.name}</div>
                                <div className="text-xs text-muted-foreground">{file.size}</div>
                            </div>
                        </div>
                        <Button 
                            type="button" 
                            variant="ghost" 
                            size="icon" 
                            className="opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={() => onRemove(index)}
                        >
                            <X className="h-4 w-4" />
                        </Button>
                    </div>
                ))}
                
                {attachments.length === 0 && (
                    <div className="text-center py-8 border-2 border-dashed rounded-lg bg-muted/10">
                        <p className="text-sm text-muted-foreground">No attachments yet</p>
                    </div>
                )}

                <Button 
                    type="button" 
                    variant="outline" 
                    className="w-full border-dashed" 
                    onClick={handleFileUpload}
                >
                    <UploadCloud className="mr-2 h-4 w-4" />
                    Upload Resource
                </Button>
            </div>
        </div>
    )
}
