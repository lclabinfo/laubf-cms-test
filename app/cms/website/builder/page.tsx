import { redirect } from "next/navigation"
import { getChurchId } from "@/lib/api/get-church-id"
import { getPages, getHomepageForAdmin } from "@/lib/dal/pages"

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

  // No pages exist - show empty state
  return (
    <div className="flex h-screen items-center justify-center">
      <div className="text-center space-y-4">
        <h2 className="text-xl font-semibold">No pages yet</h2>
        <p className="text-muted-foreground text-sm">
          Create your first page to get started with the website builder.
        </p>
      </div>
    </div>
  )
}
