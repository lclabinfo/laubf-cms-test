"use client"

import { AlertTriangle } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface AINotConfiguredAlertProps {
  service: string
  action?: string
}

export function AINotConfiguredAlert({
  service,
  action = "Contact your administrator",
}: AINotConfiguredAlertProps) {
  return (
    <Alert variant="destructive">
      <AlertTriangle className="size-4" />
      <AlertDescription>
        AI features are not available. {action} to configure {service} API keys.
      </AlertDescription>
    </Alert>
  )
}
