/*
 * MessageCard — Card component for Sunday message/sermon entries
 *
 * Inner-padded card with YouTube thumbnail, series pill, date,
 * title, speaker, and passage. Hover changes background color.
 */
import Link from "next/link";
import type { Message } from "@/lib/types/message";
import {
  IconBookOpen,
  IconUser,
} from "@/components/layout/icons";

function formatDate(dateStr: string) {
  const date = new Date(dateStr + "T00:00:00");
  const month = date
    .toLocaleDateString("en-US", { month: "short" })
    .toUpperCase();
  const day = date.getDate();
  const year = date.getFullYear();
  return `${month} ${day}, ${year}`;
}

export default function MessageCard({ message }: { message: Message }) {
  return (
    <Link
      href={`/messages/${message.slug}`}
      className="group relative rounded-[24px] p-3 cursor-pointer transition-all duration-300 bg-white-0 hover:bg-white-1-5 hover:-translate-y-0.5 hover:shadow-[0px_8px_16px_0px_rgba(0,0,0,0.06)]"
    >
      {/* YouTube Thumbnail */}
      <div className="relative aspect-video rounded-[16px] overflow-hidden bg-black-1">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={`https://img.youtube.com/vi/${message.youtubeId}/maxresdefault.jpg`}
          alt={message.title}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
        {/* Dark overlay */}
        <div className="absolute inset-0 bg-black/20 transition-colors group-hover:bg-black/30" />
        {/* Play button */}
        <div className="absolute inset-0 flex items-center justify-center">
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
        {message.duration && (
          <span className="absolute bottom-2 right-2 bg-black-1/80 text-white-0 text-[12px] font-medium px-2 py-0.5 rounded-[6px]">
            {message.duration}
          </span>
        )}
      </div>

      {/* Content area */}
      <div className="flex flex-col items-start pt-5 px-2 pb-3">
        {/* Series pill + date row */}
        <div className="flex items-center justify-between w-full mb-[12px]">
          <div className="bg-white-2 flex flex-col items-start px-[8px] py-[6px] rounded-[8px] shrink-0">
            <p className="font-medium leading-none text-black-3 text-[12px] text-center tracking-[0.24px]">
              {message.series}
            </p>
          </div>
          <p className="font-medium leading-none text-black-3 text-[14px] tracking-[-0.42px] whitespace-nowrap">
            {formatDate(message.dateFor)}
          </p>
        </div>

        {/* Title */}
        <div className="w-full mb-[12px]">
          <p className="font-medium leading-[1.2] text-black-1 text-[18px] sm:text-[24px] tracking-[-0.72px] line-clamp-2">
            {message.title}
          </p>
        </div>

        {/* Speaker + Passage */}
        <div className="flex flex-col gap-[6px] w-full">
          <div className="flex gap-[8px] items-center">
            <IconUser className="shrink-0 size-[16px] text-black-3" />
            <p className="leading-[1.4] text-black-3 text-[14px] sm:text-[16px] tracking-[-0.32px]">
              {message.speaker}
            </p>
          </div>
          <div className="flex gap-[8px] items-center">
            <IconBookOpen className="shrink-0 size-[16px] text-black-3" />
            <p className="leading-[1.4] text-black-3 text-[14px] sm:text-[16px] tracking-[-0.32px]">
              {message.passage}
            </p>
          </div>
        </div>
      </div>

      {/* Border overlay */}
      <div
        aria-hidden="true"
        className="absolute border border-white-2-5 inset-0 pointer-events-none rounded-[24px]"
      />
    </Link>
  );
}
