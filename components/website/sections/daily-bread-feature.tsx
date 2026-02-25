/*
 * DAILY_BREAD_FEATURE
 * Displays today's Daily Bread devotional entry — passage header,
 * collapsible scripture text, body reflection, key verse highlight,
 * and optional sticky audio player. Fetched via dataSource: 'latest-daily-bread'.
 *
 * Data shape (content.dailyBread):
 *   slug, title, date, passage, keyVerse?, body, bibleText?, author, audioUrl?
 */
"use client"

import { useState, useEffect, useRef, useCallback } from "react"
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
  BookMarked,
} from "lucide-react"
import { cn } from "@/lib/utils"
import SectionContainer from "@/components/website/shared/section-container"
import { themeTokens, type SectionTheme, type ThemeTokens } from "@/components/website/shared/theme-tokens"

/* ── Types ── */

interface DailyBreadData {
  slug: string
  title: string
  date: string
  passage: string
  keyVerse: string | null
  body: string
  bibleText: string | null
  author: string
  audioUrl: string | null
}

interface DailyBreadContent {
  dataSource?: string
  dailyBread?: DailyBreadData | null
}

interface Props {
  content: DailyBreadContent
  enableAnimations: boolean
  colorScheme?: SectionTheme
  paddingY?: "none" | "compact" | "default" | "spacious"
  containerWidth?: "standard" | "narrow" | "full"
}

/* ── Helpers ── */

function formatDate(dateStr: string) {
  const date = new Date(dateStr + "T00:00:00")
  return date.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  })
}

function formatTime(time: number) {
  const m = Math.floor(time / 60)
  const s = Math.floor(time % 60)
  return `${m}:${s < 10 ? "0" : ""}${s}`
}

/* ── Audio Player (sticky bottom bar) ── */

function AudioPlayer({
  src,
  title,
  onClose,
}: {
  src: string
  title: string
  onClose: () => void
}) {
  const audioRef = useRef<HTMLAudioElement>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [playbackRate, setPlaybackRate] = useState(1)
  const progressRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return
    const onTime = () => setCurrentTime(audio.currentTime)
    const onMeta = () => setDuration(audio.duration)
    const onEnd = () => setIsPlaying(false)
    audio.addEventListener("timeupdate", onTime)
    audio.addEventListener("loadedmetadata", onMeta)
    audio.addEventListener("ended", onEnd)
    return () => {
      audio.removeEventListener("timeupdate", onTime)
      audio.removeEventListener("loadedmetadata", onMeta)
      audio.removeEventListener("ended", onEnd)
    }
  }, [])

  useEffect(() => {
    if (audioRef.current) audioRef.current.playbackRate = playbackRate
  }, [playbackRate])

  const togglePlay = () => {
    if (!audioRef.current) return
    if (isPlaying) audioRef.current.pause()
    else audioRef.current.play()
    setIsPlaying(!isPlaying)
  }

  const seek = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!progressRef.current || !audioRef.current || !duration) return
    const rect = progressRef.current.getBoundingClientRect()
    const pct = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width))
    audioRef.current.currentTime = pct * duration
  }

  const cycleSpeed = () => {
    const rates = [1, 1.25, 1.5, 2]
    setPlaybackRate(rates[(rates.indexOf(playbackRate) + 1) % rates.length])
  }

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
                if (audioRef.current) audioRef.current.currentTime -= 10
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
              className="flex-1 h-1.5 bg-white-2 rounded-full cursor-pointer relative"
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
  )
}

/* ── Empty State ── */

function EmptyState({ t }: { t: ThemeTokens }) {
  return (
    <div className="max-w-[640px] mx-auto px-6 py-24 text-center">
      <div className={cn("inline-flex items-center justify-center w-14 h-14 rounded-full mb-6", t.surfaceBg)}>
        <BookMarked className={cn("w-6 h-6", t.textMuted)} />
      </div>
      <p className={cn("text-[13px] font-bold uppercase tracking-wider mb-2", t.textMuted)}>
        Daily Bread
      </p>
      <p className={cn("text-lg font-semibold", t.textPrimary)}>
        No entry for today
      </p>
      <p className={cn("text-sm mt-2", t.textSecondary)}>
        Check back tomorrow for a new devotional reflection.
      </p>
      <a
        href="https://ubf.org/daily-breads/list"
        target="_blank"
        rel="noopener noreferrer"
        className={cn(
          "mt-6 inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider transition-colors",
          t.textMuted,
          "hover:text-brand-1"
        )}
      >
        View the archive on UBF.org
        <ExternalLink className="w-3 h-3" />
      </a>
    </div>
  )
}

/* ── Main Section ── */

export default function DailyBreadFeatureSection({
  content,
  colorScheme = "light",
  paddingY,
  containerWidth,
}: Props) {
  const t = themeTokens[colorScheme]

  const [showSidebar, setShowSidebar] = useState(false)
  const [bibleExpanded, setBibleExpanded] = useState(false)
  const [showAudio, setShowAudio] = useState(false)

  /* ── Resizable split pane ── */
  const [splitRatio, setSplitRatio] = useState(45)
  const containerRef = useRef<HTMLDivElement>(null)
  const isResizingRef = useRef(false)

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      if (!isResizingRef.current || !containerRef.current) return
      const rect = containerRef.current.getBoundingClientRect()
      const pct = ((e.clientX - rect.left) / rect.width) * 100
      setSplitRatio(Math.min(Math.max(pct, 25), 65))
    }
    const onUp = () => {
      isResizingRef.current = false
      document.body.style.cursor = "default"
      document.body.style.userSelect = "auto"
    }
    window.addEventListener("mousemove", onMove)
    window.addEventListener("mouseup", onUp)
    return () => {
      window.removeEventListener("mousemove", onMove)
      window.removeEventListener("mouseup", onUp)
    }
  }, [])

  const startResizing = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    isResizingRef.current = true
    document.body.style.cursor = "col-resize"
    document.body.style.userSelect = "none"
  }, [])

  const entry = content.dailyBread

  /* Token-derived inline style values for elements that need dynamic bg */
  const surfaceBgStyle = colorScheme === "dark"
    ? { backgroundColor: "var(--color-black-1-5)" }
    : { backgroundColor: "var(--color-white-0)" }

  return (
    <SectionContainer
      colorScheme={colorScheme}
      paddingY={paddingY ?? "none"}
      containerWidth={containerWidth}
      noContainer
    >
      {!entry ? (
        <EmptyState t={t} />
      ) : (
        <>
          <div ref={containerRef} className="flex">
            {/* ── Left Sidebar — Scripture (desktop, resizable) ── */}
            {showSidebar && (
              <>
                <div
                  style={{ width: `${splitRatio}%` }}
                  className={cn(
                    "hidden lg:flex flex-col border-r h-screen sticky top-0",
                    t.surfaceBg,
                    t.borderColor
                  )}
                >
                  {/* Sidebar Header */}
                  <div className={cn("border-b px-6 pt-6 pb-4 flex items-center justify-between", t.borderColor, t.surfaceBg)}>
                    <div className={cn("flex items-center gap-2 px-4 py-2 rounded-full w-fit", t.btnPrimaryBg, t.btnPrimaryText)}>
                      <BookOpen className="w-3.5 h-3.5" />
                      <span className="text-xs font-medium uppercase tracking-wider">
                        Scripture Reference
                      </span>
                    </div>
                    <button
                      onClick={() => setShowSidebar(false)}
                      className={cn("p-1 rounded transition-colors", t.textMuted, "hover:text-brand-1")}
                    >
                      <PanelLeftClose className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Sidebar Content */}
                  <div className="flex-1 overflow-y-auto">
                    <div className="max-w-[570px] mx-auto px-8 pt-8 pb-40">
                      <div className={cn("flex items-center border-b pb-4 mb-6", t.borderColor)}>
                        <h2 className={cn("text-[20px] font-bold uppercase tracking-tight", t.textPrimary)}>
                          {entry.passage}
                        </h2>
                      </div>
                      <div
                        className="study-bible-text"
                        dangerouslySetInnerHTML={{
                          __html: entry.bibleText || "<p>Scripture text not available.</p>",
                        }}
                      />
                    </div>
                  </div>
                </div>

                {/* Resize Handle */}
                <div
                  onMouseDown={startResizing}
                  className={cn(
                    "hidden lg:flex w-1 relative z-30 cursor-col-resize items-center justify-center -ml-0.5 group/resizer select-none transition-colors",
                    "hover:bg-brand-1/10"
                  )}
                >
                  <div className={cn("w-px h-full transition-colors", t.borderColor, "group-hover/resizer:bg-brand-1")} />
                  <div className={cn(
                    "absolute top-1/2 -translate-y-1/2 border rounded-md p-0.5 shadow-sm transition-all",
                    t.borderColor,
                    t.textMuted,
                    "group-hover/resizer:text-brand-1 group-hover/resizer:border-brand-1"
                  )}
                    style={surfaceBgStyle}
                  >
                    <GripVertical className="w-3 h-3" />
                  </div>
                </div>
              </>
            )}

            {/* ── Main Content ── */}
            <div className="flex-1 min-w-0">
              <div
                className={cn(
                  "mx-auto px-6 sm:px-12 pt-10 sm:pt-14",
                  showSidebar ? "max-w-[640px]" : "max-w-[900px]",
                  showAudio ? "pb-48" : "pb-20"
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
                        <span className={cn("text-[13px] font-medium", t.textMuted)}>
                          {formatDate(entry.date)}
                        </span>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-2">
                        {entry.audioUrl && (
                          <button
                            onClick={() => setShowAudio(true)}
                            className={cn(
                              "flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-bold uppercase tracking-wider transition-colors",
                              t.borderColor,
                              t.surfaceBg,
                              t.textSecondary,
                              "hover:text-brand-1 hover:border-brand-1"
                            )}
                          >
                            <Headphones className="w-3.5 h-3.5" />
                            Listen
                          </button>
                        )}
                        <a
                          href="https://ubf.org/daily-breads/list"
                          target="_blank"
                          rel="noopener noreferrer"
                          className={cn(
                            "flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-bold uppercase tracking-wider transition-colors",
                            t.borderColor,
                            t.surfaceBg,
                            t.textSecondary,
                            "hover:text-brand-1 hover:border-brand-1"
                          )}
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                          Archive
                        </a>
                      </div>
                    </div>

                    <h1 className={cn("text-h1", t.textPrimary)}>{entry.title}</h1>

                    <div className={cn("flex items-center gap-3 text-[13px] font-medium flex-wrap", t.textSecondary)}>
                      <span>Passage</span>
                      <span className={cn("w-1 h-1 rounded-full", t.borderSubtle.replace("border-", "bg-"))} />
                      <span className="text-brand-1">{entry.passage}</span>
                      <span className={cn("w-1 h-1 rounded-full", t.borderSubtle.replace("border-", "bg-"))} />
                      <span className={t.textMuted}>{entry.author}</span>
                    </div>
                  </div>

                  {/* ── Key Verse ── */}
                  {entry.keyVerse && (
                    <blockquote className={cn(
                      "border-l-[3px] border-brand-1 pl-5 py-1",
                    )}>
                      <p className={cn("text-base italic leading-relaxed", t.textSecondary)}>
                        {entry.keyVerse}
                      </p>
                    </blockquote>
                  )}

                  {/* ── Bible Text Section (collapsible) ── */}
                  <div className="relative">
                    <div className={cn("flex items-center justify-between pb-4 flex-wrap gap-3 border-b", t.borderColor)}>
                      <button
                        onClick={() => setBibleExpanded(!bibleExpanded)}
                        className={cn("flex items-center gap-2 transition-colors group", t.textMuted, "hover:text-brand-1")}
                      >
                        <h2 className={cn(
                          "text-[18px] sm:text-[20px] font-bold uppercase tracking-tight transition-colors",
                          t.textPrimary,
                          "group-hover:text-brand-1"
                        )}>
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
                        className={cn(
                          "hidden lg:flex items-center gap-2 px-4 py-2 rounded-lg transition-colors",
                          t.btnPrimaryBg,
                          t.btnPrimaryText,
                          colorScheme === "dark" ? "hover:bg-white-2" : "hover:bg-black-2"
                        )}
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
                        bibleExpanded ? "max-h-[5000px] opacity-100" : "max-h-0 opacity-0"
                      )}
                    >
                      <div className={cn(
                        "border rounded-xl p-6 sm:p-8 mt-4",
                        t.surfaceBg,
                        t.borderColor
                      )}>
                        <div
                          className="study-bible-text"
                          dangerouslySetInnerHTML={{
                            __html: entry.bibleText || "<p>Scripture text not available.</p>",
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
                  <div className={cn("pt-8 border-t text-center", t.borderColor)}>
                    <a
                      href="https://ubf.org/daily-breads/list"
                      target="_blank"
                      rel="noopener noreferrer"
                      className={cn(
                        "text-xs font-medium uppercase tracking-wide transition-colors inline-flex items-center gap-2",
                        t.textMuted,
                        "hover:text-brand-1"
                      )}
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
        </>
      )}
    </SectionContainer>
  )
}
