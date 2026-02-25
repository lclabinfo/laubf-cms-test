# Messages Subpage (Entry Editor) Feature List

This document outlines the features and inputs for the "Messages" subpage (EntryEditor), which allows users to manage sermon videos, transcripts, and bible study materials.

## Core Interface
- **Navigation**: Back button to return to the library list.
- **Page Title**: Dynamic header ("New Message" or "Edit Message").
- **Global Actions**:
  - Cancel: Discards changes.
  - Save Changes: Persists the entry (Title, Metadata, Video, Study, Attachments).

## Main Content Area

### 1. Basic Information
- **Message Title**: Text input for the main title of the sermon/study.

### 2. Video Management (Tab)
- **YouTube Integration**:
  - **Video URL Input**: Field to paste a YouTube link.
  - **Check URL**: Button to validate and preview the video.
  - **Video Preview**: Embedded YouTube player for visual confirmation.
  - **Import Metadata**: Button to fetch captions and details from YouTube (Mock functionality).
- **Description**: Textarea for the video description.
- **Transcript Editor**:
  - **Modes**:
    - **Live Transcript (Synced)**: Segment-based editing with timestamps.
      - Upload Caption File (.SRT/.VTT).
      - Import from YouTube.
      - Generate from Audio (AI Simulation).
      - Edit individual text segments and timestamps.
      - Add/Delete segments.
    - **Raw Transcript**: distinct text area for pasting full scripts.
      - Upload Text File (.TXT/.DOCX).
      - AI Alignment: Convert raw text to synced segments (AI Simulation).
  - **Download**: Option to export transcript as .TXT or .SRT.

### 3. Bible Study Material (Tab)
- **Study Tabs**:
  - Supports multiple sections (e.g., "Questions", "Answers").
  - Tab navigation to switch between study sections.
- **Content Editor**:
  - **Rich Text Editor**: WYSIWYG editor for writing study content.
  - **Import Tools**:
    - Import from DOCX (Mock).
    - Import from Google Drive (Mock).

## Metadata Sidebar (Right Column)

### 1. Publishing Status
- **Status Selector**: Dropdown to set visibility.
  - Options: Draft, Published, Scheduled, Archived.

### 2. Event Details
- **Date**: Date picker with calendar view for the sermon date.
- **Speaker**: Text input for the preacher/speaker name.

### 3. Categorization
- **Series**: Multi-select dropdown with search.
  - Searchable command palette.
  - Badges for selected series.
  - Ability to select multiple series.
- **Passage**: Text input for scripture reference (e.g., "John 3:16").

### 4. Attachments
- **File List**: View uploaded resources (PDFs, Bulletins, etc.).
- **Upload**: Button to upload new files (Mock).
- **Management**: Remove existing attachments.

## Data Inputs Summary

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| Title | String | Yes | Min 2 chars |
| Date | Date | Yes | Defaults to today |
| Speaker | String | Yes | Min 2 chars |
| Status | Enum | Yes | Default: Draft |
| Series | Array<String> | No | IDs of related series |
| Passage | String | No | |
| Video URL | String | No | YouTube format |
| Description | String | No | |
| Transcript | String | No | stored as raw text or segments |
| Study Tabs | Array<Object> | No | { id, title, content } |
| Attachments | Array<Object> | No | { name, size, type } |
