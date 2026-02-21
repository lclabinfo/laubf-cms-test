"use client";

import {
  useState,
  useRef,
  useEffect,
  useCallback,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";

interface PopoverProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  trigger: ReactNode;
  children: ReactNode;
  /** Horizontal alignment of the popover relative to the trigger */
  align?: "start" | "center" | "end";
}

export function Popover({
  open,
  onOpenChange,
  trigger,
  children,
  align = "start",
}: PopoverProps) {
  const triggerRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0 });

  useEffect(() => {
    setMounted(true);
  }, []);

  const updatePosition = useCallback(() => {
    if (!triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    const contentEl = contentRef.current;
    const contentWidth = contentEl?.offsetWidth ?? 0;
    const contentHeight = contentEl?.offsetHeight ?? 0;

    let left: number;
    if (align === "end") {
      left = rect.right - contentWidth;
    } else if (align === "center") {
      left = rect.left + rect.width / 2 - contentWidth / 2;
    } else {
      left = rect.left;
    }

    // Clamp horizontally to viewport
    left = Math.max(8, Math.min(left, window.innerWidth - contentWidth - 8));

    // Open above trigger if not enough room below
    const spaceBelow = window.innerHeight - rect.bottom;
    const top =
      spaceBelow < contentHeight + 8 && rect.top > contentHeight + 8
        ? rect.top - contentHeight - 4
        : rect.bottom + 4;

    setPosition({ top, left });
  }, [align]);

  useEffect(() => {
    if (!open) return;
    updatePosition();
    // Re-measure on scroll (captures scrollable containers like bottom sheets)
    const handleUpdate = () => updatePosition();
    window.addEventListener("scroll", handleUpdate, { passive: true, capture: true });
    window.addEventListener("resize", handleUpdate, { passive: true });
    return () => {
      window.removeEventListener("scroll", handleUpdate, true);
      window.removeEventListener("resize", handleUpdate);
    };
  }, [open, updatePosition]);

  // Click outside
  useEffect(() => {
    if (!open) return;
    function handleMouseDown(e: MouseEvent) {
      if (
        triggerRef.current?.contains(e.target as Node) ||
        contentRef.current?.contains(e.target as Node)
      ) {
        return;
      }
      onOpenChange(false);
    }
    document.addEventListener("mousedown", handleMouseDown);
    return () => document.removeEventListener("mousedown", handleMouseDown);
  }, [open, onOpenChange]);

  // Escape key
  useEffect(() => {
    if (!open) return;
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onOpenChange(false);
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [open, onOpenChange]);

  return (
    <>
      <div ref={triggerRef} className="inline-flex">
        {trigger}
      </div>
      {mounted &&
        open &&
        createPortal(
          <div
            ref={contentRef}
            className="fixed z-[70] rounded-[12px] border border-white-2 bg-white-0 shadow-[0px_8px_24px_rgba(0,0,0,0.1)] animate-dropdown-in"
            style={{ top: position.top, left: position.left }}
          >
            {children}
          </div>,
          document.body,
        )}
    </>
  );
}
