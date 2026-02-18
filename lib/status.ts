import type { VariantProps } from "class-variance-authority"
import type { badgeVariants } from "@/components/ui/badge"

type BadgeVariant = NonNullable<VariantProps<typeof badgeVariants>["variant"]>

export type ContentStatus = "published" | "draft" | "scheduled" | "archived"

export const statusDisplay: Record<ContentStatus, { label: string; variant: BadgeVariant }> = {
  published: { label: "Published", variant: "default" },
  draft: { label: "Draft", variant: "secondary" },
  scheduled: { label: "Scheduled", variant: "warning" },
  archived: { label: "Archived", variant: "outline" },
}
