"use client";

import { useState, useCallback } from "react";
import { format, parse } from "date-fns";
import { Calendar } from "@/components/ui/calendar";
import { Popover } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { IconCalendar, IconChevronDown } from "@/components/layout/icons";

interface DatePickerProps {
  value: string;
  onChange: (value: string) => void;
  label: string;
  className?: string;
}

export function DatePicker({ value, onChange, label, className }: DatePickerProps) {
  const [open, setOpen] = useState(false);

  const selected = value
    ? parse(value, "yyyy-MM-dd", new Date())
    : undefined;

  const displayLabel = value
    ? new Date(value + "T00:00:00").toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    : label;

  const handleSelect = useCallback(
    (day: Date | undefined) => {
      if (day) {
        onChange(format(day, "yyyy-MM-dd"));
      } else {
        onChange("");
      }
      setOpen(false);
    },
    [onChange],
  );

  const isActive = !!value;

  return (
    <Popover
      open={open}
      onOpenChange={setOpen}
      trigger={
        <button
          onClick={() => setOpen((prev) => !prev)}
          className={cn(
            "flex items-center gap-2 rounded-[12px] border h-[40px] px-3.5 text-[14px] font-medium transition-colors bg-white-0",
            isActive
              ? "border-white-3 text-black-1"
              : "border-white-2-5 text-black-3 hover:border-white-3",
            className,
          )}
        >
          <IconCalendar className="size-4" />
          <span>{displayLabel}</span>
          <IconChevronDown
            className={cn(
              "size-3.5 transition-transform",
              open && "rotate-180",
            )}
          />
        </button>
      }
    >
      <Calendar
        mode="single"
        selected={selected}
        onSelect={handleSelect}
        defaultMonth={selected}
      />
    </Popover>
  );
}
