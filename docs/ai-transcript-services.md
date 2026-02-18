# AI Transcript & Caption Services — Integration Guide

This document outlines the external APIs and services needed to fully implement the transcript features in the Messages Entry Editor. All features are currently **stubbed with mock data** in the frontend and ready for backend integration.

---

## 1. YouTube Data API v3 — Caption Import

**Purpose:** Import auto-generated or manual captions from a YouTube video.

**API:** [YouTube Data API v3](https://developers.google.com/youtube/v3)

**Endpoints needed:**
- `GET /captions` — List available caption tracks for a video
- `GET /captions/{id}` — Download a specific caption track (SRT/VTT format)
- `GET /videos` — Fetch video metadata (title, description, duration)

**Auth:** OAuth 2.0 or API Key (read-only access)

**Setup:**
1. Create a project in [Google Cloud Console](https://console.cloud.google.com)
2. Enable "YouTube Data API v3"
3. Create an API key (for read-only public video data) or OAuth credentials (for private videos)
4. Store the key in environment variable: `YOUTUBE_API_KEY`

**Cost:** Free tier includes 10,000 quota units/day. Caption list = 50 units, caption download = 200 units. Sufficient for typical church usage.

**Frontend integration point:** `components/cms/messages/entry/transcript-editor.tsx` → `handleYouTubeImport()`

**Backend work needed:**
- API route: `POST /api/youtube/captions` — accepts video URL, returns parsed caption segments
- Parse the YouTube video ID from the URL
- Fetch caption tracks, prefer manual captions, fall back to auto-generated
- Convert SRT/VTT response to `TranscriptSegment[]` format
- Return video metadata (title, description) for the "Import Metadata" button

---

## 2. Speech-to-Text — AI Transcript Generation

**Purpose:** Generate a transcript with timestamps from a video's audio track.

**Recommended services (choose one):**

### Option A: OpenAI Whisper API (Recommended)
- **API:** [OpenAI Audio API](https://platform.openai.com/docs/api-reference/audio)
- **Endpoint:** `POST /v1/audio/transcriptions`
- **Model:** `whisper-1`
- **Features:** Timestamps at word or segment level, language detection, high accuracy
- **Input:** Audio file (mp3, mp4, mpeg, mpga, m4a, wav, webm) — max 25 MB
- **Cost:** $0.006/minute of audio
- **Env var:** `OPENAI_API_KEY`

### Option B: Google Cloud Speech-to-Text
- **API:** [Cloud Speech-to-Text V2](https://cloud.google.com/speech-to-text)
- **Features:** Long-running recognition for videos > 1 min, word-level timestamps
- **Cost:** $0.006/15 seconds (standard model)
- **Env var:** `GOOGLE_CLOUD_CREDENTIALS`

### Option C: AssemblyAI
- **API:** [AssemblyAI](https://www.assemblyai.com/docs)
- **Features:** Async transcription, paragraph/sentence-level timestamps, speaker diarization
- **Cost:** $0.00025/second (~$0.015/minute)
- **Env var:** `ASSEMBLYAI_API_KEY`

**Backend work needed:**
- API route: `POST /api/transcript/generate` — accepts video URL
- Download/extract audio from video URL (use `yt-dlp` or similar)
- Send audio to speech-to-text service
- Parse response into `TranscriptSegment[]` with timestamps
- This is a **long-running operation** — implement with:
  - Job queue (e.g., Inngest, BullMQ, or Vercel serverless with streaming)
  - Status polling endpoint: `GET /api/transcript/status/{jobId}`
  - Webhook callback when complete

**Frontend integration point:** `transcript-editor.tsx` → `handleAiGenerate()`

---

## 3. AI Text-to-Timestamp Alignment

**Purpose:** Take a raw transcript (pasted text) and align it to the audio timeline with timestamps.

**Recommended approach:**

### Option A: Whisper with `--word_timestamps` + forced alignment
- Use Whisper's word-level timestamps and align raw text against them
- This produces the most accurate results
- Requires the audio file + raw text as inputs

### Option B: Gentle / Aeneas forced alignment
- **Gentle:** [lowerquality/gentle](https://github.com/lowerquality/gentle) — forced aligner for English
- **Aeneas:** [readbeyond/aeneas](https://github.com/readbeyond/aeneas) — multilingual forced alignment
- Both take audio + text and produce timestamp mappings
- Can run as self-hosted services

### Option C: LLM-based segmentation (simpler, less accurate)
- Send raw text to an LLM (GPT-4, Claude) with the audio duration
- Ask it to estimate logical segment boundaries and distribute timestamps
- Less accurate but doesn't require audio processing

**Backend work needed:**
- API route: `POST /api/transcript/align` — accepts `{ videoUrl, rawText }`
- Extract audio from video
- Run forced alignment (Whisper + text or Gentle)
- Return `TranscriptSegment[]`
- Also a long-running operation — same job queue pattern as #2

**Frontend integration point:** `transcript-editor.tsx` → `handleAiAlignment()`

---

## 4. Document Import (DOCX/Google Drive)

**Purpose:** Import Bible study content from Word documents or Google Drive.

### DOCX Import
- **Library:** [mammoth.js](https://github.com/mwilliamson/mammoth.js) (client-side DOCX → HTML)
- **Alternative:** [docx-preview](https://github.com/nicholasgasior/docx-preview) for rendering
- **No API key needed** — runs entirely in the browser
- Install: `npm install mammoth`

### Google Drive Import
- **API:** [Google Drive API v3](https://developers.google.com/drive/api/v3/about-sdk)
- **Endpoint:** `GET /files/{fileId}/export` — export Google Docs as HTML or plain text
- **Auth:** OAuth 2.0 (user must authorize access to their Drive)
- **Env var:** Reuse `GOOGLE_CLOUD_CREDENTIALS` from YouTube setup

**Frontend integration point:** `components/cms/messages/entry/study-tab.tsx` → `handleImportDocx()`

---

## 5. Environment Variables Summary

```env
# YouTube Data API
YOUTUBE_API_KEY=your_youtube_api_key

# Speech-to-Text (choose one)
OPENAI_API_KEY=your_openai_api_key
# OR
GOOGLE_CLOUD_CREDENTIALS=path/to/credentials.json
# OR
ASSEMBLYAI_API_KEY=your_assemblyai_api_key
```

---

## 6. Implementation Priority

| Feature | Priority | Complexity | Service |
|---------|----------|------------|---------|
| YouTube caption import | P0 | Low | YouTube Data API |
| SRT/VTT file upload | P0 | Low | Client-side parsing (done) |
| Raw text upload (.TXT) | P0 | Low | Client-side (done) |
| AI transcript generation | P1 | Medium | Whisper API |
| AI text-to-timestamp alignment | P1 | Medium | Whisper + forced alignment |
| DOCX import | P1 | Low | mammoth.js (client-side) |
| Google Drive import | P2 | Medium | Google Drive API |

---

## 7. Background Processing Architecture

For long-running transcript operations (AI generation, alignment):

```
Client                    API Route                  Job Queue
  │                          │                          │
  ├─ POST /generate ────────►│                          │
  │                          ├─ Create job ────────────►│
  │  ◄── { jobId } ─────────┤                          │
  │                          │                          │
  │  (polling)               │                          │
  ├─ GET /status/{jobId} ───►│                          │
  │  ◄── { status: "processing" }                      │
  │                          │         ┌── Process ────►│
  │  ├─ GET /status/{jobId} ►│         │                │
  │  ◄── { status: "done", segments: [...] }            │
  │                          │                          │
  └─ Update UI ──────────────┘                          │
```

The frontend already handles the "processing" state with a loading indicator and the message "You can continue editing and save — processing will complete in the background."
