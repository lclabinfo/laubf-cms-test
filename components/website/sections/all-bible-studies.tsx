"use client"

import { useState, useMemo } from "react"
import SectionContainer from "@/components/website/shared/section-container"
import BibleStudyCard from "@/components/website/shared/bible-study-card"
import { themeTokens, type SectionTheme } from "@/components/website/shared/theme-tokens"
import {
  IconBookOpen,
  IconFileText,
  IconHelpCircle,
  IconVideo,
  IconChevronRight,
  IconSearch,
} from "@/components/website/shared/icons"
import { cn } from "@/lib/utils"
import Link from "next/link"

interface BibleStudy {
  id: string
  slug: string
  title: string
  passage: string
  series: string
  dateFor: string
  hasQuestions: boolean
  hasAnswers: boolean
  hasTranscript: boolean
  book?: string
}

const INITIAL_COUNT = 9
const LOAD_MORE_COUNT = 9

interface AllBibleStudiesContent {
  heading?: string
}

interface Props {
  content: AllBibleStudiesContent
  enableAnimations: boolean
  colorScheme?: SectionTheme
  paddingY?: "none" | "compact" | "default" | "spacious"
  containerWidth?: "standard" | "narrow" | "full"
  studies?: BibleStudy[]
}

export default function AllBibleStudiesSection({ content, enableAnimations, colorScheme = "light", paddingY, containerWidth, studies = [] }: Props) {
  const t = themeTokens[colorScheme]

  const [search, setSearch] = useState("")
  const [displayCount, setDisplayCount] = useState(INITIAL_COUNT)
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc")

  const filteredStudies = useMemo(() => {
    let result = studies
    if (search) {
      const q = search.toLowerCase()
      result = result.filter(
        (s) =>
          s.title.toLowerCase().includes(q) ||
          s.passage.toLowerCase().includes(q) ||
          s.series.toLowerCase().includes(q),
      )
    }
    return [...result].sort((a, b) => {
      const cmp = a.dateFor.localeCompare(b.dateFor)
      return sortDirection === "asc" ? cmp : -cmp
    })
  }, [studies, search, sortDirection])

  const visibleStudies = filteredStudies.slice(0, displayCount)
  const hasMore = displayCount < filteredStudies.length

  return (
    <SectionContainer colorScheme={colorScheme} paddingY="none" containerWidth={containerWidth} className="pb-24 lg:pb-30">
      {/* Search bar */}
      <div className="mb-8 flex flex-col gap-4">
        <div className="relative max-w-md">
          <IconSearch className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-black-3" />
          <input
            type="text"
            placeholder="Search studies, passages, series..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value)
              setDisplayCount(INITIAL_COUNT)
            }}
            className="w-full pl-10 pr-4 py-3 bg-white-1-5 border border-white-2 rounded-lg text-body-2 text-black-1 placeholder:text-white-3 outline-none focus:border-brand-1 transition-colors"
          />
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setSortDirection(sortDirection === "desc" ? "asc" : "desc")}
            className="text-[13px] font-medium text-black-3 hover:text-black-1 transition-colors"
          >
            Date: {sortDirection === "desc" ? "Newest first" : "Oldest first"}
          </button>
          <span className="text-[13px] text-black-3">
            {filteredStudies.length} {filteredStudies.length === 1 ? "study" : "studies"}
          </span>
        </div>
      </div>

      {/* Studies grid */}
      {filteredStudies.length === 0 ? (
        <div className="flex flex-col items-center py-20">
          <p className={`text-body-1 ${t.textSecondary}`}>
            No studies found matching your criteria.
          </p>
          <button
            onClick={() => {
              setSearch("")
              setDisplayCount(INITIAL_COUNT)
            }}
            className="mt-4 text-accent-blue text-[14px] font-medium hover:underline"
          >
            Clear all filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {visibleStudies.map((study) => (
            <BibleStudyCard key={study.id} study={study} />
          ))}
        </div>
      )}

      {/* Load more */}
      {hasMore && (
        <div className="flex justify-center mt-10">
          <button
            onClick={() => setDisplayCount((c) => c + LOAD_MORE_COUNT)}
            className="inline-flex items-center justify-center rounded-full border border-black-1/30 px-8 py-4 text-button-1 text-black-1 transition-colors hover:bg-black-1 hover:text-white-1"
          >
            Load More Studies
          </button>
        </div>
      )}
    </SectionContainer>
  )
}
