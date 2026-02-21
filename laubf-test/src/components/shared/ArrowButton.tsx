/*
 * CMS: Non-editable UI primitive — arrow navigation button
 */
import type { ArrowButtonProps } from "@/lib/types/shared";
import { cn } from "@/lib/utils";

const rotations = {
  right: "rotate-0",
  left: "rotate-180",
  up: "-rotate-90",
  down: "rotate-90",
};

export default function ArrowButton({
  size = 56,
  direction = "right",
  className,
  onClick,
}: ArrowButtonProps) {
  const sizeClass =
    size === 56 ? "size-14" : size === 48 ? "size-12" : "size-5";
  const iconSize = size === 56 ? 22 : size === 48 ? 20 : 16;

  return (
    <button
      onClick={onClick}
      className={cn(
        "inline-flex items-center justify-center rounded-full border border-white-1 bg-transparent text-white-1 transition-all duration-300 hover:bg-white-1/10 group-hover:scale-110",
        sizeClass,
        className
      )}
    >
      <svg
        width={iconSize}
        height={iconSize}
        viewBox="0 0 24 24"
        fill="none"
        className={cn("transition-transform", rotations[direction])}
      >
        <path
          d="M7 17L17 7M17 7H7M17 7V17"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </button>
  );
}
