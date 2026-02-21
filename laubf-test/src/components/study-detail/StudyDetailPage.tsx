"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import {
  ChevronLeft,
  ChevronDown,
  Video,
  BookOpen,
  FileText,
  Search,
  ExternalLink,
  X,
  Minus,
  Plus,
  Type,
  Paperclip,
  Download,
  File,
  Image as ImageIcon,
  GripVertical,
  Columns,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { BibleStudy } from "@/lib/types/bible-study";

/* ── Types ── */

type ResourceType = "scripture" | "guide" | "leaderGuide" | "transcript";

const TABS_CONFIG = [
  { id: "scripture" as const, label: "Bible", short: "Bible", icon: BookOpen },
  { id: "guide" as const, label: "Questions", short: "Ques", icon: FileText },
  { id: "leaderGuide" as const, label: "Answers", short: "Ans", icon: Search },
  { id: "transcript" as const, label: "Message", short: "Msg", icon: Video },
];

/* ── TabBar ── */

function TabBar({
  active,
  onChange,
  onClose,
}: {
  active: ResourceType | null;
  onChange: (t: ResourceType) => void;
  onClose?: () => void;
}) {
  return (
    <div className="flex items-center justify-between border-b border-white-2 bg-white-1 px-1 sm:px-2 h-12 sticky top-0 z-10 backdrop-blur-sm select-none">
      <div className="flex-1 flex items-center gap-1 h-full w-full overflow-x-auto scrollbar-hide">
        {TABS_CONFIG.map((tab) => (
          <button
            key={tab.id}
            onClick={() => onChange(tab.id)}
            className={cn(
              "h-[calc(100%-4px)] mt-1 px-1 sm:px-4 rounded-t-md font-medium uppercase tracking-wide flex items-center justify-center gap-1.5 transition-all flex-shrink-0",
              "flex-1 sm:flex-none min-w-0 sm:min-w-fit",
              "text-xs min-[480px]:text-sm whitespace-nowrap",
              active === tab.id
                ? "bg-white-0 text-brand-1 shadow-sm border-t border-l border-r border-white-2"
                : "text-black-3 hover:bg-white-1-5 hover:text-black-1"
            )}
          >
            <tab.icon className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
            <span className="truncate min-[440px]:hidden">{tab.short}</span>
            <span className="hidden min-[440px]:inline">{tab.label}</span>
          </button>
        ))}
      </div>
      {onClose && (
        <button
          onClick={onClose}
          className="p-1 hover:bg-white-1-5 rounded text-black-3 hover:text-red-500 transition-colors ml-2 hidden sm:block flex-shrink-0 z-30"
        >
          <X className="w-5 h-5" />
        </button>
      )}
    </div>
  );
}

/* ── Simple Dropdown ── */

function SimpleDropdown({
  trigger,
  children,
  align = "end",
}: {
  trigger: React.ReactNode;
  children: React.ReactNode;
  align?: "start" | "end";
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <div onClick={() => setOpen(!open)}>{trigger}</div>
      {open && (
        <div
          className={cn(
            "absolute top-full mt-1 z-[70] bg-white-0 border border-white-2 rounded-lg shadow-lg py-1 min-w-[200px] animate-dropdown-in",
            align === "end" ? "right-0" : "left-0"
          )}
          onClick={() => setOpen(false)}
        >
          {children}
        </div>
      )}
    </div>
  );
}

/* ── Main Component ── */

export default function StudyDetailPage({ study }: { study: BibleStudy }) {
  const [fontSize, setFontSize] = useState(100);
  const [isDesktop, setIsDesktop] = useState(true);
  const [bibleVersion, setBibleVersion] = useState<"NIV" | "ESV">("ESV");

  // Tab state
  const [leftTab, setLeftTab] = useState<ResourceType>("scripture");
  const [rightTab, setRightTab] = useState<ResourceType | null>("guide");
  const [activePane, setActivePane] = useState<"left" | "right">("right");

  // Split pane state
  const [splitRatio, setSplitRatio] = useState(50);
  const containerRef = useRef<HTMLDivElement>(null);
  const isResizingRef = useRef(false);

  // Mobile scroll handling
  const mobileContainerRef = useRef<HTMLDivElement>(null);
  const isScrollingRef = useRef(false);

  // Header visibility (mobile)
  const [isHeaderVisible, setIsHeaderVisible] = useState(true);
  const lastScrollY = useRef(0);

  /* ── Resize Logic ── */

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizingRef.current || !containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const relativeX = e.clientX - rect.left;
      const newRatio = (relativeX / rect.width) * 100;
      setSplitRatio(Math.min(Math.max(newRatio, 25), 75));
    };

    const handleMouseUp = () => {
      isResizingRef.current = false;
      document.body.style.cursor = "default";
      document.body.style.userSelect = "auto";
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, []);

  const startResizing = (e: React.MouseEvent) => {
    e.preventDefault();
    isResizingRef.current = true;
    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";
  };

  /* ── Desktop detection ── */

  useEffect(() => {
    const check = () => setIsDesktop(window.innerWidth >= 1024);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  /* ── Lock body scroll ── */

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "unset";
    };
  }, []);

  /* ── Helpers ── */

  const getBibleGatewayUrl = (passage: string) => {
    const formatted = passage.replace(/ /g, "+").replace(/~/g, "-");
    return `https://www.biblegateway.com/passage/?search=${formatted}&version=${bibleVersion}&interface=print`;
  };

  const increaseFont = () => setFontSize((p) => Math.min(p + 10, 150));
  const decreaseFont = () => setFontSize((p) => Math.max(p - 10, 80));

  const displayBibleText = study.bibleText
    ? study.bibleText
        .replace(/\(ESV\)/g, `(${bibleVersion})`)
        .replace(/\(NIV\)/g, `(${bibleVersion})`)
    : "";

  /* ── Format date ── */

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr + "T00:00:00");
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  /* ── Mobile scroll handling ── */

  const handleMobileScroll = useCallback(
    (e: React.UIEvent<HTMLDivElement>) => {
      const currentScrollY = e.currentTarget.scrollTop;

      // Header visibility (small screens only)
      if (window.innerWidth < 480) {
        const scrollDiff = currentScrollY - lastScrollY.current;
        if (Math.abs(scrollDiff) > 10) {
          if (scrollDiff > 0 && currentScrollY > 60) {
            setIsHeaderVisible(false);
          } else {
            setIsHeaderVisible(true);
          }
        }
      } else {
        if (!isHeaderVisible) setIsHeaderVisible(true);
      }
      lastScrollY.current = currentScrollY;

      // Scroll spy for tabs
      if (!isDesktop && !isScrollingRef.current) {
        const containerRect = e.currentTarget.getBoundingClientRect();
        for (const tab of TABS_CONFIG) {
          const el = document.getElementById(`mobile-${tab.id}`);
          if (el) {
            const rect = el.getBoundingClientRect();
            if (
              rect.top <= containerRect.top + 150 &&
              rect.bottom > containerRect.top + 150
            ) {
              setLeftTab(tab.id);
              break;
            }
          }
        }
      }
    },
    [isDesktop, isHeaderVisible]
  );

  const scrollToSection = (id: string) => {
    if (mobileContainerRef.current) {
      const el = document.getElementById(`mobile-${id}`);
      if (el) {
        isScrollingRef.current = true;
        const containerTop =
          mobileContainerRef.current.getBoundingClientRect().top;
        const elTop = el.getBoundingClientRect().top;
        const relativeTop =
          elTop - containerTop + mobileContainerRef.current.scrollTop;

        mobileContainerRef.current.scrollTo({
          top: relativeTop,
          behavior: "smooth",
        });

        setTimeout(() => {
          isScrollingRef.current = false;
        }, 500);
      }
    }
  };

  /* ── Content Renderers ── */

  const renderContent = (type: ResourceType | null) => {
    switch (type) {
      case "scripture":
        return (
          <div className="p-6 sm:p-8 max-w-3xl mx-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl sm:text-2xl font-medium text-black-1 uppercase leading-tight tracking-tight">
                {study.passage}
              </h2>
              <div className="flex items-center gap-2">
                <SimpleDropdown
                  trigger={
                    <button className="text-xs font-medium text-black-3 hover:text-black-1 px-2 py-1 hover:bg-white-1-5 rounded transition-colors flex items-center gap-1 border border-white-2">
                      {bibleVersion}{" "}
                      <ChevronDown className="w-3 h-3" />
                    </button>
                  }
                >
                  <button
                    onClick={() => setBibleVersion("NIV")}
                    className="w-full text-left px-3 py-2 text-sm font-medium hover:bg-white-1-5 transition-colors"
                  >
                    NIV
                  </button>
                  <button
                    onClick={() => setBibleVersion("ESV")}
                    className="w-full text-left px-3 py-2 text-sm font-medium hover:bg-white-1-5 transition-colors"
                  >
                    ESV
                  </button>
                </SimpleDropdown>
                <a
                  href={getBibleGatewayUrl(study.passage)}
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs font-medium text-black-3 hover:text-brand-1 px-2 py-1 hover:bg-white-1-5 rounded transition-colors flex items-center gap-2 border border-white-2"
                  title="Read on BibleGateway"
                >
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>
            <div
              style={{ fontSize: `${fontSize}%` }}
              className="study-bible-text transition-all duration-200"
              dangerouslySetInnerHTML={{ __html: displayBibleText }}
            />
            <div className="mt-8 pt-8 border-t border-white-2 text-center">
              <a
                href={getBibleGatewayUrl(study.passage)}
                target="_blank"
                rel="noreferrer"
                className="text-xs font-medium text-white-3 hover:text-brand-1 uppercase tracking-wide transition-colors inline-flex items-center gap-2"
              >
                Read on BibleGateway{" "}
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>
        );

      case "guide":
        return (
          <div className="p-6 sm:p-8 lg:p-12 max-w-3xl mx-auto">
            {/* Header */}
            <div className="mb-8">
              <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                <div className="flex flex-wrap items-center gap-3">
                  <span className="bg-brand-1 text-white-0 px-3 py-1 text-xs font-medium uppercase tracking-wider rounded-lg">
                    Study Guide
                  </span>
                  <span className="text-sm font-medium text-white-3 uppercase tracking-wide">
                    {formatDate(study.dateFor)}
                  </span>
                </div>
                {study.attachments?.find(
                  (a) =>
                    a.type === "docx" &&
                    a.name.toLowerCase().includes("study guide")
                ) && (
                  <a
                    href={
                      study.attachments.find(
                        (a) =>
                          a.type === "docx" &&
                          a.name.toLowerCase().includes("study guide")
                      )?.url
                    }
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-white-2 text-xs font-medium uppercase tracking-wide text-black-3 hover:text-brand-1 hover:bg-white-1-5 transition-all"
                  >
                    <FileText className="w-3.5 h-3.5" />
                    Download DOCX
                  </a>
                )}
              </div>
              <h1 className="text-2xl lg:text-3xl font-medium text-black-1 leading-tight mb-4 tracking-tight">
                {study.title}
              </h1>
              <div className="flex flex-wrap items-center gap-3 text-sm text-black-3">
                <span className="font-medium uppercase tracking-wide text-white-3">
                  {study.series}
                </span>
                <span className="w-1 h-1 rounded-full bg-white-2-5" />
                <a
                  href={getBibleGatewayUrl(study.passage)}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-1 text-brand-1 hover:text-brand-2 transition-colors"
                >
                  <BookOpen className="w-3.5 h-3.5" />
                  <span className="underline underline-offset-4 decoration-brand-1/30 hover:decoration-brand-1">
                    {study.passage}
                  </span>
                  <ExternalLink className="w-3 h-3" />
                </a>
                {study.messenger && (
                  <>
                    <span className="w-1 h-1 rounded-full bg-white-2-5" />
                    <span>Msg by {study.messenger}</span>
                  </>
                )}
              </div>
            </div>

            {/* Key Verse (if available) - simple blockquote style */}
            {study.keyVerse && (
              <blockquote className="border-l-4 border-brand-1/40 pl-4 py-3 mb-8 bg-white-1-5 rounded-r-lg">
                <p className="text-xs font-medium text-brand-1 uppercase tracking-wide mb-1">
                  Key Verse &mdash; {study.keyVerse.verse}
                </p>
                <p className="text-black-2 leading-relaxed italic">
                  &ldquo;{study.keyVerse.text}&rdquo;
                </p>
              </blockquote>
            )}

            {/* Questions Content */}
            <div
              style={{ fontSize: `${fontSize}%` }}
              className="study-content transition-all duration-200"
              dangerouslySetInnerHTML={{ __html: study.questions }}
            />

            {/* Attachments */}
            {study.attachments && study.attachments.length > 0 && (
              <div className="mt-12 pt-8 border-t border-white-2">
                <h3 className="text-base font-medium text-black-1 mb-4">
                  Attachments
                </h3>
                <div className="space-y-3">
                  {study.attachments.map((attachment, idx) => (
                    <a
                      key={idx}
                      href={attachment.url}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center gap-4 p-4 rounded-xl border border-white-2 hover:border-brand-1/30 hover:bg-white-1-5 transition-all group bg-white-0"
                    >
                      <div className="h-10 w-10 flex items-center justify-center rounded-lg bg-white-1-5 text-black-3 group-hover:bg-brand-1 group-hover:text-white-0 transition-colors">
                        {attachment.type === "image" ? (
                          <ImageIcon className="w-5 h-5" />
                        ) : (
                          <File className="w-5 h-5" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-black-1 truncate group-hover:text-brand-1 transition-colors">
                          {attachment.name}
                        </p>
                        <p className="text-xs text-black-3 uppercase">
                          {attachment.type} file
                        </p>
                      </div>
                      <Download className="w-4 h-4 text-white-3 group-hover:text-brand-1 transition-colors" />
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>
        );

      case "transcript":
        return (
          <div className="p-6 sm:p-8 max-w-3xl mx-auto">
            <div className="mb-6 flex items-start justify-between gap-4">
              <div>
                <h2 className="text-xl sm:text-2xl font-medium text-black-1 uppercase leading-tight mb-2 tracking-tight">
                  Message Transcript
                </h2>
                {study.messenger && (
                  <p className="text-sm text-black-3">
                    Message by {study.messenger}
                  </p>
                )}
              </div>
              {study.attachments?.find(
                (a) =>
                  a.type === "docx" &&
                  a.name.toLowerCase().includes("transcript")
              ) && (
                <a
                  href={
                    study.attachments.find(
                      (a) =>
                        a.type === "docx" &&
                        a.name.toLowerCase().includes("transcript")
                    )?.url
                  }
                  target="_blank"
                  rel="noreferrer"
                  className="flex-shrink-0 flex items-center gap-2 px-3 py-1.5 rounded-lg border border-white-2 text-xs font-medium uppercase tracking-wide text-black-3 hover:text-brand-1 hover:bg-white-1-5 transition-all"
                >
                  <FileText className="w-3.5 h-3.5" />
                  Download DOCX
                </a>
              )}
            </div>

            {study.transcript ? (
              <div
                style={{ fontSize: `${fontSize}%` }}
                className="study-content transition-all duration-200"
                dangerouslySetInnerHTML={{ __html: study.transcript }}
              />
            ) : (
              <div className="p-12 text-center bg-white-1-5 rounded-xl border border-dashed border-white-2">
                <p className="text-black-3">
                  Transcript not available for this message.
                </p>
              </div>
            )}
          </div>
        );

      case "leaderGuide":
        return (
          <div className="p-6 sm:p-8 max-w-3xl mx-auto">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl sm:text-2xl font-medium text-black-1 uppercase leading-tight tracking-tight">
                  Answers
                </h2>
                <p className="text-xs font-medium text-white-3 uppercase tracking-wider mt-1">
                  Study Reference
                </p>
              </div>
              {study.attachments?.find(
                (a) =>
                  a.type === "docx" &&
                  a.name.toLowerCase().includes("answer")
              ) && (
                <a
                  href={
                    study.attachments.find(
                      (a) =>
                        a.type === "docx" &&
                        a.name.toLowerCase().includes("answer")
                    )?.url
                  }
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-white-2 text-xs font-medium uppercase tracking-wide text-black-3 hover:text-brand-1 hover:bg-white-1-5 transition-all"
                >
                  <FileText className="w-3.5 h-3.5" />
                  Download DOCX
                </a>
              )}
            </div>

            {study.answers ? (
              <div
                style={{ fontSize: `${fontSize}%` }}
                className="study-content transition-all duration-200"
                dangerouslySetInnerHTML={{ __html: study.answers }}
              />
            ) : (
              <div className="p-12 text-center bg-white-1-5 rounded-xl border border-dashed border-white-2">
                <p className="text-black-3">
                  Answers not available for this study.
                </p>
              </div>
            )}
          </div>
        );

      default:
        return null;
    }
  };

  /* ── Render ── */

  return (
    <div className="bg-white-0 fixed top-0 left-0 right-0 bottom-0 z-[60] flex flex-col shadow-2xl overflow-hidden">
      {/* ─── Header ─── */}
      <header
        className={cn(
          "h-14 bg-white-0 border-b border-white-2 flex items-center px-2 sm:px-4 z-50 flex-none shadow-sm gap-2 sm:gap-4 transition-all duration-300",
          !isHeaderVisible && "min-[0px]:-mt-14 min-[480px]:mt-0"
        )}
      >
        {/* Left: Back + Title */}
        <div className="flex items-center gap-2 sm:gap-4 flex-1 min-w-0">
          <Link
            href="/bible-study"
            className="flex-shrink-0 flex items-center gap-1.5 sm:gap-2 text-black-3 font-medium hover:text-black-1 transition-colors text-xs uppercase tracking-wide bg-white-1 hover:bg-white-1-5 px-2 sm:px-3 py-1.5 rounded-lg"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Back</span>
          </Link>
          <div className="h-4 w-px bg-white-2 flex-shrink-0" />
          <h1 className="text-sm font-medium text-black-1 truncate">
            {study.title}
          </h1>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-2 flex-shrink-0">
          {/* Watch Message - external link */}
          <a
            href="https://www.youtube.com/@LAUBF/streams"
            target="_blank"
            rel="noopener noreferrer"
            className="h-8 flex items-center justify-center rounded-md px-2 sm:px-3 text-xs font-medium uppercase tracking-wide gap-2 transition-all shadow-sm whitespace-nowrap bg-brand-1 text-white-0 hover:bg-brand-2"
          >
            <Video className="w-3.5 h-3.5" />
            <span className="hidden lg:inline">Watch Message</span>
            <ExternalLink className="w-3 h-3 ml-0.5 opacity-70 hidden lg:block" />
          </a>

          {/* Attachments Dropdown */}
          {study.attachments && study.attachments.length > 0 && (
            <SimpleDropdown
              trigger={
                <button className="h-8 flex items-center gap-2 px-2 sm:px-3 border border-white-2 rounded-md text-xs font-medium uppercase tracking-wide text-black-3 hover:text-black-1 hover:bg-white-1-5 transition-all whitespace-nowrap hidden min-[480px]:inline-flex">
                  <Paperclip className="w-3.5 h-3.5 text-white-3" />
                  <span className="hidden lg:inline">
                    Attachments ({study.attachments.length})
                  </span>
                  <ChevronDown className="w-3 h-3 opacity-50 hidden lg:block" />
                </button>
              }
            >
              <div className="px-3 py-1.5 text-xs font-medium text-white-3 uppercase tracking-wider">
                Study Resources
              </div>
              {study.attachments.map((attachment, idx) => (
                <a
                  key={idx}
                  href={attachment.url}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-3 px-3 py-2 hover:bg-white-1-5 transition-colors"
                >
                  <div className="bg-white-1-5 p-1.5 rounded-md text-black-3">
                    {attachment.type === "image" ? (
                      <ImageIcon className="w-4 h-4" />
                    ) : (
                      <File className="w-4 h-4" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-black-2 truncate">
                      {attachment.name}
                    </p>
                    <p className="text-xs text-black-3 uppercase tracking-wide">
                      {attachment.type}
                    </p>
                  </div>
                  <Download className="w-3.5 h-3.5 text-white-3" />
                </a>
              ))}
            </SimpleDropdown>
          )}

          {/* Font Size Controls */}
          <div className="flex items-center gap-1 bg-white-1-5 rounded-lg p-0.5 border border-white-2 pl-1 sm:pl-2">
            <Type className="w-3.5 h-3.5 text-white-3 hidden sm:block" />
            <div className="h-3 w-px bg-white-2-5 mx-0.5 hidden sm:block" />
            <button
              onClick={decreaseFont}
              className="w-8 h-8 flex items-center justify-center hover:bg-white-0 rounded-md text-black-3 hover:text-black-1 transition-colors"
            >
              <Minus className="w-4 h-4" />
            </button>
            <span className="text-[10px] font-medium text-black-1 min-w-[3ch] text-center">
              {fontSize}%
            </span>
            <button
              onClick={increaseFont}
              className="w-8 h-8 flex items-center justify-center hover:bg-white-0 rounded-md text-black-3 hover:text-black-1 transition-colors"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* ─── Main Workspace ─── */}
      <div
        ref={containerRef}
        className="flex-1 flex overflow-hidden bg-white-1-5 relative"
      >
        {/* Mobile View */}
        {!isDesktop ? (
          <div className="flex flex-col w-full h-full bg-white-0 z-20">
            <TabBar
              active={leftTab}
              onChange={(id) => {
                setLeftTab(id);
                scrollToSection(id);
              }}
            />
            <div
              ref={mobileContainerRef}
              onScroll={handleMobileScroll}
              className="flex-1 overflow-y-auto scrollbar-hide scroll-smooth"
            >
              {TABS_CONFIG.map((tab) => (
                <div
                  key={tab.id}
                  id={`mobile-${tab.id}`}
                  className="min-h-[50vh] pb-12 border-b-8 border-white-1-5 last:border-0"
                >
                  {renderContent(tab.id)}
                </div>
              ))}
            </div>
          </div>
        ) : (
          <>
            {/* Desktop Left Pane */}
            <div
              style={{
                width: rightTab ? `${splitRatio}%` : "auto",
                flex: rightTab ? "none" : "1",
              }}
              className={cn(
                "flex flex-col bg-white-0 h-full transition-shadow duration-300 z-10",
                activePane === "left" ? "shadow-md z-20" : "z-10"
              )}
              onClick={() => setActivePane("left")}
            >
              <TabBar active={leftTab} onChange={setLeftTab} />
              <div
                className={cn(
                  "flex-1 overflow-y-auto scrollbar-hide",
                  activePane === "left" ? "bg-white-0" : "bg-white-1/30"
                )}
              >
                {renderContent(leftTab)}
              </div>
            </div>

            {/* Desktop Resizer & Right Pane */}
            {rightTab && (
              <>
                {/* Resize Handle */}
                <div
                  onMouseDown={startResizing}
                  className="w-1 relative z-30 cursor-col-resize flex items-center justify-center hover:bg-brand-1/10 -ml-0.5 group/resizer select-none transition-colors"
                >
                  <div className="w-px h-full bg-white-2 group-hover/resizer:bg-brand-1 transition-colors" />
                  <div className="absolute top-1/2 -translate-y-1/2 bg-white-0 border border-white-2 rounded-md p-0.5 text-white-3 group-hover/resizer:text-brand-1 group-hover/resizer:border-brand-1 shadow-sm transition-all">
                    <GripVertical className="w-3 h-3" />
                  </div>
                </div>

                {/* Right Pane */}
                <div
                  className={cn(
                    "flex flex-col bg-white-0 h-full z-10 flex-1 min-w-0",
                    activePane === "right" ? "shadow-md z-20" : "z-10"
                  )}
                  onClick={() => setActivePane("right")}
                >
                  <TabBar
                    active={rightTab}
                    onChange={setRightTab}
                    onClose={() => setRightTab(null)}
                  />
                  <div
                    className={cn(
                      "flex-1 overflow-y-auto scrollbar-hide",
                      activePane === "right"
                        ? "bg-white-0"
                        : "bg-white-1/30"
                    )}
                  >
                    {renderContent(rightTab)}
                  </div>
                </div>
              </>
            )}

            {/* Add Pane Button */}
            {!rightTab && (
              <div className="w-12 h-full bg-white-1 border-l border-white-2 flex flex-col items-center py-4 gap-4 flex-none">
                <button
                  onClick={() => {
                    setRightTab("guide");
                    setSplitRatio(50);
                  }}
                  className="p-2 rounded-lg bg-white-0 border border-white-2 text-white-3 hover:text-brand-1 hover:border-brand-1 hover:shadow-md transition-all"
                  title="Split View"
                >
                  <Columns className="w-5 h-5" />
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
