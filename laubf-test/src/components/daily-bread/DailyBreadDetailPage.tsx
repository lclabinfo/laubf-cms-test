"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import {
  ChevronDown,
  ChevronUp,
  BookOpen,
  PanelLeftOpen,
  PanelLeftClose,
  ExternalLink,
  GripVertical,
  Headphones,
  Play,
  Pause,
  RotateCcw,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { DailyBread } from "@/lib/types/daily-bread";

function formatDate(dateStr: string) {
  const date = new Date(dateStr + "T00:00:00");
  return date.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

function formatTime(time: number) {
  const m = Math.floor(time / 60);
  const s = Math.floor(time % 60);
  return `${m}:${s < 10 ? "0" : ""}${s}`;
}

/* ── Audio Player (sticky bottom bar) ── */

function AudioPlayer({
  src,
  title,
  onClose,
}: {
  src: string;
  title: string;
  onClose: () => void;
}) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [playbackRate, setPlaybackRate] = useState(1);
  const progressRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    const onTime = () => setCurrentTime(audio.currentTime);
    const onMeta = () => setDuration(audio.duration);
    const onEnd = () => setIsPlaying(false);
    audio.addEventListener("timeupdate", onTime);
    audio.addEventListener("loadedmetadata", onMeta);
    audio.addEventListener("ended", onEnd);
    return () => {
      audio.removeEventListener("timeupdate", onTime);
      audio.removeEventListener("loadedmetadata", onMeta);
      audio.removeEventListener("ended", onEnd);
    };
  }, []);

  useEffect(() => {
    if (audioRef.current) audioRef.current.playbackRate = playbackRate;
  }, [playbackRate]);

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) audioRef.current.pause();
    else audioRef.current.play();
    setIsPlaying(!isPlaying);
  };

  const seek = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!progressRef.current || !audioRef.current || !duration) return;
    const rect = progressRef.current.getBoundingClientRect();
    const pct = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    audioRef.current.currentTime = pct * duration;
  };

  const cycleSpeed = () => {
    const rates = [1, 1.25, 1.5, 2];
    setPlaybackRate(rates[(rates.indexOf(playbackRate) + 1) % rates.length]);
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white-0 border-t border-white-2 shadow-[0_-4px_20px_rgba(0,0,0,0.08)] z-50 px-4 sm:px-6 py-3">
      <audio ref={audioRef} src={src} />
      <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center gap-3 sm:gap-6">
        {/* Info */}
        <div className="flex-1 min-w-0 text-center sm:text-left">
          <p className="text-[10px] font-bold text-brand-1 uppercase tracking-widest mb-0.5">
            Now Playing
          </p>
          <p className="text-sm font-medium text-black-1 truncate">{title}</p>
        </div>

        {/* Controls */}
        <div className="flex flex-col items-center w-full sm:w-1/2 gap-1.5">
          <div className="flex items-center gap-5">
            <button
              onClick={() => {
                if (audioRef.current) audioRef.current.currentTime -= 10;
              }}
              className="text-black-3 hover:text-black-1 transition-colors"
              title="Rewind 10s"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
            <button
              onClick={togglePlay}
              className="w-10 h-10 rounded-full bg-black-1 text-white-0 flex items-center justify-center hover:bg-black-2 transition-colors"
            >
              {isPlaying ? (
                <Pause className="w-4 h-4 fill-current" />
              ) : (
                <Play className="w-4 h-4 fill-current ml-0.5" />
              )}
            </button>
            <button
              onClick={cycleSpeed}
              className="text-black-3 hover:text-black-1 transition-colors text-xs font-bold w-8"
            >
              {playbackRate}x
            </button>
          </div>
          <div className="flex items-center gap-2 w-full">
            <span className="text-[11px] font-medium text-black-3 w-9 text-right tabular-nums">
              {formatTime(currentTime)}
            </span>
            <div
              ref={progressRef}
              onClick={seek}
              className="flex-1 h-1.5 bg-white-2 rounded-full cursor-pointer relative group"
            >
              <div
                className="h-full bg-brand-1 rounded-full transition-[width] duration-100"
                style={{
                  width: duration ? `${(currentTime / duration) * 100}%` : "0%",
                }}
              />
            </div>
            <span className="text-[11px] font-medium text-black-3 w-9 tabular-nums">
              {formatTime(duration)}
            </span>
          </div>
        </div>

        {/* Close */}
        <div className="hidden sm:flex items-center justify-end flex-1">
          <button
            onClick={onClose}
            className="text-black-3 hover:text-black-1 transition-colors p-1"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── Main Component ── */

export default function DailyBreadDetailPage({
  entry,
}: {
  entry: DailyBread;
}) {
  const [showSidebar, setShowSidebar] = useState(false);
  const [bibleExpanded, setBibleExpanded] = useState(false);
  const [showAudio, setShowAudio] = useState(false);

  /* ── Resizable split pane (same pattern as bible study) ── */
  const [splitRatio, setSplitRatio] = useState(45);
  const containerRef = useRef<HTMLDivElement>(null);
  const isResizingRef = useRef(false);

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      if (!isResizingRef.current || !containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const pct = ((e.clientX - rect.left) / rect.width) * 100;
      setSplitRatio(Math.min(Math.max(pct, 25), 65));
    };
    const onUp = () => {
      isResizingRef.current = false;
      document.body.style.cursor = "default";
      document.body.style.userSelect = "auto";
    };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
  }, []);

  const startResizing = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    isResizingRef.current = true;
    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";
  }, []);

  return (
    <main className="bg-white-0 min-h-screen text-black-1">
      {/* ── Split layout ── */}
      <div ref={containerRef} className="flex min-h-screen">
        {/* Left Sidebar — Scripture (desktop, resizable) */}
        {showSidebar && (
          <>
            <div
              style={{ width: `${splitRatio}%` }}
              className="hidden lg:flex flex-col bg-white-1 border-r border-white-2 h-screen sticky top-0"
            >
              {/* Sidebar Header */}
              <div className="border-b border-white-2 px-6 pt-6 pb-4 bg-white-1 flex items-center justify-between">
                <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-black-1 text-white-0 w-fit">
                  <BookOpen className="w-3.5 h-3.5" />
                  <span className="text-xs font-medium uppercase tracking-wider">
                    Scripture Reference
                  </span>
                </div>
                <button
                  onClick={() => setShowSidebar(false)}
                  className="p-1 hover:bg-white-1-5 rounded text-black-3 hover:text-black-1 transition-colors"
                >
                  <PanelLeftClose className="w-4 h-4" />
                </button>
              </div>

              {/* Sidebar Content */}
              <div className="flex-1 overflow-y-auto">
                <div className="max-w-[570px] mx-auto px-8 pt-8 pb-40">
                  <div className="flex items-center border-b border-white-2 pb-4 mb-6">
                    <h2 className="text-[20px] font-bold text-black-1 uppercase tracking-tight">
                      {entry.passage}
                    </h2>
                  </div>
                  <div
                    className="study-bible-text"
                    dangerouslySetInnerHTML={{
                      __html:
                        entry.bibleText ||
                        "<p>Scripture text not available.</p>",
                    }}
                  />
                </div>
              </div>
            </div>

            {/* Resize Handle */}
            <div
              onMouseDown={startResizing}
              className="hidden lg:flex w-1 relative z-30 cursor-col-resize items-center justify-center hover:bg-brand-1/10 -ml-0.5 group/resizer select-none transition-colors"
            >
              <div className="w-px h-full bg-white-2 group-hover/resizer:bg-brand-1 transition-colors" />
              <div className="absolute top-1/2 -translate-y-1/2 bg-white-0 border border-white-2 rounded-md p-0.5 text-white-3 group-hover/resizer:text-brand-1 group-hover/resizer:border-brand-1 shadow-sm transition-all">
                <GripVertical className="w-3 h-3" />
              </div>
            </div>
          </>
        )}

        {/* Main Content */}
        <div className="flex-1 min-w-0">
          <div
            className={cn(
              "mx-auto px-6 sm:px-12 pt-10 sm:pt-12 relative",
              showSidebar ? "max-w-[640px]" : "max-w-[900px]",
              showAudio ? "pb-48" : "pb-40"
            )}
          >
            <div className="flex flex-col gap-8">
              {/* ── Entry Header ── */}
              <div className="flex flex-col gap-5">
                <div className="flex items-center justify-between flex-wrap gap-3">
                  <div className="flex items-center gap-3">
                    <span className="bg-brand-1 text-white-0 px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider">
                      Daily Bread
                    </span>
                    <span className="text-[13px] font-medium text-black-3">
                      {formatDate(entry.date)}
                    </span>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2">
                    {entry.audioUrl && (
                      <button
                        onClick={() => setShowAudio(true)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-white-2 bg-white-1 text-xs font-bold uppercase tracking-wider text-black-2 hover:text-brand-1 hover:border-brand-1 transition-colors"
                      >
                        <Headphones className="w-3.5 h-3.5" />
                        Listen
                      </button>
                    )}
                    <a
                      href="https://ubf.org/daily-breads/list"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-white-2 bg-white-1 text-xs font-bold uppercase tracking-wider text-black-2 hover:text-brand-1 hover:border-brand-1 transition-colors"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      Archive
                    </a>
                  </div>
                </div>

                <h1 className="text-h1 text-black-1">{entry.title}</h1>

                <div className="flex items-center gap-3 text-[13px] font-medium text-black-2 flex-wrap">
                  <span>Passage</span>
                  <span className="w-1 h-1 rounded-full bg-white-2-5" />
                  <span className="text-brand-1">{entry.passage}</span>
                  <span className="w-1 h-1 rounded-full bg-white-2-5" />
                  <span className="text-black-3">{entry.author}</span>
                </div>
              </div>

              {/* ── Bible Text Section ── */}
              <div className="relative">
                <div className="flex items-center justify-between pb-4 flex-wrap gap-3">
                  <button
                    onClick={() => setBibleExpanded(!bibleExpanded)}
                    className="flex items-center gap-2 text-black-3 hover:text-brand-1 transition-colors group"
                  >
                    <h2 className="text-[18px] sm:text-[20px] font-bold text-black-1 uppercase tracking-tight group-hover:text-brand-1 transition-colors">
                      {entry.passage}
                    </h2>
                    <div className="flex items-center gap-1.5">
                      <span className="text-[11px] font-bold uppercase tracking-wider">
                        {bibleExpanded ? "Collapse" : "Expand"}
                      </span>
                      {bibleExpanded ? (
                        <ChevronUp className="w-4 h-4" />
                      ) : (
                        <ChevronDown className="w-4 h-4" />
                      )}
                    </div>
                  </button>

                  <button
                    onClick={() => setShowSidebar(!showSidebar)}
                    className="hidden lg:flex items-center gap-2 px-4 py-2 rounded-lg bg-black-1 text-white-0 hover:bg-black-2 transition-colors"
                  >
                    {showSidebar ? (
                      <PanelLeftClose className="w-4 h-4" />
                    ) : (
                      <PanelLeftOpen className="w-4 h-4" />
                    )}
                    <span className="text-xs font-bold uppercase tracking-wider">
                      {showSidebar ? "Close" : "Open"} Side Panel
                    </span>
                  </button>
                </div>

                {/* Collapsible inline scripture */}
                <div
                  className={cn(
                    "overflow-hidden transition-all duration-300 ease-in-out",
                    bibleExpanded
                      ? "max-h-[5000px] opacity-100"
                      : "max-h-0 opacity-0"
                  )}
                >
                  <div className="bg-white-1 border border-white-2 rounded-xl p-6 sm:p-8">
                    <div
                      className="study-bible-text"
                      dangerouslySetInnerHTML={{
                        __html:
                          entry.bibleText ||
                          "<p>Scripture text not available.</p>",
                      }}
                    />
                  </div>
                </div>
              </div>

              {/* ── Body Content ── */}
              <div
                className="study-content"
                dangerouslySetInnerHTML={{ __html: entry.body }}
              />

              {/* ── Footer ── */}
              <div className="pt-8 border-t border-white-2 text-center">
                <a
                  href="https://ubf.org/daily-breads/list"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs font-medium text-black-3 hover:text-brand-1 uppercase tracking-wide transition-colors inline-flex items-center gap-2"
                >
                  View All Daily Bread Archive on UBF.org
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Audio Player ── */}
      {showAudio && entry.audioUrl && (
        <AudioPlayer
          src={entry.audioUrl}
          title={entry.title}
          onClose={() => setShowAudio(false)}
        />
      )}
    </main>
  );
}
