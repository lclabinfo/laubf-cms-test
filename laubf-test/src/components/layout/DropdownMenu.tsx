"use client";

import { Fragment } from "react";
import Link from "next/link";
import Image from "next/image";
import { SquareArrowOutUpRight, ArrowUpRight } from "lucide-react";
import type { NavDropdown, NavSection } from "./nav-data";
import { cn } from "@/lib/utils";

interface DropdownMenuProps {
  dropdown: NavDropdown;
  onClose: () => void;
}

function SectionColumn({
  section,
  onClose,
}: {
  section: NavSection;
  onClose: () => void;
}) {
  const isGrid = section.columns && section.columns > 1;

  return (
    <div className={cn("flex flex-col gap-1.5 shrink-0", isGrid ? "w-auto" : section.width ?? "w-56")}>
      {/* Section title */}
      <div className="px-1.5">
        <p className="text-base font-medium leading-[1.2] text-black-3 tracking-[-0.03em]">
          {section.title}
        </p>
      </div>

      {/* Items */}
      <div
        className={cn(
          isGrid
            ? "grid grid-cols-2 auto-rows-min"
            : "flex flex-col"
        )}
      >
        {section.items.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              target={item.external ? "_blank" : undefined}
              rel={item.external ? "noopener noreferrer" : undefined}
              onClick={onClose}
              className={cn(
                "flex items-center rounded-lg transition-colors hover:bg-white-1-5 group/item",
                section.compact
                  ? "gap-3 px-3 py-2.5 min-h-0"
                  : "gap-4 min-w-[200px] min-h-[62px] px-4 py-3",
              )}
            >
              {!section.compact && (
                <Icon
                  className="size-6 text-black-1 shrink-0"
                  strokeWidth={1.5}
                />
              )}
              <div className="flex flex-col gap-1 min-w-0 flex-1">
                <span className={cn(
                  "font-medium leading-tight text-black-1 tracking-[-0.03em]",
                  section.compact ? "text-[14px]" : "text-base",
                )}>
                  {item.label}
                </span>
                {item.description && (
                  <span className={cn(
                    "font-normal leading-none text-black-3 tracking-[-0.03em] line-clamp-1",
                    section.compact ? "text-[12px]" : "text-[14px]",
                  )}>
                    {item.description}
                  </span>
                )}
              </div>
              {item.external && (
                <SquareArrowOutUpRight
                  className={cn(
                    "size-[16px] text-black-3 shrink-0 ml-auto",
                    section.compact && "opacity-0 transition-opacity duration-150 group-hover/item:opacity-100",
                  )}
                  strokeWidth={1.5}
                />
              )}
            </Link>
          );
        })}
      </div>

      {/* Footer link */}
      {section.footerLink && (
        <Link
          href={section.footerLink.href}
          onClick={onClose}
          className="flex items-center justify-between px-6 py-5 mt-3 bg-white-1-5 border border-white-2-5 rounded-lg transition-colors hover:bg-white-2"
        >
          <span className="text-base font-medium leading-[1.2] text-black-2 tracking-[-0.03em]">
            {section.footerLink.label}
          </span>
          <div className="border border-black-3 rounded-full p-2">
            <ArrowUpRight className="size-3 text-black-3" strokeWidth={2} />
          </div>
        </Link>
      )}
    </div>
  );
}

export default function DropdownMenu({ dropdown, onClose }: DropdownMenuProps) {
  return (
    <div className="bg-white-1 border border-white-2 rounded-xl shadow-[0px_12px_20px_0px_rgba(0,0,0,0.03)] py-6 px-5 w-max animate-dropdown-in flex flex-col gap-5">
      <div className="flex gap-5 items-stretch">
          {dropdown.sections.map((section, i) => (
            <Fragment key={section.title}>
              {i > 0 && (
                <div className="w-0.5 self-stretch bg-white-2 rounded-full shrink-0" />
              )}
              <SectionColumn section={section} onClose={onClose} />
            </Fragment>
          ))}

          {/* Featured card */}
          {dropdown.featuredCard && (
            <>
              <div className="w-0.5 self-stretch bg-white-2 rounded-full shrink-0" />
              <Link
                href={dropdown.featuredCard.href}
                onClick={onClose}
                className="relative flex flex-col items-start justify-end w-[260px] shrink-0 px-6 py-7 rounded-xl overflow-hidden group"
              >
                <Image
                  src={dropdown.featuredCard.image}
                  alt={dropdown.featuredCard.imageAlt}
                  fill
                  className="object-cover transition-transform duration-300 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-b from-transparent from-[44%] to-black-1/70 to-[69%]" />
                <div className="relative flex flex-col gap-2 min-w-[200px]">
                  <div className="flex items-end gap-1.5">
                    <p className="text-2xl font-medium text-white-1 tracking-[-0.03em] leading-[1.2] whitespace-pre-line">
                      {dropdown.featuredCard.title}
                    </p>
                    <ArrowUpRight
                      className="size-7 text-white-1"
                      strokeWidth={1.5}
                    />
                  </div>
                  <p className="text-base font-normal text-white-2 tracking-[-0.02em] leading-[1.4]">
                    {dropdown.featuredCard.description}
                  </p>
                </div>
              </Link>
            </>
          )}
        </div>

      {/* Overview link at bottom of dropdown */}
      {dropdown.overviewLink && (
        <Link
          href={dropdown.overviewLink.href}
          onClick={onClose}
          className="flex items-center justify-between px-4 py-3.5 bg-white-1-5 border border-white-2-5 rounded-xl transition-colors hover:bg-white-2 group/overview"
        >
          <div className="flex flex-col gap-1.5">
            <span className="text-base font-medium leading-[1.2] text-black-1 tracking-[-0.03em]">
              {dropdown.overviewLink.label}
            </span>
            <span className="text-base font-normal leading-none text-black-3 tracking-[-0.03em]">
              {dropdown.overviewLink.description}
            </span>
          </div>
          <div className="border border-black-3 rounded-full p-2 transition-colors group-hover/overview:border-black-1">
            <ArrowUpRight className="size-3 text-black-3 group-hover/overview:text-black-1" strokeWidth={2} />
          </div>
        </Link>
      )}
      </div>
  );
}
