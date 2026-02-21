"use client";

import { DayPicker, type DayPickerProps } from "react-day-picker";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

/* Inline SVG chevron-down for the select dropdown indicator */
const CHEVRON_DOWN_SVG = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%23676767' stroke-width='2.5' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E")`;

export function Calendar({
  className,
  classNames,
  ...props
}: DayPickerProps) {
  return (
    <DayPicker
      captionLayout="dropdown"
      startMonth={new Date(2000, 0)}
      endMonth={new Date(2035, 11)}
      className={cn("p-3", className)}
      classNames={{
        months: "relative flex flex-col",
        month: "space-y-4",
        month_caption: "flex justify-center items-center h-7",
        caption_label: "sr-only",
        dropdowns: "flex items-center gap-2",
        dropdown_root: "relative inline-flex items-center",
        dropdown: cn(
          "appearance-none bg-white-0 border border-white-2-5 rounded-[8px]",
          "px-2.5 py-1 pr-6 text-[13px] font-medium text-black-1 cursor-pointer",
          "hover:border-white-3 transition-colors outline-none",
          "focus-visible:ring-2 focus-visible:ring-brand-1",
          "bg-no-repeat bg-[right_6px_center] bg-[length:12px]",
        ),
        nav: "absolute top-0 left-0 right-0 flex justify-between items-center h-7 z-10 pointer-events-none",
        button_previous: cn(
          "inline-flex items-center justify-center size-7 rounded-[8px] pointer-events-auto",
          "text-black-3 hover:bg-white-1-5 hover:text-black-1 transition-colors",
        ),
        button_next: cn(
          "inline-flex items-center justify-center size-7 rounded-[8px] pointer-events-auto",
          "text-black-3 hover:bg-white-1-5 hover:text-black-1 transition-colors",
        ),
        weekdays: "flex",
        weekday: "w-9 text-[12px] font-medium text-black-3 text-center",
        week: "flex w-full mt-1",
        day: "relative p-0 text-center text-[14px] focus-within:z-20",
        day_button: cn(
          "inline-flex items-center justify-center size-9 rounded-[8px] cursor-pointer",
          "text-black-1 transition-colors",
          "hover:bg-white-1-5",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-1",
        ),
        today: "font-semibold",
        selected:
          "[&>button]:bg-brand-1 [&>button]:text-white-0 [&>button]:hover:bg-brand-1",
        outside: "text-black-3/40",
        disabled: "text-black-3/30 pointer-events-none",
        hidden: "invisible",
        ...classNames,
      }}
      styles={{
        dropdown: { backgroundImage: CHEVRON_DOWN_SVG },
      }}
      components={{
        Chevron: ({ orientation }) =>
          orientation === "left" ? (
            <ChevronLeft className="size-4" />
          ) : (
            <ChevronRight className="size-4" />
          ),
      }}
      {...props}
    />
  );
}
