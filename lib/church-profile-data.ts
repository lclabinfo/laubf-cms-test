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
