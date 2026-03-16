"use client"

import { BookOpen, Video } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"

export interface PublishToggleState {
  studyPublished: boolean
  videoPublished: boolean
  studyContentExists: boolean
  videoContentExists: boolean
}

interface PublishTogglesProps {
  studyPublished: boolean
  videoPublished: boolean
  studyContentExists: boolean
  videoContentExists: boolean
  onStudyChange: (checked: boolean) => void
  onVideoChange: (checked: boolean) => void
}

export function PublishToggles({
  studyPublished,
  videoPublished,
  studyContentExists,
  videoContentExists,
  onStudyChange,
  onVideoChange,
}: PublishTogglesProps) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between rounded-lg bg-muted/50 p-3">
        <div className="flex items-center gap-2.5">
          <BookOpen className="size-4 text-purple-600 dark:text-purple-400" />
          <span className="text-sm font-medium">Bible Study</span>
        </div>
        <div className="flex items-center gap-2.5">
          <Badge variant={studyPublished ? "success" : studyContentExists ? "secondary" : "outline"}>
            {studyPublished ? "Published" : studyContentExists ? "Draft" : "Empty"}
          </Badge>
          <Switch
            checked={studyPublished}
            onCheckedChange={onStudyChange}
            disabled={!studyContentExists}
            aria-label="Toggle bible study publish status"
          />
        </div>
      </div>
      <div className="flex items-center justify-between rounded-lg bg-muted/50 p-3">
        <div className="flex items-center gap-2.5">
          <Video className="size-4 text-blue-600 dark:text-blue-400" />
          <span className="text-sm font-medium">Video</span>
        </div>
        <div className="flex items-center gap-2.5">
          <Badge variant={videoPublished ? "success" : videoContentExists ? "secondary" : "outline"}>
            {videoPublished ? "Published" : videoContentExists ? "Draft" : "Empty"}
          </Badge>
          <Switch
            checked={videoPublished}
            onCheckedChange={onVideoChange}
            disabled={!videoContentExists}
            aria-label="Toggle video publish status"
          />
        </div>
      </div>
    </div>
  )
}
