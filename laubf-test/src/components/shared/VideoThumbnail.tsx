/*
 * CMS SETTINGS (per video):
 * - title: string — video title
 * - thumbnailUrl: string — preview image
 * - videoUrl: string — YouTube/Vimeo URL
 */
import type { VideoThumbnailProps } from "@/lib/types/shared";
import { cn } from "@/lib/utils";
import Image from "next/image";

export default function VideoThumbnail({
  data,
  size = "grid",
  onClick,
  className,
}: VideoThumbnailProps) {
  const isFeatured = size === "featured";

  const inner = (
    <>
      <Image
        src={data.thumbnailUrl}
        alt={data.title}
        fill
        className="object-cover transition-transform duration-500 ease-smooth group-hover:scale-105"
      />
      <div className="absolute inset-0 bg-black/20 transition-colors group-hover:bg-black/30" />
      {/* Play button */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div
          className={cn(
            "flex items-center justify-center rounded-full bg-white-1/90 backdrop-blur-sm transition-transform group-hover:scale-110",
            isFeatured ? "size-20 sm:size-28 md:size-36" : "size-12"
          )}
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            className={cn(
              "text-black-1",
              isFeatured ? "size-8 sm:size-12 md:size-16 ml-1 md:ml-2" : "size-5 ml-0.5"
            )}
          >
            <path d="M8 5v14l11-7L8 5z" fill="currentColor" />
          </svg>
        </div>
      </div>
    </>
  );

  const sharedClasses = cn(
    "group relative block w-full overflow-hidden rounded-xl bg-black-1",
    "aspect-video",
    className
  );

  if (onClick) {
    return (
      <button onClick={onClick} className={sharedClasses}>
        {inner}
      </button>
    );
  }

  return (
    <div className={sharedClasses}>
      {inner}
    </div>
  );
}
