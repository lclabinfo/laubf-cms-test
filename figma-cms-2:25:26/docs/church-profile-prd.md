# Church Profile Page Feature List

This document outlines the features and inputs for the "Church Profile" page, which allows administrators to manage the church's public identity, location, and contact information.

## Core Interface
- **Page Header**:
  - Title and Description.
  - **Save Action**: Primary button to persist all profile changes.
- **Form Structure**: A single page, long-scrolling form divided into logical sections with card containers.

## Content Sections

### 1. Identity & Description
- **Church Name**: Text input (Required).
- **Description**: Textarea for mission statement or brief bio. Used for SEO and website footers.

### 2. Location
- **Address Fields**:
  - Street Address.
  - City.
  - State / Province.
  - Zip / Postal Code.
- **Additional Notes**: Textarea for parking instructions, entrance details, etc.

### 3. Contact Information
- **Email Addresses**:
  - **Dynamic List**: Ability to add multiple email entries.
  - **Fields**:
    - Label (e.g., "General Inquiries", "Prayer").
    - Email Value (Validated input).
  - **Actions**: Add new email, Remove existing email.
- **Phone Numbers**:
  - **Dynamic List**: Ability to add multiple phone entries.
  - **Fields**:
    - Label (e.g., "Main Office").
    - Phone Value.
  - **Actions**: Add new phone, Remove existing phone.

### 4. Service Times & Office Hours
- **Weekly Schedule**:
  - **Dynamic List**: Manage recurring weekly events.
  - **Fields**:
    - **Day**: Dropdown (Sunday - Saturday).
    - **Start Time**: Time picker input.
    - **End Time**: Time picker input.
    - **Description**: Text input (e.g., "Sunday Service", "Bible Study").
  - **Actions**: Add schedule item, Remove schedule item.

### 5. Social Media
- **Standard Platforms**: Dedicated inputs for common networks.
  - Facebook URL.
  - Instagram URL.
  - YouTube Channel URL.
  - X (Twitter) URL.
- **Custom Links**:
  - **Dynamic List**: Add other platforms (e.g., Spotify, TikTok).
  - **Fields**:
    - Platform Name.
    - URL.
  - **Actions**: Add custom link, Remove custom link.

## Data Inputs Summary

| Section | Field | Type | Required | Notes |
|---------|-------|------|----------|-------|
| Identity | Name | String | Yes | |
| Identity | Description | String | No | |
| Location | Street | String | No | |
| Location | City | String | No | |
| Location | State | String | No | |
| Location | Zip | String | No | |
| Location | Notes | String | No | |
| Contact | Emails | Array | No | { label, value } |
| Contact | Phones | Array | No | { label, value } |
| Schedule | Schedule Items | Array | No | { day, openTime, closeTime, description } |
| Socials | Facebook | String | No | URL |
| Socials | Instagram | String | No | URL |
| Socials | YouTube | String | No | URL |
| Socials | X (Twitter) | String | No | URL |
| Socials | Custom Links | Array | No | { platform, url } |
