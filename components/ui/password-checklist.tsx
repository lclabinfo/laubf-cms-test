"use client"

import { useMemo } from "react"
import { CheckIcon, XIcon } from "lucide-react"

function PasswordChecklist({ password }: { password: string }) {
  const rules = useMemo(() => [
    { label: "At least 8 characters", met: password.length >= 8 },
    { label: "Uppercase letter", met: /[A-Z]/.test(password) },
    { label: "Lowercase letter", met: /[a-z]/.test(password) },
    { label: "Number", met: /\d/.test(password) },
  ], [password])

  if (!password) {
    return (
      <ul className="space-y-1 pt-1">
        {rules.map((rule) => (
          <li key={rule.label} className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <span className="size-3.5 shrink-0 rounded-full border border-muted-foreground/30" />
            {rule.label}
          </li>
        ))}
      </ul>
    )
  }

  return (
    <ul className="space-y-1 pt-1">
      {rules.map((rule) => (
        <li
          key={rule.label}
          className={`flex items-center gap-1.5 text-xs transition-colors ${
            rule.met ? "text-green-600 dark:text-green-400" : "text-destructive"
          }`}
        >
          {rule.met ? (
            <CheckIcon className="size-3.5 shrink-0" />
          ) : (
            <XIcon className="size-3.5 shrink-0" />
          )}
          {rule.label}
        </li>
      ))}
    </ul>
  )
}

export { PasswordChecklist }
