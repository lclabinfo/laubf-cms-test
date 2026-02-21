/*
 * TranscriptPanel — Client component for message transcript display
 *
 * Features:
 * - Tab toggle between "Live Caption" (auto-generated) and "Message Text" (prepared)
 * - Scrollable transcript content area
 * - Defaults to Live Caption when available
 * - Auto-generated disclaimer for live captions
 */
"use client";

import { useState } from "react";
import { IconFileText } from "@/components/layout/icons";
import { cn } from "@/lib/utils";

type TranscriptTab = "live" | "raw";

export default function TranscriptPanel({
  liveTranscript,
  rawTranscript,
}: {
  liveTranscript?: string;
  rawTranscript: string;
}) {
  const hasLive = !!liveTranscript;
  const [tab, setTab] = useState<TranscriptTab>(hasLive ? "live" : "raw");

  const tabs: { key: TranscriptTab; label: string; disabled?: boolean }[] = [
    { key: "live", label: "Live Caption", disabled: !hasLive },
    { key: "raw", label: "Message Text" },
  ];

  const content = tab === "live" && hasLive ? liveTranscript : rawTranscript;

  return (
    <div className="bg-white-1 border border-white-2-5 rounded-[24px] shadow-sm overflow-hidden">
      {/* Header */}
      <div className="bg-white-0 border-b border-white-2 px-6 pt-6 pb-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <IconFileText className="size-4 text-black-1" />
            <span className="text-[12px] font-black text-black-1 uppercase tracking-[1.2px]">
              Transcript
            </span>
          </div>
        </div>

        {/* Tab toggle */}
        <div className="flex rounded-[14px] bg-white-1-5/80 p-1">
          {tabs.map((t) => (
            <button
              key={t.key}
              disabled={t.disabled}
              onClick={() => setTab(t.key)}
              className={cn(
                "flex-1 rounded-[14px] py-1.5 text-[12px] font-bold uppercase tracking-[0.3px] text-center transition-colors",
                tab === t.key
                  ? "bg-white-0 text-black-1 shadow-sm"
                  : t.disabled
                    ? "text-black-3/40 cursor-not-allowed"
                    : "text-black-3 hover:text-black-1",
              )}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Transcript content */}
      <div className="px-6 py-6 max-h-[500px] overflow-y-auto">
        <div
          className="max-w-none text-[14px] leading-[1.65] text-black-2 tracking-[-0.15px] [&_p]:mb-5 [&_p:first-child]:text-black-1 [&_p:last-child]:mb-0"
          dangerouslySetInnerHTML={{ __html: content! }}
        />
      </div>

      {/* Footer disclaimer */}
      {tab === "live" && (
        <div className="px-6 pb-4">
          <p className="text-[10px] text-black-3 text-center tracking-[0.12px]">
            Live transcripts are auto-generated.
          </p>
        </div>
      )}
    </div>
  );
}
