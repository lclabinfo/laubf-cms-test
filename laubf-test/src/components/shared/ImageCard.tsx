/*
 * CMS SETTINGS (per card):
 * - title: string — card heading
 * - description: string — card body text
 * - imageUrl: string — background image
 * - href?: string — link destination (when omitted, renders as static card without arrow)
 */
import type { ImageCardProps } from "@/lib/types/shared";
import { cn } from "@/lib/utils";
import Image from "next/image";
import ArrowButton from "./ArrowButton";

export default function ImageCard({ data, className }: ImageCardProps) {
  const hasLink = !!data.href;
  const Tag = hasLink ? "a" : "div";

  return (
    <Tag
      {...(hasLink ? { href: data.href } : {})}
      className={cn(
        "group relative flex flex-col overflow-hidden rounded-xl",
        "min-h-[180px] sm:min-h-[200px] lg:aspect-[430/370] lg:min-h-0",
        className
      )}
    >
      <Image
        src={data.imageUrl}
        alt={data.imageAlt ?? data.title}
        fill
        className="object-cover transition-transform duration-500 ease-smooth group-hover:scale-105"
        style={{ objectPosition: data.imageObjectPosition }}
      />
      {/* Gradient scrim sized to text content, not full card */}
      <div className="relative z-10 mt-auto bg-gradient-to-t from-[rgba(0,0,0,0.71)] to-transparent pt-16 lg:pt-20 p-7 lg:p-8">
        <div className="flex w-full items-end justify-between gap-4">
          <div className="flex flex-col gap-2 text-white-1">
            <h3 className="text-h3 text-balance">{data.title}</h3>
            <p className="text-body-2 max-w-[302px] text-balance">{data.description}</p>
          </div>
          {hasLink && (
            <ArrowButton
              size={48}
              className="shrink-0 border border-white-1 text-white-1"
            />
          )}
        </div>
      </div>
    </Tag>
  );
}
