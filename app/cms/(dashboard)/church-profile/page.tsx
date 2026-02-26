"use client"

import { useEffect, useState } from "react"
import { ProfileForm } from "@/components/cms/church-profile/profile-form"
import { defaultProfile, type ChurchProfile } from "@/lib/church-profile-data"

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function apiToProfile(data: any): ChurchProfile {
  // The Church model stores social links and service times in the settings JSON field
  const settings = (data.settings && typeof data.settings === "object" && !Array.isArray(data.settings))
    ? data.settings
    : {}

  // Use settings.emails if available; fall back to top-level Church.email
  let emails: { label: string; value: string }[] = settings.emails ?? []
  if (emails.length === 0 && data.email) {
    emails = [{ label: "General", value: data.email }]
  }

  // Use settings.phones if available; fall back to top-level Church.phone
  let phones: { label: string; value: string }[] = settings.phones ?? []
  if (phones.length === 0 && data.phone) {
    phones = [{ label: "Main", value: data.phone }]
  }

  return {
    name: data.name ?? "",
    description: settings.description ?? "",
    address: {
      street: data.address ?? "",
      city: data.city ?? "",
      state: data.state ?? "",
      zip: data.zipCode ?? "",
      notes: settings.addressNotes ?? "",
    },
    emails,
    phones,
    worshipServices: settings.worshipServices ?? [],
    socialLinks: [
      ...(data.facebookUrl ? [{ platform: "facebook", url: data.facebookUrl }] : []),
      ...(data.youtubeUrl ? [{ platform: "youtube", url: data.youtubeUrl }] : []),
      ...(data.instagramUrl ? [{ platform: "instagram", url: data.instagramUrl }] : []),
      ...(data.twitterUrl ? [{ platform: "x", url: data.twitterUrl }] : []),
      ...(data.websiteUrl ? [{ platform: "website", url: data.websiteUrl }] : []),
      ...(settings.extraSocialLinks ?? []),
    ],
  }
}

function profileToApi(profile: ChurchProfile) {
  // Map known social platforms to dedicated DB columns, rest go in settings
  const socialMap: Record<string, string | null> = {}
  const extraSocialLinks: { platform: string; url: string }[] = []
  const platformToField: Record<string, string> = {
    facebook: "facebookUrl",
    youtube: "youtubeUrl",
    instagram: "instagramUrl",
    x: "twitterUrl",
    website: "websiteUrl",
  }

  for (const link of profile.socialLinks) {
    const field = platformToField[link.platform]
    if (field) {
      socialMap[field] = link.url || null
    } else {
      extraSocialLinks.push(link)
    }
  }

  // Set null for any platform columns not present in current links
  for (const field of Object.values(platformToField)) {
    if (!(field in socialMap)) {
      socialMap[field] = null
    }
  }

  // Sync primary email/phone to top-level Church columns
  const primaryEmail = profile.emails.length > 0 ? profile.emails[0].value : null
  const primaryPhone = profile.phones.length > 0 ? profile.phones[0].value : null

  return {
    name: profile.name,
    email: primaryEmail || null,
    phone: primaryPhone || null,
    address: profile.address.street || null,
    city: profile.address.city || null,
    state: profile.address.state || null,
    zipCode: profile.address.zip || null,
    ...socialMap,
    settings: {
      description: profile.description || null,
      addressNotes: profile.address.notes || null,
      emails: profile.emails,
      phones: profile.phones,
      worshipServices: profile.worshipServices,
      extraSocialLinks,
    },
  }
}

export default function ChurchProfilePage() {
  const [profile, setProfile] = useState<ChurchProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetch("/api/v1/church")
      .then((res) => {
        if (!res.ok) throw new Error("Failed to load church profile")
        return res.json()
      })
      .then((json) => {
        if (json.success && json.data) {
          setProfile(apiToProfile(json.data))
        } else {
          // Fallback to defaults if no data
          setProfile(defaultProfile)
        }
      })
      .catch((err) => {
        console.error("Failed to load church profile:", err)
        setError(err.message)
        setProfile(defaultProfile)
      })
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center flex-1">
        <p className="text-sm text-muted-foreground">Loading church profile...</p>
      </div>
    )
  }

  if (error && !profile) {
    return (
      <div className="flex items-center justify-center flex-1">
        <p className="text-sm text-destructive">{error}</p>
      </div>
    )
  }

  return (
    <ProfileForm
      initialData={profile!}
      onSave={async (data) => {
        const res = await fetch("/api/v1/church", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(profileToApi(data)),
        })
        if (!res.ok) throw new Error("Failed to save church profile")
        const json = await res.json()
        if (!json.success) throw new Error(json.error?.message ?? "Save failed")
      }}
    />
  )
}
