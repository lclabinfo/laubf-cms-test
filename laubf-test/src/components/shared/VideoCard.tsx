/*
 * VideoCard — YouTube-inspired card for the Videos explore page
 *
 * Displays a thumbnail with play overlay + duration badge,
 * then category pill, date, and title below. Clicking opens
 * a video modal (onClick handler, not a Link).
 */
import type { Video } from "@/lib/types/video";

function formatDate(dateStr: string) {
  const date = new Date(dateStr + "T00:00:00");
  const month = date
    .toLocaleDateString("en-US", { month: "short" })
    .toUpperCase();
  const day = date.getDate();
  const year = date.getFullYear();
  return `${month} ${day}, ${year}`;
}

export default function VideoCard({
  video,
  onClick,
}: {
  video: Video;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="group relative text-left cursor-pointer transition-all hover:shadow-[0px_8px_16px_0px_rgba(0,0,0,0.06)] rounded-[16px]"
    >
      {/* YouTube Thumbnail */}
      <div className="relative aspect-video rounded-[16px] overflow-hidden bg-white-1-5">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={`https://img.youtube.com/vi/${video.youtubeId}/maxresdefault.jpg`}
          alt={video.title}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
        {/* Dark overlay */}
        <div className="absolute inset-0 bg-black/10 transition-colors group-hover:bg-black/20" />
        {/* Play button */}
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
          <div className="flex items-center justify-center rounded-full bg-white-0/90 backdrop-blur-sm size-12 transition-transform group-hover:scale-110">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              className="size-5 ml-0.5 text-black-1"
            >
              <path d="M8 5v14l11-7L8 5z" fill="currentColor" />
            </svg>
          </div>
        </div>
        {/* Duration badge */}
        <span className="absolute bottom-2 right-2 bg-black-1/80 text-white-0 text-[10px] font-medium px-1.5 py-0.5 rounded-[4px]">
          {video.duration}
        </span>
        {/* Short badge */}
        {video.isShort && (
          <span className="absolute top-2 left-2 bg-white-0/90 text-black-1 text-[10px] font-bold px-1.5 py-0.5 rounded-[4px] uppercase tracking-wider">
            Short
          </span>
        )}
      </div>

      {/* Content area */}
      <div className="pt-3 pb-1 px-1">
        {/* Category + Date */}
        <div className="flex items-center gap-2 mb-1.5">
          <span className="text-[10px] font-bold text-black-1 uppercase tracking-[0.02em]">
            {video.category}
          </span>
          <span className="size-[3px] rounded-full bg-white-2-5 shrink-0" />
          <span className="text-[10px] font-medium text-black-3 uppercase tracking-[0.02em]">
            {formatDate(video.datePublished)}
          </span>
        </div>

        {/* Title */}
        <h3 className="text-[18px] font-medium text-black-1 leading-[1.2] tracking-[-0.36px] line-clamp-2">
          {video.title}
        </h3>
      </div>
    </button>
  );
}
