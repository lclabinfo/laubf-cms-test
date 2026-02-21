/*
 * VideoModal — Full-screen modal with embedded YouTube player
 *
 * Opens when clicking a VideoCard. Shows the embedded video,
 * metadata (category, date, duration, description), and a
 * "Watch on YouTube" link. Closes on X, Escape, or backdrop click.
 */
"use client";

import { useEffect, useCallback } from "react";
import type { Video } from "@/lib/types/video";

function formatDate(dateStr: string) {
  const date = new Date(dateStr + "T00:00:00");
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default function VideoModal({
  video,
  onClose,
}: {
  video: Video;
  onClose: () => void;
}) {
  /* ── Escape key handler ── */
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    },
    [onClose],
  );

  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [handleKeyDown]);

  const youtubeUrl = video.isShort
    ? `https://www.youtube.com/shorts/${video.youtubeId}`
    : `https://www.youtube.com/watch?v=${video.youtubeId}`;

  return (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center bg-black/80 p-4 sm:p-8 overflow-y-auto animate-hero-fade-in"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-[1024px] my-auto bg-white-0 rounded-[16px] sm:rounded-[24px] overflow-hidden shadow-[0px_25px_50px_-12px_rgba(0,0,0,0.25)] animate-scale-in"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ── Video Player ── */}
        <div className="relative aspect-video bg-black-1">
          <iframe
            src={`https://www.youtube.com/embed/${video.youtubeId}?autoplay=1&rel=0`}
            title={video.title}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            className="absolute inset-0 w-full h-full"
          />
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-3 right-3 flex items-center justify-center size-10 rounded-full bg-black/50 text-white-0 transition-colors hover:bg-black/70 z-10"
            aria-label="Close video"
          >
            <svg viewBox="0 0 24 24" fill="none" className="size-5">
              <path
                d="M18 6L6 18M6 6l12 12"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        </div>

        {/* ── Content ── */}
        <div className="p-6">
          {/* Meta row */}
          <div className="flex items-center gap-2 mb-3">
            <span className="text-[10px] font-bold text-black-1 uppercase tracking-[0.02em]">
              {video.category}
            </span>
            <span className="size-[3px] rounded-full bg-white-2-5 shrink-0" />
            <span className="text-[10px] font-medium text-black-3 uppercase tracking-[0.02em]">
              {formatDate(video.datePublished)}
            </span>
            <span className="size-[3px] rounded-full bg-white-2-5 shrink-0" />
            <span className="text-[10px] font-medium text-black-3 uppercase tracking-[0.02em]">
              {video.duration}
            </span>
          </div>

          {/* Title */}
          <h2 className="text-[24px] font-medium text-black-1 leading-[1.2] tracking-[-0.48px] mb-2">
            {video.title}
          </h2>

          {/* Description */}
          <p className="text-[14px] text-black-2-5 leading-[1.625] mb-5">
            {video.description}
          </p>

          {/* Divider + Watch on YouTube */}
          <div className="border-t border-white-1-5 pt-4">
            <a
              href={youtubeUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 bg-black-1 text-white-0 rounded-[10px] px-5 py-2.5 text-[12px] font-bold uppercase tracking-[0.6px] transition-colors hover:bg-black-2"
            >
              <svg viewBox="0 0 24 24" fill="none" className="size-4">
                <path d="M8 5v14l11-7L8 5z" fill="currentColor" />
              </svg>
              Watch on YouTube
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
