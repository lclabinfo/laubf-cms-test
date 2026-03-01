# Transcript AI Flows

Three AI-powered transcript workflows are available in the Messages Entry Editor. Each has distinct prerequisites and produces different output quality.

---

## Flow 1: Raw Text → AI Synced Segments

**Dropdown label:** "AI Auto-Align to Timestamps"

**What it does:**
1. User pastes or types raw transcript text in the Full Text tab (rich text editor).
2. User clicks "AI Auto-Align to Timestamps" from the Import / Generate dropdown.
3. The system sends the raw text + video duration to Azure OpenAI.
4. AI analyzes the text and distributes it into logical segments with estimated timestamps based on speaking pace and video duration.
5. Result: `TranscriptSegment[]` with `startTime`, `endTime`, and `text` for each segment — displayed as live captions.

**Prerequisites:**
- Raw transcript text must be entered (checked: `rawTranscript.trim()` must be non-empty)
- Video duration (currently hardcoded to `00:45:00`, will be derived from video metadata)
- Azure OpenAI API key configured (`AZURE_OPENAI_API_KEY`, `AZURE_OPENAI_ENDPOINT`, `AZURE_OPENAI_DEPLOYMENT`)

**API endpoint:** `POST /api/v1/ai/align-transcript`

**Request body:**
```json
{
  "rawText": "The full transcript text...",
  "duration": "00:45:00"
}
```

**Response:** `{ data: TranscriptSegment[] }`

**Accuracy note:** This is an estimation-based approach. The AI distributes text across the duration using heuristics (words per minute, sentence boundaries). It does not analyze audio. Results are editable and meant as a starting point.

---

## Flow 2: Import from YouTube

**Dropdown label:** "Import YouTube Captions"

**What it does:**
1. User has a YouTube video URL set in the Video URL field.
2. User clicks "Import YouTube Captions" from the Import / Generate dropdown.
3. System extracts the YouTube video ID from the URL.
4. System calls the YouTube Data API v3 to fetch available caption tracks.
5. Prefers manual captions; falls back to auto-generated captions.
6. Captions are parsed from SRT/VTT format into `TranscriptSegment[]`.
7. Both the segments (Live Captions) and joined text (Full Text) are populated.
8. User can edit segments after import.

**Prerequisites:**
- YouTube video URL must be set in the message entry (checked: `videoUrl` must be present and contain a valid YouTube video ID)
- `YOUTUBE_API_KEY` environment variable configured

**API endpoint:** `GET /api/v1/youtube/captions?videoId={ytId}`

**Response:** `{ data: TranscriptSegment[] }`

**Quality note:** YouTube auto-generated captions are functional but often noisy: missing punctuation, incorrect capitalization, no paragraph breaks, and occasional word errors. For better quality, use Flow 3.

---

## Flow 3: Import from YouTube + AI Cleanup

**Dropdown label:** "Import YouTube + AI Cleanup"

**What it does:**
1. Same as Flow 2 steps 1-6 (fetches YouTube captions).
2. After fetching, the raw caption segments are sent to Azure OpenAI for post-processing.
3. AI cleanup includes:
   - Fixing punctuation and capitalization
   - Adding proper sentence and paragraph breaks
   - Correcting common speech-to-text errors
   - Improving overall readability while preserving timestamps
4. Result: clean, well-formatted timestamped segments.

**Prerequisites:**
- YouTube video URL must be set (same as Flow 2)
- `YOUTUBE_API_KEY` environment variable configured
- Azure OpenAI API key configured (`AZURE_OPENAI_API_KEY`, `AZURE_OPENAI_ENDPOINT`, `AZURE_OPENAI_DEPLOYMENT`)

**API endpoint:** Two-step process:
1. `GET /api/v1/youtube/captions?videoId={ytId}` (fetch raw captions)
2. `POST /api/v1/ai/cleanup-captions` (AI post-processing — not yet implemented)

**Response:** `{ data: TranscriptSegment[] }` (cleaned segments)

**Quality note:** This produces the best results for YouTube-sourced content. The AI cleanup step typically transforms noisy auto-captions into publication-quality transcript segments.

---

## Non-AI Import Options

These options are always available and require no API keys:

| Dropdown Label | What It Does | Input |
|---|---|---|
| Upload Text File | Imports a `.txt`, `.doc`, `.md` etc. file as raw transcript text | File picker |
| Upload Caption File (.SRT/.VTT) | Parses timestamped caption file into segments | File picker |

---

## Prerequisites Summary

| Flow | YouTube URL | YouTube API Key | Azure OpenAI | Raw Text |
|---|---|---|---|---|
| 1: AI Auto-Align | - | - | Required | Required |
| 2: YouTube Import | Required | Required | - | - |
| 3: YouTube + AI Cleanup | Required | Required | Required | - |
| Upload Text File | - | - | - | - |
| Upload Caption File | - | - | - | - |

---

## Environment Variables

```env
# YouTube Data API v3
YOUTUBE_API_KEY=your_youtube_api_key

# Azure OpenAI (for AI features)
AZURE_OPENAI_API_KEY=your_azure_openai_api_key
AZURE_OPENAI_ENDPOINT=https://your-resource.openai.azure.com
AZURE_OPENAI_DEPLOYMENT=your_deployment_name
```

---

## Dropdown Menu Structure

The Import / Generate dropdown is organized into two groups:

```
Manual Import
  ├── Upload Text File
  └── Upload Caption File (.SRT/.VTT)

AI-Powered
  ├── AI Auto-Align to Timestamps      (requires raw text + AI config)
  ├── Import YouTube Captions           (requires YouTube URL)
  └── Import YouTube + AI Cleanup       (requires YouTube URL + AI config)
```

Each item shows:
- An icon (Upload, FileText, Sparkles, Youtube)
- A clear label
- A brief description of what the option does
- Disabled state with inline hint when prerequisites are not met

---

## Implementation Status

| Feature | Status | Frontend Handler | API Route |
|---|---|---|---|
| Upload Text File | Done | `handleUploadRawText()` | N/A (client-side) |
| Upload Caption File | Done | `handleUploadCaption()` | N/A (client-side) |
| AI Auto-Align | Frontend done, backend stubbed | `handleAiAlignment()` | `POST /api/v1/ai/align-transcript` |
| Import YouTube Captions | Frontend done, backend stubbed | `handleYouTubeImport()` | `GET /api/v1/youtube/captions` |
| Import YouTube + AI Cleanup | Frontend wired, backend not started | `handleYouTubeAiCleanup()` | Two-step (youtube + AI cleanup) |
