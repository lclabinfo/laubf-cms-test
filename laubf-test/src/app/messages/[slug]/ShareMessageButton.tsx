"use client";

import { IconShare } from "@/components/layout/icons";

export default function ShareMessageButton({ title }: { title: string }) {
  return (
    <button
      onClick={() => {
        if (navigator.share) {
          navigator.share({ title, url: window.location.href });
        } else {
          navigator.clipboard.writeText(window.location.href);
        }
      }}
      className="flex items-center justify-center size-9 rounded-full hover:bg-white-1-5 transition-colors"
      aria-label="Share message"
    >
      <IconShare className="size-4 text-black-3" />
    </button>
  );
}
