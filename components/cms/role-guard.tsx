"use client"

import { useCmsSession } from "@/components/cms/cms-shell"
import { useRouter } from "next/navigation"
import { useEffect } from "react"
import type { Permission } from "@/lib/permissions"
import { hasPermission } from "@/lib/permissions"
import { Eye } from "lucide-react"

interface RoleGuardProps {
  requiredPermission: Permission | Permission[]
  children: React.ReactNode
}

export function RoleGuard({ requiredPermission, children }: RoleGuardProps) {
  const session = useCmsSession()
  const router = useRouter()
  const allowed = hasPermission(session.permissions ?? [], requiredPermission)

  useEffect(() => {
    if (!allowed) router.replace("/cms/dashboard")
  }, [allowed, router])

  if (!allowed) return null

  return <>{children}</>
}

/** Hook to check if the current user can edit website features */
export function useCanEditWebsite(): boolean {
  const session = useCmsSession()
  return hasPermission(session.permissions ?? [], 'website.pages.edit')
}

/** Banner shown on website pages when user has view-only access */
export function WebsiteReadOnlyBanner() {
  const canEdit = useCanEditWebsite()
  if (canEdit) return null
  return (
    <div className="flex items-center gap-2 rounded-lg border border-blue-200 bg-blue-50 dark:border-blue-900 dark:bg-blue-950/50 px-4 py-2.5 text-sm text-blue-700 dark:text-blue-300 mb-4">
      <Eye className="size-4 shrink-0" />
      <span>
        <strong>View only</strong> — You can browse the website configuration but editing requires elevated permissions.
      </span>
    </div>
  )
}
