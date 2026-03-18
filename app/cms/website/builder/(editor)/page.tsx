import { redirect } from "next/navigation"
import { getChurchId } from "@/lib/api/get-church-id"
import { getPages, getHomepageForAdmin } from "@/lib/dal/pages"
import { BuilderEmptyState } from "@/components/cms/website/builder/builder-empty-state"

export default async function BuilderEntryPage() {
  const churchId = await getChurchId()

  // Try homepage first
  const homepage = await getHomepageForAdmin(churchId)
  if (homepage) {
    redirect(`/cms/website/builder/${homepage.id}`)
  }

  // Fall back to first page by sortOrder
  const pages = await getPages(churchId)
  if (pages.length > 0) {
    redirect(`/cms/website/builder/${pages[0].id}`)
  }

  // No pages exist - show onboarding empty state
  return <BuilderEmptyState />
}
