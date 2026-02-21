/*
 * CMS SETTINGS:
 * - type: 'meeting' | 'event' | 'program' — determines color
 */
import type { TypePillProps } from "@/lib/types/shared";
import { eventTypeColors, EVENT_TYPE_FALLBACK_COLOR } from "@/lib/theme";
import { cn } from "@/lib/utils";

export default function TypePill({ type, className }: TypePillProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2 py-1.5 text-pill text-white-1",
        eventTypeColors[type] ?? EVENT_TYPE_FALLBACK_COLOR,
        className
      )}
    >
      {type.toUpperCase()}
    </span>
  );
}
