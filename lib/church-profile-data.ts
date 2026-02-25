export type SocialLink = {
  platform: string
  url: string
}

export type WorshipService = {
  day: string
  startTime: string
  endTime: string
  description: string
}

export type ChurchProfile = {
  name: string
  description: string
  address: {
    street: string
    city: string
    state: string
    zip: string
    notes: string
  }
  emails: { label: string; value: string }[]
  phones: { label: string; value: string }[]
  worshipServices: WorshipService[]
  socialLinks: SocialLink[]
}

export const dayOptions = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
] as const

export const socialPlatformOptions = [
  { value: "facebook", label: "Facebook", emoji: "\uD83D\uDCD8" },
  { value: "instagram", label: "Instagram", emoji: "\uD83D\uDCF8" },
  { value: "youtube", label: "YouTube", emoji: "\uD83C\uDFAC" },
  { value: "x", label: "X (Twitter)", emoji: "\uD835\uDD4F" },
  { value: "tiktok", label: "TikTok", emoji: "\uD83C\uDFB5" },
  { value: "linkedin", label: "LinkedIn", emoji: "\uD83D\uDCBC" },
  { value: "spotify", label: "Spotify", emoji: "\uD83C\uDFA7" },
  { value: "apple-podcasts", label: "Apple Podcasts", emoji: "\uD83C\uDF99\uFE0F" },
  { value: "website", label: "Website", emoji: "\uD83C\uDF10" },
  { value: "other", label: "Other", emoji: "\uD83D\uDD17" },
] as const

export const defaultProfile: ChurchProfile = {
  name: "Los Angeles UBF",
  description:
    "Los Angeles University Bible Fellowship is a Christ-centered community dedicated to campus ministry and world mission through one-to-one Bible study.",
  address: {
    street: "1136 W 6th St",
    city: "Los Angeles",
    state: "CA",
    zip: "90017",
    notes: "Street parking available. Enter through the main glass doors.",
  },
  emails: [
    { label: "General Inquiries", value: "info@laubf.org" },
    { label: "Prayer Requests", value: "prayer@laubf.org" },
  ],
  phones: [
    { label: "Main Office", value: "(213) 555-0120" },
    { label: "Pastor", value: "(213) 555-0145" },
  ],
  worshipServices: [
    {
      day: "Sunday",
      startTime: "10:00",
      endTime: "12:00",
      description: "Sunday Worship Service",
    },
    {
      day: "Friday",
      startTime: "19:30",
      endTime: "21:00",
      description: "Friday Bible Study",
    },
  ],
  socialLinks: [
    { platform: "facebook", url: "https://facebook.com/laubf" },
    { platform: "youtube", url: "https://youtube.com/@laubf" },
    { platform: "spotify", url: "https://open.spotify.com/show/laubf" },
  ],
}
