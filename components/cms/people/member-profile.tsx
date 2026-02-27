"use client"

import { useRouter } from "next/navigation"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ProfileHeader } from "./profile-header"
import { ProfilePersonalInfo } from "./profile-personal-info"
import { ProfileContactInfo } from "./profile-contact-info"
import { ProfileChurchInfo } from "./profile-church-info"
import { ProfileHousehold } from "./profile-household"
import { ProfileGroups } from "./profile-groups"
import { ProfileNotes } from "./profile-notes"
import { ProfileCommunicationPrefs } from "./profile-communication-prefs"
import { ProfileTags } from "./profile-tags"
import { ProfileCustomFields } from "./profile-custom-fields"
import { ProfileActivity } from "./profile-activity"
import type { PersonDetail } from "./types"

type Props = {
  person: PersonDetail
  churchId: string
}

export function MemberProfile({ person: initialPerson, churchId }: Props) {
  const router = useRouter()

  const refreshData = () => {
    router.refresh()
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/cms/people/members">
            <ArrowLeft />
          </Link>
        </Button>
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Member Profile</h1>
          <p className="text-muted-foreground text-sm">
            View and manage member information
          </p>
        </div>
      </div>

      <ProfileHeader person={initialPerson} onUpdate={refreshData} />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <ProfilePersonalInfo person={initialPerson} onUpdate={refreshData} />
          <ProfileContactInfo person={initialPerson} onUpdate={refreshData} />
          <ProfileChurchInfo person={initialPerson} onUpdate={refreshData} />
          <ProfileCustomFields person={initialPerson} onUpdate={refreshData} />
          <ProfileNotes
            person={initialPerson}
            churchId={churchId}
            onUpdate={refreshData}
          />
        </div>
        <div className="space-y-6">
          <ProfileHousehold person={initialPerson} onUpdate={refreshData} />
          <ProfileGroups person={initialPerson} onUpdate={refreshData} />
          <ProfileCommunicationPrefs person={initialPerson} onUpdate={refreshData} />
          <ProfileTags person={initialPerson} onUpdate={refreshData} />
          <ProfileActivity person={initialPerson} />
        </div>
      </div>
    </div>
  )
}
