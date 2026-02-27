import { ImageIcon, Video, FolderOpen, Upload } from "lucide-react"
import {
  Card,
  CardContent,
} from "@/components/ui/card"

export default function MediaPage() {
  return (
    <div className="flex flex-col gap-4 flex-1 min-h-0">
      <div>
        <h1 className="text-xl font-semibold tracking-tight">Media</h1>
        <p className="text-muted-foreground text-sm">
          Upload and manage photos, videos, and documents.
        </p>
      </div>

      <div className="flex-1 flex items-center justify-center">
        <Card className="max-w-md w-full">
          <CardContent className="flex flex-col items-center text-center py-12 px-8 gap-6">
            <div className="flex items-center justify-center size-16 rounded-full bg-muted">
              <ImageIcon className="size-8 text-muted-foreground" />
            </div>

            <div className="space-y-2">
              <h2 className="text-lg font-semibold">
                Media Library &mdash; Coming Soon
              </h2>
              <p className="text-sm text-muted-foreground leading-relaxed">
                A centralized place to upload and manage all your photos, videos,
                and documents. Organize files into folders, connect Google Photo
                albums, and easily reuse media across your site.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 w-full max-w-xs text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <Upload className="size-4 shrink-0" />
                <span>Photo uploads</span>
              </div>
              <div className="flex items-center gap-2">
                <Video className="size-4 shrink-0" />
                <span>Video embeds</span>
              </div>
              <div className="flex items-center gap-2">
                <FolderOpen className="size-4 shrink-0" />
                <span>Folder organization</span>
              </div>
              <div className="flex items-center gap-2">
                <ImageIcon className="size-4 shrink-0" />
                <span>Google Photos</span>
              </div>
            </div>

            <p className="text-xs text-muted-foreground">
              In the meantime, you can paste image URLs directly when editing
              events and messages.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
