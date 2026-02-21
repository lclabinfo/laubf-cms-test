/*
 * FilterToolbar — Responsive filter/search toolbar
 *
 * Desktop (lg+): Row 1 (tabs + controls) | Row 2 (collapsible filter panel)
 * Mobile (<lg):  Sticky tabs | Search + "Sort & Filter" button + View toggle (document flow)
 *                Sort & Filter opens a bottom sheet
 */
"use client";

import { useState, useRef, useEffect, useCallback, useLayoutEffect } from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/utils";
import { X, ChevronLeft, ChevronRight } from "lucide-react";
import {
  IconSearch,
  IconChevronDown,
  IconFilter,
  IconArrowDown,
  IconArrowUp,
  IconX,
  IconCheck,
} from "@/components/layout/icons";
import { DatePicker } from "@/components/ui/date-picker";

/* ── Types ── */

export interface ViewModeOption {
  value: string;
  label: string;
  icon: React.ReactNode;
}

export interface FilterDropdownConfig {
  id: string;
  label: string;
  value: string;
  options: { value: string; label: string }[];
  onChange: (value: string) => void;
  /** Whether to show a search input inside the dropdown. Defaults to true. */
  searchable?: boolean;
}

export interface DateRangeConfig {
  fromLabel?: string;
  toLabel?: string;
  fromValue: string;
  toValue: string;
  onFromChange: (value: string) => void;
  onToChange: (value: string) => void;
}

export interface SortOption {
  value: string;
  label: string;
  direction: "asc" | "desc";
}

export interface TabConfig {
  key: string;
  label: string;
  /** Shorter label shown on mobile (e.g. "All" instead of "Browse All") */
  mobileLabel?: string;
}

export interface FilterToolbarProps {
  /** Flat underline-style tab navigation rendered on the left side of the bar */
  tabs?: {
    options: TabConfig[];
    active: string;
    onChange: (key: string) => void;
  };
  viewModes?: {
    options: ViewModeOption[];
    active: string;
    onChange: (value: string) => void;
  };
  search?: {
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
  };
  filters?: FilterDropdownConfig[];
  dateRange?: DateRangeConfig;
  sort?: {
    options: SortOption[];
    active: string;
    direction: "asc" | "desc";
    onChange: (value: string, dir: "asc" | "desc") => void;
  };
  onReset?: () => void;
  className?: string;
  sticky?: boolean;
  stickyTop?: string;
  /** @deprecated No longer used in new design — filter panel is always toggle-based */
  disclosure?: boolean;
}

/* ── Hooks ── */

function useIsMobile(breakpoint = 1024) {
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia(`(max-width: ${breakpoint - 1}px)`);
    setIsMobile(mq.matches);
    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, [breakpoint]);
  return isMobile;
}

/* ── Component ── */

export default function FilterToolbar({
  tabs,
  viewModes,
  search,
  filters,
  dateRange,
  sort,
  onReset,
  className,
  sticky = true,
  stickyTop = "64px",
}: FilterToolbarProps) {
  const toolbarRef = useRef<HTMLDivElement>(null);
  const mobileTabsRef = useRef<HTMLDivElement>(null);
  const scrollAnchorRef = useRef<HTMLDivElement>(null);
  const isMobile = useIsMobile();

  // Desktop state
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [searchFocused, setSearchFocused] = useState(false);
  const [filterAnimDone, setFilterAnimDone] = useState(false);

  // Mobile state
  const [mounted, setMounted] = useState(false);
  const [mobileSheetOpen, setMobileSheetOpen] = useState(false);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [mobileStickyTop, setMobileStickyTop] = useState(stickyTop);

  // Hydration safety for portals
  useEffect(() => { setMounted(true); }, []);

  // Dynamically measure navbar height for mobile sticky offset
  useEffect(() => {
    if (!sticky) return;
    const measure = () => {
      const header = document.querySelector("header");
      if (header) {
        setMobileStickyTop(`${header.getBoundingClientRect().height}px`);
      }
    };
    measure();
    window.addEventListener("resize", measure, { passive: true });
    return () => window.removeEventListener("resize", measure);
  }, [sticky]);

  // Desktop filter panel animation
  useEffect(() => {
    if (filtersOpen) {
      const timer = setTimeout(() => setFilterAnimDone(true), 310);
      return () => clearTimeout(timer);
    } else {
      setFilterAnimDone(false);
    }
  }, [filtersOpen]);

  // Body scroll lock when bottom sheet is open (preserve navbar sticky)
  useEffect(() => {
    if (mobileSheetOpen) {
      const scrollY = window.scrollY;
      document.body.style.position = "fixed";
      document.body.style.top = `-${scrollY}px`;
      document.body.style.left = "0";
      document.body.style.right = "0";
      document.body.style.overflow = "hidden";
    } else {
      const scrollY = document.body.style.top;
      document.body.style.position = "";
      document.body.style.top = "";
      document.body.style.left = "";
      document.body.style.right = "";
      document.body.style.overflow = "";
      if (scrollY) {
        window.scrollTo(0, parseInt(scrollY || "0", 10) * -1);
      }
    }
    return () => {
      const scrollY = document.body.style.top;
      document.body.style.position = "";
      document.body.style.top = "";
      document.body.style.left = "";
      document.body.style.right = "";
      document.body.style.overflow = "";
      if (scrollY) {
        window.scrollTo(0, parseInt(scrollY || "0", 10) * -1);
      }
    };
  }, [mobileSheetOpen]);

  // Escape key to close bottom sheet
  useEffect(() => {
    if (!mobileSheetOpen) return;
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setMobileSheetOpen(false);
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [mobileSheetOpen]);

  // Scroll-to-top FAB visibility
  useEffect(() => {
    function handleScroll() {
      setShowScrollTop(window.scrollY > 600);
    }
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Auto-switch away from calendar view on mobile
  const viewModesRef = useRef(viewModes);
  viewModesRef.current = viewModes;
  useEffect(() => {
    if (isMobile && viewModesRef.current?.active === "calendar") {
      viewModesRef.current.onChange("card");
    }
  }, [isMobile]);

  const hasFiltersRow = (filters && filters.length > 0) || dateRange;
  const hasMobileControls = !!search || !!sort || hasFiltersRow || !!viewModes;

  // Count active filters for the badge
  const activeFilterCount = (() => {
    let count = 0;
    if (filters) {
      for (const f of filters) {
        if (f.value && f.value !== "all") count++;
      }
    }
    if (dateRange) {
      if (dateRange.fromValue) count++;
      if (dateRange.toValue) count++;
    }
    return count;
  })();

  const hasActiveFilters =
    activeFilterCount > 0 || (search && search.value.length > 0);

  const fullWidthBgStyle = { left: "50%", marginLeft: "-50vw", width: "100vw" } as const;

  return (
    <>
    {/* Invisible anchor for scroll position calculation */}
    <div ref={scrollAnchorRef} className="h-0 w-0" />

    {/* ══════════════════════════════════════════════════════════════════════
        DESKTOP LAYOUT (lg+ / ≥1024px)
        ─────────────────────────────────────────────────────────────────────
        RESPONSIVE RULES (designed for 1024px–1440px+ without breakpoint changes):
        ─────────────────────────────────────────────────────────────────────
        1. TABS (left side):
           - `shrink-0 whitespace-nowrap` — tab labels never wrap to a second line.
           - Each tab has compact horizontal padding (`px-3`) so many tabs fit.
           - `min-w-0 overflow-hidden` on the tab container lets tabs shrink if
             the right-side controls need space, preventing toolbar overflow.
        2. SORT BUTTON:
           - Label is capped at `max-w-[6ch]` (~6 characters) with `truncate`
             so "Date (Newest)" renders as "Date (…". This keeps a fixed
             compact width regardless of how long the sort label is.
           - `whitespace-nowrap` prevents any two-line wrapping.
        3. SEARCH BAR:
           - Collapsed: `w-[180px]` (down from 240px for tighter viewports).
           - Focused/active: `w-[260px]` (down from 320px).
           - The search container uses `shrink` so it can compress further if
             the toolbar is packed with tabs + filters + sort + view toggle.
        4. VIEW MODE TOGGLE:
           - Capped at max 3 options via `.slice(0, 3)` — guarantees the
             toggle never grows beyond card / list / calendar.
           - Each button is icon-only with tight `px-2.5 py-2` padding.
        5. RIGHT-SIDE CONTROLS:
           - `shrink-0` on filter icon, sort dropdown, and view toggle so they
             never compress — only the search bar and tab area flex.
           - `gap-2` between controls (compact) with `gap-3` to the view toggle.
        6. OVERALL:
           - The toolbar row is `flex justify-between gap-3 h-[59px]`.
           - Left side (tabs) can shrink via `min-w-0`.
           - Right side controls are `shrink-0` except search which flexes.
           - This means at 1024px with 4 tabs + filter + sort + search + 3-way
             view toggle, everything fits without overflow or wrapping.
       ══════════════════════════════════════════════════════════════════════ */}
    <div
      ref={toolbarRef}
      className={cn(
        "relative z-30 hidden lg:block",
        sticky && "sticky",
        className,
      )}
      style={sticky ? { top: stickyTop } : undefined}
    >
      {/* Row 1: Main bar */}
      <div className="relative">
        <div
          className="absolute top-0 bottom-0 bg-white-1 border-b border-white-2-5 shadow-[0px_4px_12px_rgba(0,0,0,0.04)]"
          style={fullWidthBgStyle}
        />
        {/* Rule 6: justify-between + gap-3 distributes space between tabs and controls */}
        <div className="relative flex justify-between gap-3 h-[59px]">
          {/* Rule 1: Tabs container — min-w-0 allows shrinking when controls need space */}
          {tabs ? (
            <TabBar tabs={tabs} toolbarRef={toolbarRef} scrollAnchorRef={scrollAnchorRef} />
          ) : (
            <div />
          )}

          {/* Right-side controls cluster */}
          <div className="flex items-center gap-3 py-2.5 shrink-0">
            <div className="flex items-center gap-2">
              {/* Rule 5: Filter icon — fixed size, never compresses */}
              {hasFiltersRow && (
                <FilterIconButton
                  active={filtersOpen}
                  count={activeFilterCount}
                  onClick={() => setFiltersOpen((prev) => !prev)}
                />
              )}
              {/* Rule 2: Sort dropdown — label truncated at ~6 chars */}
              {sort && <SortDropdown sort={sort} />}
              {/* Rule 3: Search bar — w-[180px] collapsed, w-[260px] focused */}
              {search && (
                <div
                  className={cn(
                    "relative transition-all duration-300 ease-out shrink",
                    searchFocused || search.value ? "w-[260px]" : "w-[180px]",
                  )}
                >
                  <IconSearch className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-black-3" />
                  <input
                    type="text"
                    placeholder={search.placeholder ?? "Search..."}
                    value={search.value}
                    onChange={(e) => search.onChange(e.target.value)}
                    onFocus={() => setSearchFocused(true)}
                    onBlur={() => setSearchFocused(false)}
                    className={cn(
                      "w-full rounded-[14px] bg-white-0 py-2.5 pl-[44px] text-[14px] text-black-1 placeholder:text-black-3 outline-none ring-0 focus:ring-0 focus:outline-none transition-colors border border-white-2-5 focus:border-white-3",
                      search.value ? "pr-9" : "pr-3",
                      searchFocused ? "border-black-3/40" : "border-transparent",
                    )}
                  />
                  {search.value && (
                    <button
                      onClick={() => search.onChange("")}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-black-3 hover:text-black-1 transition-colors"
                    >
                      <X className="size-4" />
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Rule 4: View mode toggle — max 3 options, separated by a thin divider */}
            {viewModes && (
              <div className="w-[2px] h-[29px] bg-white-2-5 rounded-full shrink-0" />
            )}

            {viewModes && (
              <div className="flex rounded-[14px] bg-white-2 p-1 shrink-0">
                {/* Rule 4: .slice(0, 3) caps the toggle at 3 view modes max */}
                {viewModes.options.slice(0, 3).map((mode) => (
                  <button
                    key={mode.value}
                    onClick={() => viewModes.onChange(mode.value)}
                    title={mode.label}
                    className={cn(
                      "flex items-center justify-center rounded-[10px] px-2.5 py-2 transition-colors",
                      viewModes.active === mode.value
                        ? "bg-white-1 text-black-1 shadow-[0px_1px_3px_rgba(0,0,0,0.1),0px_1px_2px_rgba(0,0,0,0.1)]"
                        : "text-black-3 hover:text-black-2",
                    )}
                  >
                    {mode.icon}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Row 2: Filter panel (collapsible) */}
      {hasFiltersRow && (
        <div
          className="grid transition-[grid-template-rows] duration-300 ease-out"
          style={{ gridTemplateRows: filtersOpen ? "1fr" : "0fr" }}
        >
          <div className={filterAnimDone ? "overflow-visible" : "overflow-hidden"}>
            <div className="relative">
              <div
                className={cn(
                  "absolute inset-y-0 bg-white-1 transition-opacity duration-300",
                  filtersOpen ? "opacity-100 border-b border-white-2-5" : "opacity-0",
                )}
                style={fullWidthBgStyle}
              />
              <div className="relative flex flex-wrap items-center gap-3 py-4 px-2">
                {filters?.map((filter) => (
                  <FilterDropdownButton key={filter.id} config={filter} />
                ))}
                {dateRange && (
                  <>
                    <DatePicker
                      label={dateRange.fromLabel ?? "Date from"}
                      value={dateRange.fromValue}
                      onChange={dateRange.onFromChange}
                    />
                    <DatePicker
                      label={dateRange.toLabel ?? "Date to"}
                      value={dateRange.toValue}
                      onChange={dateRange.onToChange}
                    />
                  </>
                )}
                {onReset && hasActiveFilters && (
                  <button
                    onClick={() => onReset()}
                    className="ml-auto flex items-center gap-2 rounded-[12px] border border-white-3 h-[40px] px-3.5 text-[14px] font-medium text-black-3 transition-colors hover:text-black-1 hover:border-black-3/40"
                  >
                    <IconX className="size-4" />
                    <span>Clear all ({activeFilterCount})</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>

    {/* ══════════════════════════════════════════════════
        MOBILE LAYOUT (<lg) — tabs sticky, controls in flow
       ══════════════════════════════════════════════════ */}

    {/* Mobile sticky tabs */}
    <div
      ref={mobileTabsRef}
      className={cn("lg:hidden relative z-30", sticky && "sticky")}
      style={sticky ? { top: mobileStickyTop } : undefined}
    >
      <div className="relative">
        <div
          className="absolute top-0 bottom-0 bg-white-1 border-b border-white-2-5"
          style={fullWidthBgStyle}
        />
        {tabs && (
          <MobileTabBar
            tabs={tabs}
            stickyRef={mobileTabsRef}
            scrollAnchorRef={scrollAnchorRef}
          />
        )}
      </div>
    </div>

    {/* Mobile controls — NOT sticky, follows document flow */}
    {hasMobileControls && (
      <div className="lg:hidden relative">
        <div
          className="absolute top-0 bottom-0 bg-white-1 border-b border-white-2-5"
          style={fullWidthBgStyle}
        />
        <div className="relative flex flex-col gap-3 px-1 py-3">
          {/* Full-width search input */}
          {search && (
            <div className="relative">
              <IconSearch className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-black-3" />
              <input
                type="text"
                placeholder={search.placeholder ?? "Search..."}
                value={search.value}
                onChange={(e) => search.onChange(e.target.value)}
                className={cn(
                  "w-full rounded-[14px] bg-white-0 py-3 pl-[44px] text-[14px] text-black-1 placeholder:text-black-3 outline-none ring-0 focus:ring-0 focus:outline-none transition-colors border border-white-2-5 focus:border-white-3",
                  search.value ? "pr-9" : "pr-3",
                )}
              />
              {search.value && (
                <button
                  onClick={() => search.onChange("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-black-3 hover:text-black-1 transition-colors"
                >
                  <X className="size-4" />
                </button>
              )}
            </div>
          )}

          {/* Sort & Filter button + View toggle */}
          <div className="flex items-center justify-between gap-3">
            {(hasFiltersRow || sort) && (
              <button
                onClick={() => setMobileSheetOpen(true)}
                className={cn(
                  "flex items-center gap-2 rounded-[12px] border bg-white-0 h-[40px] px-3.5 text-[14px] font-medium transition-colors",
                  activeFilterCount > 0
                    ? "border-white-3 text-black-1"
                    : "border-white-2-5 text-black-2 hover:border-white-3",
                )}
              >
                <span>Sort & Filter</span>
                {activeFilterCount > 0 && (
                  <span className="flex items-center justify-center min-w-[20px] h-[20px] rounded-full bg-black-1 text-[12px] font-medium text-white-1 px-1">
                    {activeFilterCount}
                  </span>
                )}
                <IconChevronDown className="size-3.5" />
              </button>
            )}

            {/* View toggle — calendar hidden on mobile */}
            {viewModes && (
              <div className="flex rounded-[14px] bg-white-2 p-1">
                {viewModes.options
                  .filter((mode) => mode.value !== "calendar")
                  .map((mode) => (
                    <button
                      key={mode.value}
                      onClick={() => viewModes.onChange(mode.value)}
                      title={mode.label}
                      className={cn(
                        "flex items-center justify-center rounded-[10px] px-2.5 py-2 transition-colors",
                        viewModes.active === mode.value
                          ? "bg-white-1 text-black-1 shadow-[0px_1px_3px_rgba(0,0,0,0.1),0px_1px_2px_rgba(0,0,0,0.1)]"
                          : "text-black-3 hover:text-black-2",
                      )}
                    >
                      {mode.icon}
                    </button>
                  ))}
              </div>
            )}
          </div>
        </div>
      </div>
    )}

    {/* Spacer for className margin (e.g., mb-8) — applies after the last toolbar section */}
    {className && <div className={cn("lg:hidden", className)} aria-hidden="true" />}

    {/* ══════════════════════════════════════════════════
        MOBILE BOTTOM SHEET + SCROLL-TO-TOP FAB (portals)
       ══════════════════════════════════════════════════ */}
    {mounted && isMobile && (
      <MobileBottomSheet
        open={mobileSheetOpen}
        onClose={() => setMobileSheetOpen(false)}
        sort={sort}
        filters={filters}
        dateRange={dateRange}
        onReset={onReset}
        activeFilterCount={activeFilterCount}
        hasActiveFilters={!!hasActiveFilters}
      />
    )}

    {mounted && isMobile && <ScrollToTopButton visible={showScrollTop} />}
    </>
  );
}

/* ══════════════════════════════════════════════════════════
   DESKTOP SUB-COMPONENTS
   ══════════════════════════════════════════════════════════ */

/** Tab bar with animated sliding underline (desktop) */
function TabBar({
  tabs,
  toolbarRef,
  scrollAnchorRef,
}: {
  tabs: NonNullable<FilterToolbarProps["tabs"]>;
  toolbarRef: React.RefObject<HTMLDivElement | null>;
  scrollAnchorRef: React.RefObject<HTMLDivElement | null>;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const tabRefs = useRef<Map<string, HTMLButtonElement>>(new Map());
  const [indicator, setIndicator] = useState({ left: 0, width: 0 });

  const updateIndicator = useCallback(() => {
    const activeEl = tabRefs.current.get(tabs.active);
    const container = containerRef.current;
    if (activeEl && container) {
      const containerRect = container.getBoundingClientRect();
      const tabRect = activeEl.getBoundingClientRect();
      setIndicator({
        left: tabRect.left - containerRect.left + (tabRect.width - 56) / 2,
        width: 56,
      });
    }
  }, [tabs.active]);

  useLayoutEffect(() => {
    updateIndicator();
  }, [updateIndicator]);

  useEffect(() => {
    window.addEventListener("resize", updateIndicator);
    return () => window.removeEventListener("resize", updateIndicator);
  }, [updateIndicator]);

  return (
    /* Rule 1: min-w-0 lets the tab container shrink; overflow-hidden clips if needed */
    <div ref={containerRef} className="relative flex h-full min-w-0 overflow-hidden">
      {tabs.options.map((tab) => (
        <button
          key={tab.key}
          ref={(el) => {
            if (el) tabRefs.current.set(tab.key, el);
          }}
          onClick={() => {
            tabs.onChange(tab.key);
            if (scrollAnchorRef.current && toolbarRef.current) {
              const stickyTopPx = parseFloat(toolbarRef.current.style.top || "0");
              const anchorDocTop = scrollAnchorRef.current.getBoundingClientRect().top + window.scrollY;
              const stickyThreshold = anchorDocTop - stickyTopPx;
              if (window.scrollY > stickyThreshold) {
                window.scrollTo({ top: stickyThreshold });
              }
            }
          }}
          className={cn(
            /* Rule 1: shrink-0 + whitespace-nowrap — tab text never wraps or compresses */
            "relative flex items-end shrink-0 whitespace-nowrap px-3 pb-4 text-[16px] font-medium transition-colors",
            tabs.active === tab.key
              ? "text-black-1"
              : "text-black-3 hover:text-black-2",
          )}
        >
          {tab.label}
        </button>
      ))}
      <span
        className="absolute bottom-0 h-[3px] bg-black-1 rounded-full transition-all duration-300 ease-out"
        style={{ left: indicator.left, width: indicator.width }}
      />
    </div>
  );
}

/** Filter icon button — funnel icon with optional badge count */
function FilterIconButton({
  active,
  count,
  onClick,
}: {
  active: boolean;
  count: number;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "relative flex items-center justify-center gap-2 rounded-[12px] border bg-white-0 h-[40px] px-3.5 transition-colors",
        count > 0 || active
          ? "border-white-3"
          : "border-white-2-5 hover:border-white-3",
      )}
    >
      <IconFilter className="size-4 text-black-2" />
      {count > 0 && (
        <span className="flex items-center justify-center min-w-[20px] h-[20px] rounded-full bg-black-1 text-[12px] font-medium text-white-1 px-1">
          {count}
        </span>
      )}
    </button>
  );
}

/**
 * Sort dropdown — arrow icon + truncated label + chevron, custom dropdown.
 *
 * Rule 2: The visible label is capped at `max-w-[6ch]` with `truncate` so it
 * stays compact (e.g. "Date (…") regardless of the full label length.
 * The full label is shown in the dropdown list and as a `title` tooltip.
 */
function SortDropdown({
  sort,
}: {
  sort: NonNullable<FilterToolbarProps["sort"]>;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  const activeOption = sort.options.find(
    (o) => o.value === sort.active && o.direction === sort.direction,
  );
  const buttonLabel = activeOption?.label ?? "Sort";

  return (
    <div ref={ref} className="relative shrink-0">
      <button
        onClick={() => setOpen((prev) => !prev)}
        title={buttonLabel}
        className={cn(
          /* Rule 2: whitespace-nowrap prevents the sort label from ever wrapping */
          "flex items-center gap-1.5 rounded-[12px] border h-[40px] px-3 text-[14px] font-medium whitespace-nowrap transition-colors",
          open
            ? "border-white-3 bg-white-0 text-black-1"
            : "border-white-2-5 bg-white-0 text-black-2 hover:border-white-3",
        )}
      >
        {sort.direction === "asc" ? (
          <IconArrowUp className="size-4 shrink-0" />
        ) : (
          <IconArrowDown className="size-4 shrink-0" />
        )}
        {/* Rule 2: max-w-[6ch] + truncate caps visible text to ~6 chars */}
        <span className="max-w-[6ch] truncate">{buttonLabel}</span>
        <IconChevronDown
          className={cn(
            "size-3.5 shrink-0 transition-transform",
            open && "rotate-180",
          )}
        />
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-1 z-50 min-w-[180px] rounded-[12px] border border-white-2 bg-white-0 py-1 shadow-[0px_8px_24px_rgba(0,0,0,0.1)]">
          {sort.options.map((option) => {
            const isActive =
              sort.active === option.value && sort.direction === option.direction;
            return (
              <button
                key={`${option.value}-${option.direction}`}
                onClick={() => {
                  sort.onChange(option.value, option.direction);
                  setOpen(false);
                }}
                className={cn(
                  "flex items-center w-full px-4 py-2.5 text-[14px] transition-colors hover:bg-white-1-5",
                  isActive ? "text-black-1 font-medium" : "text-black-3",
                )}
              >
                {option.label}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

/** Styled filter dropdown button with optional search — replaces native <select> */
function FilterDropdownButton({ config }: { config: FilterDropdownConfig }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const ref = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const searchable = config.searchable !== false;

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
        setQuery("");
      }
    }
    if (open) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  useEffect(() => {
    if (open && searchable) {
      requestAnimationFrame(() => searchInputRef.current?.focus());
    }
  }, [open, searchable]);

  const activeLabel =
    config.options.find((o) => o.value === config.value)?.label ?? config.label;
  const isActive = config.value && config.value !== "all";

  const filteredOptions = searchable && query
    ? config.options.filter((o) =>
        o.label.toLowerCase().includes(query.toLowerCase()),
      )
    : config.options;

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((prev) => !prev)}
        className={cn(
          "flex items-center gap-2 rounded-[12px] border h-[40px] px-3.5 text-[14px] font-medium transition-colors bg-white-0",
          isActive
            ? "border-white-3 text-black-1"
            : open
              ? "border-white-3 text-black-1"
              : "border-white-2-5 text-black-3 hover:border-white-3",
        )}
      >
        <span>{activeLabel}</span>
        <IconChevronDown
          className={cn(
            "size-3.5 transition-transform",
            open && "rotate-180",
          )}
        />
      </button>

      {open && (
        <div className="absolute left-0 top-full mt-1 z-50 min-w-[220px] max-h-[320px] rounded-[12px] border border-white-2 bg-white-0 shadow-[0px_8px_24px_rgba(0,0,0,0.1)] overflow-hidden">
          {searchable && (
            <div className="p-2 border-b border-white-2/50">
              <div className="relative">
                <IconSearch className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-black-3" />
                <input
                  ref={searchInputRef}
                  type="text"
                  placeholder="Search..."
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  className="w-full rounded-[8px] border border-white-2 bg-white-1-5 py-1.5 pl-8 pr-3 text-[13px] text-black-1 placeholder:text-black-3 outline-none ring-0 focus:ring-0 focus:outline-none transition-colors focus:border-black-3/40"
                />
              </div>
            </div>
          )}
          <div className="max-h-[260px] overflow-y-auto py-1">
            {filteredOptions.length === 0 ? (
              <p className="px-4 py-2.5 text-[13px] text-black-3">No results</p>
            ) : (
              filteredOptions.map((option) => (
                <button
                  key={option.value}
                  onClick={() => {
                    config.onChange(option.value);
                    setOpen(false);
                    setQuery("");
                  }}
                  className={cn(
                    "flex items-center w-full px-4 py-2.5 text-[14px] transition-colors hover:bg-white-1-5 text-left",
                    config.value === option.value
                      ? "text-black-1 font-medium"
                      : "text-black-3",
                  )}
                >
                  {option.label}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}


/* ══════════════════════════════════════════════════════════
   MOBILE SUB-COMPONENTS
   ══════════════════════════════════════════════════════════ */

/** Mobile tab bar — horizontally scrollable with gradient fade + arrow indicators */
function MobileTabBar({
  tabs,
  stickyRef,
  scrollAnchorRef,
}: {
  tabs: NonNullable<FilterToolbarProps["tabs"]>;
  stickyRef: React.RefObject<HTMLDivElement | null>;
  scrollAnchorRef: React.RefObject<HTMLDivElement | null>;
}) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const checkScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 2);
    setCanScrollRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 2);
  }, []);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    checkScroll();
    el.addEventListener("scroll", checkScroll, { passive: true });
    const ro = new ResizeObserver(checkScroll);
    ro.observe(el);
    return () => {
      el.removeEventListener("scroll", checkScroll);
      ro.disconnect();
    };
  }, [checkScroll]);

  const scroll = (dir: "left" | "right") => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollBy({ left: dir === "left" ? -120 : 120, behavior: "smooth" });
  };

  return (
    <div className="relative h-[49px]">
      {/* Scrollable tab track */}
      <div
        ref={scrollRef}
        className="flex h-full overflow-x-auto scrollbar-none"
        style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
      >
        {tabs.options.map((tab) => (
          <button
            key={tab.key}
            onClick={() => {
              tabs.onChange(tab.key);
              if (scrollAnchorRef.current && stickyRef.current) {
                const stickyTopPx = parseFloat(stickyRef.current.style.top || "0");
                const anchorDocTop =
                  scrollAnchorRef.current.getBoundingClientRect().top + window.scrollY;
                const stickyThreshold = anchorDocTop - stickyTopPx;
                if (window.scrollY > stickyThreshold) {
                  window.scrollTo({ top: stickyThreshold });
                }
              }
            }}
            className={cn(
              "shrink-0 px-4 flex items-center justify-center text-[14px] font-medium transition-colors relative whitespace-nowrap",
              tabs.active === tab.key
                ? "text-black-1"
                : "text-black-3 hover:text-black-2",
            )}
          >
            {tab.mobileLabel ?? tab.label}
            {tabs.active === tab.key && (
              <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[56px] h-[3px] bg-black-1 rounded-full" />
            )}
          </button>
        ))}
      </div>

      {/* Left gradient + arrow */}
      <div
        className={cn(
          "absolute left-0 top-0 bottom-0 flex items-center pointer-events-none transition-opacity duration-200",
          canScrollLeft ? "opacity-100" : "opacity-0",
        )}
      >
        <div className="absolute inset-y-0 left-0 w-10 bg-gradient-to-r from-white-1 to-transparent" />
        <button
          onClick={() => scroll("left")}
          className={cn(
            "relative z-10 ml-0.5 flex items-center justify-center size-7 rounded-full bg-white-1/80 text-black-3 backdrop-blur-sm shadow-sm",
            canScrollLeft ? "pointer-events-auto" : "pointer-events-none",
          )}
          tabIndex={canScrollLeft ? 0 : -1}
          aria-label="Scroll tabs left"
        >
          <ChevronLeft className="size-4" />
        </button>
      </div>

      {/* Right gradient + arrow */}
      <div
        className={cn(
          "absolute right-0 top-0 bottom-0 flex items-center pointer-events-none transition-opacity duration-200",
          canScrollRight ? "opacity-100" : "opacity-0",
        )}
      >
        <div className="absolute inset-y-0 right-0 w-10 bg-gradient-to-l from-white-1 to-transparent" />
        <button
          onClick={() => scroll("right")}
          className={cn(
            "relative z-10 mr-0.5 flex items-center justify-center size-7 rounded-full bg-white-1/80 text-black-3 backdrop-blur-sm shadow-sm",
            canScrollRight ? "pointer-events-auto" : "pointer-events-none",
          )}
          tabIndex={canScrollRight ? 0 : -1}
          aria-label="Scroll tabs right"
        >
          <ChevronRight className="size-4" />
        </button>
      </div>
    </div>
  );
}

/** Native select wrapper for mobile filters */
function MobileFilterSelect({ config }: { config: FilterDropdownConfig }) {
  const isActive = config.value && config.value !== "all";

  return (
    <div>
      <label className="text-[13px] text-black-2 mb-1.5 block">{config.label}</label>
      <div className="relative">
        <select
          value={config.value}
          onChange={(e) => config.onChange(e.target.value)}
          className={cn(
            "w-full appearance-none rounded-[10px] border bg-white-0 px-4 py-3 pr-10 text-[14px] transition-colors outline-none",
            isActive
              ? "border-white-3 text-black-1 font-medium"
              : "border-white-2-5 text-black-3",
          )}
        >
          {config.options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <IconChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 size-4 text-black-3 pointer-events-none" />
      </div>
    </div>
  );
}

/** Mobile bottom sheet — sort + filter + date range */
function MobileBottomSheet({
  open,
  onClose,
  sort,
  filters,
  dateRange,
  onReset,
  activeFilterCount,
  hasActiveFilters,
}: {
  open: boolean;
  onClose: () => void;
  sort?: FilterToolbarProps["sort"];
  filters?: FilterDropdownConfig[];
  dateRange?: DateRangeConfig;
  onReset?: () => void;
  activeFilterCount: number;
  hasActiveFilters: boolean;
}) {
  const sheet = (
    <div
      className={cn(
        "fixed inset-0 z-[60] transition-opacity duration-300",
        open ? "pointer-events-auto" : "pointer-events-none",
      )}
    >
      {/* Backdrop */}
      <div
        className={cn(
          "absolute inset-0 bg-black-1/40 transition-opacity duration-300",
          open ? "opacity-100" : "opacity-0",
        )}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Sheet */}
      <div
        className={cn(
          "absolute inset-x-0 bottom-0 bg-white-0 rounded-t-[20px] max-h-[85vh] flex flex-col transition-transform duration-300",
          open ? "translate-y-0" : "translate-y-full",
        )}
        style={{ transitionTimingFunction: "cubic-bezier(0.16, 1, 0.3, 1)" }}
      >
        {/* Drag handle */}
        <div className="flex justify-center pt-3 pb-2 shrink-0">
          <div className="w-[36px] h-[4px] rounded-full bg-white-2-5" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-5 pb-4 border-b border-white-2-5 shrink-0">
          <h3 className="text-[18px] font-medium text-black-1 tracking-[-0.36px]">
            Sort & Filter
          </h3>
          <button
            onClick={onClose}
            className="p-1 text-black-3 hover:text-black-1 transition-colors"
          >
            <IconX className="size-5" />
          </button>
        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto px-5 py-5">
          {/* Sort section */}
          {sort && (
            <div className="mb-6">
              <p className="text-[12px] font-semibold text-black-3 uppercase tracking-[0.5px] mb-3">
                Sort by
              </p>
              <div className="flex flex-col gap-0.5">
                {sort.options.map((option) => {
                  const isActive =
                    sort.active === option.value &&
                    sort.direction === option.direction;
                  return (
                    <button
                      key={`${option.value}-${option.direction}`}
                      onClick={() => sort.onChange(option.value, option.direction)}
                      className={cn(
                        "flex items-center justify-between w-full px-3 py-3 rounded-[10px] text-[15px] transition-colors",
                        isActive
                          ? "bg-white-1-5 text-black-1 font-medium"
                          : "text-black-3 hover:bg-white-1-5",
                      )}
                    >
                      <span>{option.label}</span>
                      {isActive && <IconCheck className="size-4 text-black-1" />}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Filter section */}
          {filters && filters.length > 0 && (
            <div className="mb-6">
              <p className="text-[12px] font-semibold text-black-3 uppercase tracking-[0.5px] mb-3">
                Filter by
              </p>
              <div className="flex flex-col gap-3">
                {filters.map((filter) => (
                  <MobileFilterSelect key={filter.id} config={filter} />
                ))}
              </div>
            </div>
          )}

          {/* Date range section */}
          {dateRange && (
            <div className="mb-6">
              <p className="text-[12px] font-semibold text-black-3 uppercase tracking-[0.5px] mb-3">
                Date range
              </p>
              <div className="flex gap-3">
                <div className="flex-1">
                  <label className="text-[12px] text-black-3 mb-1.5 block">
                    {dateRange.fromLabel ?? "From"}
                  </label>
                  <DatePicker
                    label={dateRange.fromLabel ?? "From"}
                    value={dateRange.fromValue}
                    onChange={dateRange.onFromChange}
                    className="w-full justify-between"
                  />
                </div>
                <div className="flex-1">
                  <label className="text-[12px] text-black-3 mb-1.5 block">
                    {dateRange.toLabel ?? "To"}
                  </label>
                  <DatePicker
                    label={dateRange.toLabel ?? "To"}
                    value={dateRange.toValue}
                    onChange={dateRange.onToChange}
                    className="w-full justify-between"
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-white-2-5 px-5 py-4 flex items-center gap-3 shrink-0">
          {onReset && hasActiveFilters && (
            <button
              onClick={() => {
                onReset();
              }}
              className="flex-1 flex items-center justify-center gap-2 rounded-[12px] border border-white-3 h-[44px] text-[14px] font-medium text-black-3 transition-colors hover:text-black-1"
            >
              Clear all
            </button>
          )}
          <button
            onClick={onClose}
            className={cn(
              "flex items-center justify-center rounded-[12px] bg-black-1 text-white-0 h-[44px] text-[14px] font-medium transition-colors hover:bg-black-2",
              onReset && hasActiveFilters ? "flex-1" : "w-full",
            )}
          >
            {activeFilterCount > 0 ? `Show results` : "Done"}
          </button>
        </div>
      </div>
    </div>
  );

  return createPortal(sheet, document.body);
}

/** Scroll-to-top floating action button (mobile only) */
function ScrollToTopButton({ visible }: { visible: boolean }) {
  const btn = (
    <button
      onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
      className={cn(
        "lg:hidden fixed bottom-6 right-4 z-50 flex items-center justify-center size-[48px] rounded-full bg-black-1 text-white-0 shadow-[0px_4px_12px_rgba(0,0,0,0.15)] transition-all duration-300",
        visible
          ? "opacity-100 translate-y-0"
          : "opacity-0 translate-y-4 pointer-events-none",
      )}
      style={{ transitionTimingFunction: "cubic-bezier(0.16, 1, 0.3, 1)" }}
      aria-label="Scroll to top"
    >
      <IconArrowUp className="size-5" />
    </button>
  );

  return createPortal(btn, document.body);
}
