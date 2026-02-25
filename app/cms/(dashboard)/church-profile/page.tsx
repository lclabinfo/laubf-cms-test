"use client"

import { ProfileForm } from "@/components/cms/church-profile/profile-form"
import { defaultProfile } from "@/lib/church-profile-data"

export default function ChurchProfilePage() {
  return <ProfileForm initialData={defaultProfile} />
}
