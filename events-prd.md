# Events Page (Event Form) Feature List

This document outlines the features and inputs for the "Events" page (EventForm), which allows users to manage church events, meetings, and programs.

## Core Interface
- **Navigation**: Back button (Cancel) to return to the event list.
- **Page Title**: Dynamic header ("New Event" or "Edit Event").
- **Global Actions**:
  - Cancel: Discards changes.
  - Save Event: Persists the event data.
- **Status Indicator**: Badge showing current status (Draft/Published) and unsaved changes indicator.

## Main Content Area (Left Column)

### 1. Basic Information
- **Title**: Text input for the event name (Required, min 2 chars).

### 2. Date & Time Management
- **Start Date**: Date picker (Calendar popover).
- **Time Range**:
  - Start Time input (e.g., "10:00").
  - End Time input (e.g., "11:30").
- **End Date**: Date picker (Calendar popover).
- **Recurrence**:
  - **Quick Select Dropdown**:
    - Does not repeat
    - Daily
    - Weekly
    - Monthly
    - Yearly
    - Weekday (Mon-Fri)
    - Custom...
  - **Custom Recurrence Dialog**:
    - **Interval**: Number input (Repeat every X weeks).
    - **Days of Week**: Multi-select toggle buttons (S M T W T F S).
    - **End Condition**:
      - Never.
      - On Date (Date picker).
      - After (Number of occurrences).

### 3. Location Details
- **Location Type**: Radio buttons.
  - **In-Person**: Input for physical address.
  - **Online**: Input for video conferencing link.
- **Location/Link**: Text input with icon (MapPin).

### 4. Content
- **Description**: Rich Text Editor for event details, agenda, and notes.
- **Welcome Message**: Optional text input for a short greeting for new visitors.

## Sidebar (Right Column)

### 1. Organization & Classification
- **Status**: Dropdown (Draft, Published).
- **Event Type**: Dropdown (Event, Meeting, Program).
- **Ministry / Category**: Dropdown.
  - Options: Worship, Youth, Kids, Outreach, Leadership, Education, Prayer.
- **Points of Contact**:
  - **List**: Badge display of added names with remove (X) button.
  - **Add Person**: Text input with "Add" button (Plus icon) or Enter key support.

### 2. Media
- **Cover Image**:
  - **Preview**: Aspect-video container showing selected image.
  - **Actions**:
    - **Remove**: Button to clear current image.
    - **Upload**: Button (Mock functionality).
    - **Generate AI**: Button to insert mock Unsplash image.
    - **Library**: Opens `MediaSelectorDialog` to pick from existing assets.

## Data Inputs Summary

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| Title | String | Yes | Min 2 chars |
| Type | Enum | Yes | Event, Meeting, Program |
| Start Date | Date | Yes | |
| End Date | Date | Yes | |
| Start Time | String | Yes | HH:MM format |
| End Time | String | Yes | HH:MM format |
| Recurrence | Object | No | Pattern, Interval, Days, End settings |
| Location Type | Enum | Yes | In-person / Online |
| Location | String | Yes | Address or URL |
| Description | String | No | HTML/Rich Text |
| Welcome Msg | String | No | |
| Ministry | String | No | |
| Contacts | Array<String> | No | List of names |
| Cover Image | String | No | URL |
| Status | Enum | Yes | Draft / Published |
