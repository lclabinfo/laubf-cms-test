import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { CmsShell } from "@/components/cms/cms-shell"

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await auth()

  if (!session?.user) {
    redirect("/cms/login")
  }

  if (!session.churchId) {
    redirect("/cms/no-access")
  }

  return (
    <CmsShell
      session={{
        user: {
          id: session.user.id,
          name: session.user.name ?? "",
          email: session.user.email ?? "",
          image: session.user.image ?? null,
        },
        churchName: session.churchName,
        churchSlug: session.churchSlug,
        role: session.role,
      }}
    >
      {children}
    </CmsShell>
  )
}
