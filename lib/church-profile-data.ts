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
  schedule: {
    day: string
    startTime: string
    endTime: string
    description: string
  }[]
  socials: {
    facebook: string
    instagram: string
    youtube: string
    x: string
    custom: { platform: string; url: string }[]
  }
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
  schedule: [
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
  socials: {
    facebook: "https://facebook.com/laubf",
    instagram: "",
    youtube: "https://youtube.com/@laubf",
    x: "",
    custom: [{ platform: "Spotify", url: "https://open.spotify.com/show/laubf" }],
  },
}
