# Google Drive-Style Upload Progress Tracker

## Problem

Currently, file uploads block the UI inside a modal dialog. The user can't navigate or do anything else while files upload. For larger video files (up to 15 MB), this creates a poor experience. We need a persistent bottom-right panel (like Google Drive) that tracks upload progress per file, allows cancellation, and lets the user continue working.

## Goals

- Non-blocking uploads: user picks files, dialog closes, uploads run in background
- Per-file progress bars with real upload percentage (not just a spinner)
- Cancel individual uploads mid-flight (staging files auto-expire in 24h)
- After completion: click to preview file or navigate to its folder
- Works from any CMS page (not just media library)
- Collapsible/minimizable panel

## Architecture

### Upload Queue Context

A React Context (`UploadQueueProvider`) mounted at the CMS root layout (`app/cms/layout.tsx`). This persists across all CMS page navigations, including the website builder.

```
app/cms/layout.tsx
  └─ UploadQueueProvider          ← manages upload state + runs uploads
       ├─ ... existing children
       └─ UploadProgressPanel     ← fixed bottom-right panel
```

### Upload Flow (New)

```
User selects files in dialog
  → Dialog validates size/type
  → enqueue(files, folder) dispatches to context
  → Dialog closes immediately
  → Toast: "X files queued for upload"

Upload Queue Provider (background):
  For each file (sequential, one at a time):
    1. fetch() presigned URL from /api/v1/upload-url  (fast, ~200ms)
    2. XMLHttpRequest PUT to R2                        (slow, progress tracked)
    3. fetch() POST /api/v1/media to create DB record  (fast, ~300ms)

  On each file completion:
    → onComplete callbacks fire
    → Media page auto-refreshes grid/folders/storage

Panel shows real-time progress throughout.
```

### Why XMLHttpRequest?

The `fetch()` API does **not** support upload progress. `XMLHttpRequest` provides `xhr.upload.onprogress` which fires with `loaded`/`total` bytes, giving us real percentage tracking. We only use XHR for the R2 PUT step (the slow part). The presigned URL and DB record steps use regular `fetch()`.

### Cancellation Strategy

| Upload Step | Cancel Method | Cleanup |
|---|---|---|
| Queued (not started) | Remove from queue | Nothing to clean up |
| Getting presigned URL | `AbortController.abort()` | Nothing uploaded yet |
| Uploading to R2 | `xhr.abort()` | Staging file expires in 24h via R2 lifecycle rule |
| Creating DB record | `AbortController.abort()` | Staging file expires; no DB record created |

Cancelled uploads don't cost storage because R2 lifecycle rules auto-delete `{slug}/staging/*` after 24h.

## New Files

### 1. `lib/upload-queue.ts` -- Types

```typescript
export type UploadJobStatus =
  | "queued"
  | "getting-url"
  | "uploading"
  | "creating-record"
  | "done"
  | "error"
  | "cancelled"

export interface UploadJob {
  id: string                    // crypto.randomUUID()
  file: File
  folder: string
  status: UploadJobStatus
  progress: number              // 0-100 (meaningful during "uploading")
  error?: string
  result?: {                    // populated on "done"
    mediaId: string
    url: string
    filename: string
    folder: string
  }
  createdAt: number             // Date.now()
}

export interface UploadQueueContextValue {
  jobs: UploadJob[]
  enqueue: (files: File[], folder: string) => void
  cancel: (jobId: string) => void
  dismiss: (jobId: string) => void       // remove completed/errored job from list
  dismissAll: () => void                 // clear all completed
  retry: (jobId: string) => void
  onComplete: (cb: (job: UploadJob) => void) => () => void  // subscribe; returns unsub
}
```

### 2. `components/cms/upload-queue-provider.tsx` -- Context + Engine

- Maintains `jobs` state (`useState<UploadJob[]>`)
- Runs processing loop: picks next `queued` job, executes 3-step upload
- Uses `XMLHttpRequest` for R2 PUT with `xhr.upload.onprogress`
- Stores XHR/AbortController refs in a `Map` (not in React state)
- Completion callback system: `Set<(job) => void>`, returns unsubscribe function
- `beforeunload` warning when any job is in-progress
- Exports `useUploadQueue()` hook
- Renders `<UploadProgressPanel />` alongside `{children}`

### 3. `components/cms/upload-progress-panel.tsx` -- The Panel UI

```
┌──────────────────────────────────┐
│  Uploading 3 files    ▾  ✕      │  Header (collapsible, close when all done)
├──────────────────────────────────┤
│  hero.mp4          ████░░  67%  │  Active: progress bar
│  banner.jpg        Queued    ✕  │  Queued: cancel button
│  logo.png          ✓ Done    👁  │  Done: preview / go to folder
│  old.webm          ✗ Error   ↻  │  Error: retry button
└──────────────────────────────────┘
```

- Position: `fixed bottom-20 right-5 z-40` (above feedback button at `bottom-5 right-5 z-50`)
- Width: `w-80` (320px)
- File list: `max-h-64` with `overflow-y-auto`
- Header: summary text + minimize toggle + close (close only when all done)
- Per-file row: mime icon + truncated filename + progress bar + action button
- Auto-hides when all jobs dismissed
- Slide-up animation on first enqueue
- Uses shadcn `<Progress>` component for per-file bars

## Modified Files

### 4. `app/cms/layout.tsx`

Wrap children with `<UploadQueueProvider>`:

```tsx
<SessionProvider>
  <CmsThemeProvider>
    <UploadQueueProvider>
      <div data-cms="" ...>{children}</div>
    </UploadQueueProvider>
  </CmsThemeProvider>
</SessionProvider>
```

### 5. `components/cms/media/upload-photo-dialog.tsx`

Change from "upload inline" to "validate + dispatch + close":

- Keep: file picker UI, drag/drop, size validation, error marking
- Remove: sequential upload loop, `isUploading` blocking state
- On submit: `enqueue(validFiles, folder)` → close dialog → toast "X files queued"
- The `onSubmit` prop changes: no longer returns completed MediaItems

### 6. `app/cms/(dashboard)/media/page.tsx`

Subscribe to upload completions to auto-refresh:

```tsx
const { onComplete } = useUploadQueue()

useEffect(() => {
  return onComplete((job) => {
    fetchMedia()
    fetchFolders()
    fetchStorageUsage()
  })
}, [onComplete, fetchMedia, fetchFolders, fetchStorageUsage])
```

Remove or simplify `handleUploadPhotos` callback (dialog no longer returns items).

### 7. `components/cms/cms-feedback-button.tsx`

Shift position up when upload panel is visible:

```tsx
const { jobs } = useUploadQueue()
const hasActiveJobs = jobs.length > 0
// bottom-5 → bottom-72 when panel visible
```

## NOT Changed

- **`media-picker-dialog.tsx`**: Keeps inline single-file upload. The picker is a different UX — user waits for the upload to select the result. Making it async would add complexity without clear benefit.
- **`lib/upload-media.ts`**: The queue engine does its own 3-step flow using XHR. Existing `uploadMediaToR2` / `uploadImageToR2` stay for the media picker dialog.

## Edge Cases

| Scenario | Behavior |
|---|---|
| Navigate between CMS pages during upload | Panel persists, uploads continue (provider at root layout) |
| Navigate to website builder during upload | Same — provider is at `app/cms/layout.tsx` level |
| Close browser tab during upload | Uploads lost, `beforeunload` warning shown |
| Upload same file twice | Two separate MediaAsset records created (current behavior) |
| Storage quota exceeded mid-batch | Per-file error, remaining files continue |
| Network failure | Per-file error with retry button |

## Implementation Order

1. `npx shadcn add progress`
2. Create `lib/upload-queue.ts` (types)
3. Create `components/cms/upload-queue-provider.tsx` (context + engine)
4. Create `components/cms/upload-progress-panel.tsx` (panel UI)
5. Modify `app/cms/layout.tsx` (mount provider)
6. Modify `upload-photo-dialog.tsx` (dispatch to queue)
7. Modify media `page.tsx` (subscribe to completions)
8. Modify feedback button (position shift)

## Testing Checklist

- [ ] Upload multiple files from media page → dialog closes immediately, panel appears
- [ ] Progress bars advance in real-time during upload
- [ ] Cancel mid-upload → file removed from queue, no orphan DB records
- [ ] Navigate to different CMS page during upload → panel persists, uploads continue
- [ ] Upload completes → media grid auto-refreshes with new files
- [ ] Click completed file in panel → navigates to its folder in media library
- [ ] Close/dismiss panel → feedback button returns to original position
- [ ] Upload file > 15 MB → rejected in dialog before enqueue
- [ ] Storage quota exceeded → per-file error, other files continue
- [ ] Close browser tab during upload → beforeunload warning appears
