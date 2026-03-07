"use client"

import { useState, useEffect, useCallback } from "react"
import Link from "next/link"
import {
  HardDrive,
  Image as ImageIcon,
  FileText,
  Music,
  Video,
  File,
  ExternalLink,
  AlertTriangle,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type BreakdownCategory = {
  bytes: number
  formatted: string
  fileCount: number
  percent: number
}

type MediaTypeBreakdown = {
  category: string
  totalBytes: number
  fileCount: number
  formatted: string
}

type TopFile = {
  id: string
  name: string
  type: string
  fileSize: number
  fileSizeFormatted: string
  url: string
  source: "media" | "attachment"
  folder: string | null
  createdAt: string
  context: string
}

type StorageDetail = {
  currentUsage: number
  quota: number
  remaining: number
  percentUsed: number
  currentUsageFormatted: string
  quotaFormatted: string
  remainingFormatted: string
  breakdown: {
    media: BreakdownCategory
    attachments: BreakdownCategory
    mediaByType: MediaTypeBreakdown[]
  }
  topFiles: TopFile[]
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getCategoryIcon(category: string) {
  switch (category) {
    case "images":
      return <ImageIcon className="size-4" />
    case "audio":
      return <Music className="size-4" />
    case "video":
      return <Video className="size-4" />
    default:
      return <File className="size-4" />
  }
}

function getFileIcon(type: string) {
  if (type.startsWith("image/") || type === "IMAGE") return <ImageIcon className="size-4 text-blue-500" />
  if (type.startsWith("audio/")) return <Music className="size-4 text-purple-500" />
  if (type.startsWith("video/")) return <Video className="size-4 text-pink-500" />
  if (type === "PDF" || type === "application/pdf") return <FileText className="size-4 text-red-500" />
  if (type === "DOCX" || type === "DOC" || type === "RTF") return <FileText className="size-4 text-blue-600" />
  return <File className="size-4 text-muted-foreground" />
}

function getBarColor(percent: number) {
  if (percent >= 90) return "bg-destructive"
  if (percent >= 75) return "bg-orange-500"
  return "bg-primary"
}

function getCategoryColor(category: string) {
  switch (category) {
    case "images":
      return "bg-blue-500"
    case "audio":
      return "bg-purple-500"
    case "video":
      return "bg-pink-500"
    default:
      return "bg-muted-foreground"
  }
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function StoragePage() {
  const [data, setData] = useState<StorageDetail | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchData = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const res = await fetch("/api/v1/storage?detail=true")
      const json = await res.json()
      if (json.success) {
        setData(json.data)
      } else {
        setError(json.error?.message ?? "Failed to load storage data")
      }
    } catch {
      setError("Failed to load storage data")
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  if (isLoading) {
    return (
      <div className="flex flex-col gap-4 pt-5">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Storage</h1>
          <p className="text-muted-foreground text-sm">Loading storage details...</p>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardContent className="pt-6">
                <div className="h-20 animate-pulse rounded bg-muted" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="flex flex-col gap-4 pt-5">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Storage</h1>
          <p className="text-destructive text-sm">{error ?? "Failed to load data"}</p>
        </div>
      </div>
    )
  }

  const { percentUsed, breakdown, topFiles } = data
  const barColor = getBarColor(percentUsed)

  return (
    <div className="flex flex-col gap-6 pt-5">
      {/* Header */}
      <div>
        <h1 className="text-xl font-semibold tracking-tight">Storage</h1>
        <p className="text-muted-foreground text-sm">
          Monitor your storage usage, see what&apos;s taking up space, and manage your files.
        </p>
      </div>

      {/* Overall usage card */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10">
              <HardDrive className="size-5 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Storage Used</p>
              <p className="text-2xl font-semibold">
                {data.currentUsageFormatted}{" "}
                <span className="text-sm font-normal text-muted-foreground">
                  of {data.quotaFormatted}
                </span>
              </p>
            </div>
          </div>

          {/* Progress bar */}
          <div className="h-3 rounded-full bg-muted overflow-hidden mb-2">
            <div
              className={`h-full rounded-full transition-all ${barColor}`}
              style={{ width: `${Math.min(percentUsed, 100)}%` }}
            />
          </div>
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>{percentUsed}% used</span>
            <span>{data.remainingFormatted} remaining</span>
          </div>

          {percentUsed >= 90 && (
            <div className="mt-3 flex items-center gap-2 rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
              <AlertTriangle className="size-4" />
              Storage is almost full. Delete unused files to free up space.
            </div>
          )}
        </CardContent>
      </Card>

      {/* Breakdown cards */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Media Library */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center justify-between">
              <span className="flex items-center gap-2">
                <ImageIcon className="size-4" />
                Media Library
              </span>
              <Link
                href="/cms/media"
                className="text-xs font-normal text-muted-foreground hover:text-foreground flex items-center gap-1"
              >
                Manage <ExternalLink className="size-3" />
              </Link>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline gap-2 mb-3">
              <span className="text-2xl font-semibold">{breakdown.media.formatted}</span>
              <span className="text-sm text-muted-foreground">
                {breakdown.media.fileCount} file{breakdown.media.fileCount !== 1 ? "s" : ""}
              </span>
            </div>

            {/* Stacked bar for media types */}
            {breakdown.mediaByType.length > 0 && (
              <div className="space-y-3">
                <div className="h-2 rounded-full bg-muted overflow-hidden flex">
                  {breakdown.mediaByType.map((t) => {
                    const pct =
                      breakdown.media.bytes > 0
                        ? (t.totalBytes / breakdown.media.bytes) * 100
                        : 0
                    return (
                      <div
                        key={t.category}
                        className={`h-full ${getCategoryColor(t.category)} first:rounded-l-full last:rounded-r-full`}
                        style={{ width: `${Math.max(pct, 1)}%` }}
                      />
                    )
                  })}
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {breakdown.mediaByType.map((t) => (
                    <div key={t.category} className="flex items-center gap-2 text-sm">
                      <div className={`size-2.5 rounded-full ${getCategoryColor(t.category)}`} />
                      <span className="flex items-center gap-1.5">
                        {getCategoryIcon(t.category)}
                        <span className="capitalize">{t.category}</span>
                      </span>
                      <span className="ml-auto text-xs text-muted-foreground">
                        {t.formatted} ({t.fileCount})
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {breakdown.mediaByType.length === 0 && (
              <p className="text-sm text-muted-foreground">No media files uploaded yet.</p>
            )}
          </CardContent>
        </Card>

        {/* Bible Study Attachments */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center justify-between">
              <span className="flex items-center gap-2">
                <FileText className="size-4" />
                Bible Study Attachments
              </span>
              <Link
                href="/cms/messages"
                className="text-xs font-normal text-muted-foreground hover:text-foreground flex items-center gap-1"
              >
                Manage <ExternalLink className="size-3" />
              </Link>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline gap-2 mb-3">
              <span className="text-2xl font-semibold">{breakdown.attachments.formatted}</span>
              <span className="text-sm text-muted-foreground">
                {breakdown.attachments.fileCount} file{breakdown.attachments.fileCount !== 1 ? "s" : ""}
              </span>
            </div>

            {/* Simple proportion bar */}
            <div className="h-2 rounded-full bg-muted overflow-hidden mb-3">
              <div
                className="h-full rounded-full bg-orange-500"
                style={{
                  width: `${data.currentUsage > 0 ? Math.max((breakdown.attachments.bytes / data.currentUsage) * 100, 1) : 0}%`,
                }}
              />
            </div>
            <p className="text-xs text-muted-foreground">
              {breakdown.attachments.percent}% of total storage
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Top consuming files */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium">
            Largest Files
          </CardTitle>
        </CardHeader>
        <CardContent>
          {topFiles.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">
              No files found.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>File</TableHead>
                  <TableHead>Source</TableHead>
                  <TableHead className="text-right">Size</TableHead>
                  <TableHead className="text-right">Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {topFiles.map((file) => (
                  <TableRow key={`${file.source}-${file.id}`}>
                    <TableCell>
                      <div className="flex items-center gap-2 min-w-0">
                        {getFileIcon(file.type)}
                        <span className="truncate max-w-[300px]" title={file.name}>
                          {file.name}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-xs whitespace-nowrap">
                        {file.source === "media" ? "Media" : "Attachment"}
                      </Badge>
                      <span className="ml-2 text-xs text-muted-foreground truncate max-w-[200px] inline-block align-middle" title={file.context}>
                        {file.context}
                      </span>
                    </TableCell>
                    <TableCell className="text-right font-mono text-sm">
                      {file.fileSizeFormatted}
                    </TableCell>
                    <TableCell className="text-right text-sm text-muted-foreground whitespace-nowrap">
                      {new Date(file.createdAt).toLocaleDateString()}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
