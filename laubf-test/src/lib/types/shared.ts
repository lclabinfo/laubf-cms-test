import type { SectionTheme } from "../theme";

/* ---- Button ---- */
export interface CTAButtonProps {
  label: string;
  href?: string;
  onClick?: () => void;
  variant?: "primary" | "secondary" | "campus";
  size?: "default" | "small" | "nav" | "full";
  theme?: SectionTheme;
  icon?: React.ReactNode;
  className?: string;
  type?: "button" | "submit";
  target?: string;
  rel?: string;
}

/* ---- Event Card ---- */
export type EventCardSize = "large" | "small";

export interface EventCardData {
  id: string;
  title: string;
  date: string;
  location?: string;
  imageUrl: string;
  imageAlt?: string;
  imageObjectPosition?: string;
  badge?: string;
  href?: string;
}

export interface EventCardProps {
  data: EventCardData;
  size: EventCardSize;
  className?: string;
}

/* ---- Image Card (Next Steps) ---- */
export interface ImageCardData {
  id: string;
  title: string;
  description: string;
  imageUrl: string;
  imageAlt?: string;
  imageObjectPosition?: string;
  href?: string;
}

export interface ImageCardProps {
  data: ImageCardData;
  className?: string;
}

/* ---- Filter Pill ---- */
export interface FilterPillProps {
  label: string;
  active: boolean;
  onClick: () => void;
  className?: string;
}

/* ---- Type Pill ---- */
export type EventType = "meeting" | "event" | "program";

export interface TypePillProps {
  type: EventType;
  className?: string;
}

/* ---- Event Badge ---- */
export interface EventBadgeProps {
  label: string;
  className?: string;
}

/* ---- Event List Item ---- */
export interface EventListItemData {
  id: string;
  title: string;
  dateStart: Date;
  dateEnd?: Date;
  time: string;
  type: EventType;
  location?: string;
  href?: string;
  isRecurring?: boolean;
  recurrenceSchedule?: string;
}

export interface EventListItemProps {
  data: EventListItemData;
  className?: string;
}

/* ---- Overline Label ---- */
export interface OverlineLabelProps {
  text: string;
  className?: string;
}

/* ---- Video Thumbnail ---- */
export interface VideoThumbnailData {
  id: string;
  title: string;
  thumbnailUrl: string;
  videoUrl?: string;
  duration?: string;
}

export interface VideoThumbnailProps {
  data: VideoThumbnailData;
  size?: "featured" | "grid";
  onClick?: () => void;
  className?: string;
}

/* ---- Section Header ---- */
export interface SectionHeaderProps {
  heading: string;
  subheading?: string;
  ctaLabel?: string;
  ctaHref?: string;
  showCta?: boolean;
  className?: string;
}

/* ---- Arrow Button ---- */
export interface ArrowButtonProps {
  size?: 56 | 48 | 20;
  direction?: "right" | "left" | "up" | "down";
  className?: string;
  onClick?: () => void;
  href?: string;
}
