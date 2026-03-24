export type UploadJobStatus =
  | "queued"
  | "getting-url"
  | "uploading"
  | "creating-record"
  | "done"
  | "error"
  | "cancelled"

export interface UploadJobResult {
  mediaId: string
  url: string
  filename: string
  folder: string
}

export interface UploadJob {
  id: string
  file: File
  folder: string
  status: UploadJobStatus
  progress: number // 0-100
  error?: string
  result?: UploadJobResult
  createdAt: number
}

export interface UploadQueueContextValue {
  jobs: UploadJob[]
  enqueue: (files: File[], folder: string) => void
  cancel: (jobId: string) => void
  dismiss: (jobId: string) => void
  dismissAll: () => void
  retry: (jobId: string) => void
  onComplete: (cb: (job: UploadJob) => void) => () => void
}
