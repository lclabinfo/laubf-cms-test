"use client";

import { IconShare } from "@/components/layout/icons";

export default function ShareButton({ title }: { title: string }) {
  return (
    <button
      onClick={() => {
        if (navigator.share) {
          navigator.share({
            title,
            url: window.location.href,
          });
        } else {
          navigator.clipboard.writeText(window.location.href);
        }
      }}
      className="flex items-center justify-center gap-2 w-full rounded-full border border-black-1/20 text-black-2 py-4 text-button-1 transition-colors hover:bg-white-1-5"
    >
      <IconShare className="size-4" />
      Share Event
    </button>
  );
}
