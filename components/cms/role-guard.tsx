"use client"

import { useCmsSession } from "@/components/cms/cms-shell"
import { useRouter } from "next/navigation"
import { useEffect } from "react"

const ROLE_LEVEL: Record<string, number> = {
  VIEWER: 0,
  EDITOR: 1,
  ADMIN: 2,
  OWNER: 3,
}

interface RoleGuardProps {
  minRole: "VIEWER" | "EDITOR" | "ADMIN" | "OWNER"
  children: React.ReactNode
}

export function RoleGuard({ minRole, children }: RoleGuardProps) {
  const session = useCmsSession()
  const router = useRouter()
  const userLevel = ROLE_LEVEL[session.role] ?? 0
  const requiredLevel = ROLE_LEVEL[minRole] ?? 0

  useEffect(() => {
    if (userLevel < requiredLevel) {
      router.replace("/cms/dashboard")
    }
  }, [userLevel, requiredLevel, router])

  if (userLevel < requiredLevel) return null

  return <>{children}</>
}
