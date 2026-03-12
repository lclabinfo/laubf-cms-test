"use client"

import { useEffect, useState } from "react"
import { ProfileForm } from "@/components/cms/church-profile/profile-form"
import { useCmsSession } from "@/components/cms/cms-shell"
import { PageHeader } from "@/components/cms/page-header"
import type { ChurchProfile } from "@/lib/church-profile-data"

const emptyProfile: ChurchProfile = {
  name: "",
  description: "",
  address: { street: "", city: "", state: "", zip: "", notes: "" },
  emails: [],
  phones: [],
  worshipServices: [],
  socialLinks: [],
}

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

/* ── Quick links data types ── */

interface QuickLinkItem {
  id: string
  label: string
  description: string | null
  href: string | null
  iconName: string | null
  isVisible: boolean
  isExternal: boolean
  openInNewTab: boolean
  sortOrder: number
  groupLabel: string | null
  parentId: string | null
}

interface MenuData {
  menuId: string
  parentId: string
  quickLinks: QuickLinkItem[]
}

/**
 * Fetch the HEADER menu and extract quick link items.
 * Quick links are children of a top-level item with groupLabel === "Quick Links".
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function extractQuickLinksData(menu: any): MenuData | null {
  if (!menu || !menu.items) return null

  for (const topItem of menu.items) {
    if (!topItem.children) continue
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const qlChildren = topItem.children.filter(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (c: any) => c.groupLabel?.toLowerCase() === "quick links"
    )
    if (qlChildren.length > 0) {
      return {
        menuId: menu.id,
        parentId: topItem.id,
        quickLinks: qlChildren,
      }
    }
  }

  // No quick links found yet — find the first top-level item to use as parent
  // (so we can still add new quick links)
  if (menu.items.length > 0) {
    return {
      menuId: menu.id,
      parentId: menu.items[0].id,
      quickLinks: [],
    }
  }

  return null
}

export default function ChurchProfilePage() {
  const { user } = useCmsSession()
  const [profile, setProfile] = useState<ChurchProfile | null>(null)
  const [menuData, setMenuData] = useState<MenuData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function loadData() {
      try {
        // Fetch church profile and menus list in parallel
        const [profileRes, menusRes] = await Promise.all([
          fetch("/api/v1/church"),
          fetch("/api/v1/menus"),
        ])

        // Process profile
        if (profileRes.ok) {
          const profileJson = await profileRes.json()
          if (profileJson.success && profileJson.data) {
            setProfile(apiToProfile(profileJson.data))
          } else {
            setProfile(emptyProfile)
          }
        } else {
          throw new Error("Failed to load church profile")
        }

        // Process menus — find the HEADER menu, then fetch its items
        if (menusRes.ok) {
          const menusJson = await menusRes.json()
          if (menusJson.success && menusJson.data) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const headerMenu = menusJson.data.find((m: any) => m.location === "HEADER")
            if (headerMenu) {
              const itemsRes = await fetch(`/api/v1/menus/${headerMenu.id}/items`)
              if (itemsRes.ok) {
                const itemsJson = await itemsRes.json()
                if (itemsJson.success && itemsJson.data) {
                  setMenuData(extractQuickLinksData(itemsJson.data))
                }
              }
            }
          }
        }
      } catch (err) {
        console.error("Failed to load church profile:", err)
        setError((err as Error).message)
        setProfile(emptyProfile)
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [])

  if (loading) {
    return (
      <div className="pt-5 flex items-center justify-center flex-1">
        <p className="text-sm text-muted-foreground">Loading church profile...</p>
      </div>
    )
  }

  if (error && !profile) {
    return (
      <div className="pt-5 flex items-center justify-center flex-1">
        <p className="text-sm text-destructive">{error}</p>
      </div>
    )
  }

  return (
    <div className="pt-5 flex flex-col gap-4 flex-1 min-h-0">
      <PageHeader
        title="Church Profile"
        description="Manage your church identity, location, contacts, and quick links."
        tutorialId="church-profile"
        userId={user.id}
      />

      <ProfileForm
        initialData={profile!}
        userId={user.id}
        menuData={menuData}
        showHeader={false}
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
    </div>
  )
}
