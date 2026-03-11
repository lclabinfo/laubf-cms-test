import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { OnboardingForm } from "./onboarding-form"

export default async function OnboardingPage() {
  const session = await auth()

  if (!session?.user) {
    redirect("/cms/login")
  }

  if (!session.churchId) {
    redirect("/cms/no-access")
  }

  if (session.memberStatus !== "PENDING") {
    redirect("/cms")
  }

  // Split session user name into first/last for pre-filling
  const nameParts = (session.user.name ?? "").trim().split(/\s+/)
  const firstName = nameParts[0] ?? ""
  const lastName = nameParts.slice(1).join(" ")

  return (
    <OnboardingForm
      userName={{ firstName, lastName }}
      userEmail={session.user.email ?? ""}
      churchName={session.churchName}
      roleName={session.roleName}
    />
  )
}
