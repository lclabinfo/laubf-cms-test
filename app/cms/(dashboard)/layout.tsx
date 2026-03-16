import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { Toaster } from "sonner"
import { CmsShell } from "@/components/cms/cms-shell"

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await auth()

  if (!session?.user) {
    redirect("/cms/login")
  }

  if (!session.churchId) {
    redirect("/cms/no-access")
  }

  // Redirect PENDING members to onboarding
  if (session.memberStatus === 'PENDING') {
    redirect("/cms/onboarding")
  }

  // Block inactive members
  if (session.memberStatus === 'INACTIVE') {
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
        roleId: session.roleId ?? '',
        roleName: session.roleName ?? '',
        rolePriority: session.rolePriority ?? 0,
        permissions: session.permissions ?? [],
        memberStatus: session.memberStatus ?? 'ACTIVE',
      }}
    >
      {children}
      <Toaster
        position="bottom-right"
        richColors
        toastOptions={{
          className: "!rounded-lg !border-border !font-[var(--font-sans)] !text-sm !shadow-lg",
          actionButtonStyle: {
            borderRadius: 'var(--radius)',
            fontWeight: '500',
            fontSize: '13px',
            padding: '4px 12px',
          },
        }}
      />
    </CmsShell>
  )
}
