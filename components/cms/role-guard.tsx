"use client"

import { useCmsSession } from "@/components/cms/cms-shell"
import { useRouter } from "next/navigation"
import { useEffect } from "react"
import type { Permission } from "@/lib/permissions"
import { hasPermission } from "@/lib/permissions"

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
