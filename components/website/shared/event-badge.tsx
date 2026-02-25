/*
 * CMS SETTINGS:
 * - label: string -- badge text (e.g. "UPCOMING", "FEATURED")
 */
import { cn } from "@/lib/utils"

export default function EventBadge({ label, className }: { label: string; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex w-fit items-center rounded-full border border-black-3 bg-black-1 px-5 py-3 text-pill text-white-1",
        className
      )}
    >
      {label}
    </span>
  )
}
