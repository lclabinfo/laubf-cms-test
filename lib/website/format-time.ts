/**
 * Format a time string for display. Handles both 24hr ("14:30") and
 * 12hr ("2:30 PM") input formats. Returns a clean 12hr string.
 *
 * Examples:
 *   "06:00"    → "6:00 AM"
 *   "19:30"    → "7:30 PM"
 *   "6:00 AM"  → "6:00 AM" (passthrough)
 *   ""         → ""
 */
export function formatTime(time: string | null | undefined): string {
  if (!time || !time.trim()) return ''

  // Already in 12hr format (contains AM/PM)
  if (/[ap]m/i.test(time)) return time.trim()

  // Parse 24hr format "HH:MM" or "H:MM"
  const match = time.match(/^(\d{1,2}):(\d{2})/)
  if (!match) return time

  let hours = parseInt(match[1], 10)
  const minutes = match[2]
  const ampm = hours >= 12 ? 'PM' : 'AM'
  if (hours === 0) hours = 12
  else if (hours > 12) hours -= 12

  return `${hours}:${minutes} ${ampm}`
}

/**
 * Format a time range from start/end times.
 * Returns empty string if no start time.
 */
export function formatTimeRange(start: string | null | undefined, end: string | null | undefined): string {
  const formattedStart = formatTime(start)
  if (!formattedStart) return ''
  const formattedEnd = formatTime(end)
  if (!formattedEnd) return formattedStart
  return `${formattedStart} – ${formattedEnd}`
}
