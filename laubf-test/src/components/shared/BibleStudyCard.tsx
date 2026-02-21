/*
 * BibleStudyCard — Card component for bible study entries
 *
 * Displays: series pill, date, title, passage (with BookOpen icon),
 * resource indicator icons (questions, answers, transcript), and
 * an arrow link. Matches the Figma design closely.
 */
import Link from "next/link";
import type { BibleStudy } from "@/lib/types/bible-study";
import {
  IconBookOpen,
  IconFileText,
  IconHelpCircle,
  IconVideo,
  IconArrowUpRight,
} from "@/components/layout/icons";

function formatDate(dateStr: string) {
  const date = new Date(dateStr + "T00:00:00");
  const month = date
    .toLocaleDateString("en-US", { month: "short" })
    .toUpperCase();
  const day = date.getDate();
  const year = date.getFullYear();
  return `${month} ${day}, ${year}`;
}

export default function BibleStudyCard({ study }: { study: BibleStudy }) {
  return (
    <Link
      href={`/bible-study/${study.slug}`}
      className="group relative rounded-[24px] cursor-pointer transition-all hover:shadow-[0px_8px_16px_0px_rgba(0,0,0,0.06)] min-h-[232px]"
    >
      <div className="flex flex-col items-start p-[28px] rounded-[inherit] h-full min-h-[232px]">
        {/* Top Section */}
        <div className="flex flex-col gap-[12px] items-start w-full mb-[20px]">
          {/* Series and Date Row */}
          <div className="flex items-center justify-between w-full">
            <div className="bg-white-2 flex flex-col items-start px-[8px] py-[6px] rounded-[8px] shrink-0">
              <p className="font-medium leading-none text-black-3 text-[12px] text-center tracking-[0.24px]">
                {study.series}
              </p>
            </div>
            <p className="font-medium leading-none text-black-3 text-[14px] tracking-[-0.42px] whitespace-nowrap">
              {formatDate(study.dateFor)}
            </p>
          </div>

          {/* Title and Passage */}
          <div className="w-full">
            <div className="flex flex-col gap-[8px] items-start px-[8px] w-full">
              <p className="font-medium leading-[1.2] text-black-1 text-[18px] sm:text-[24px] tracking-[-0.72px] w-full">
                {study.title}
              </p>
              <div className="flex gap-[8px] items-center w-full">
                <IconBookOpen className="shrink-0 size-[16px] text-black-3" />
                <p className="flex-1 leading-[1.4] text-black-3 text-[14px] sm:text-[16px] tracking-[-0.32px]">
                  {study.passage}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Section - Resource Icons and Arrow */}
        <div className="flex h-[32px] items-center justify-between w-full mt-auto">
          {/* Resource Indicators */}
          <div className="flex gap-[8px] items-center">
            {study.hasQuestions && (
              <div className="bg-white-1-5 flex items-center overflow-clip p-[8px] rounded-[8px] shrink-0">
                <IconFileText className="shrink-0 size-[16px] text-black-2" />
              </div>
            )}
            {study.hasAnswers && (
              <div className="bg-white-1-5 flex items-center overflow-clip p-[8px] rounded-[8px] shrink-0">
                <IconHelpCircle className="shrink-0 size-[16px] text-black-2" />
              </div>
            )}
            {study.hasTranscript && (
              <div className="bg-white-1-5 flex items-center overflow-clip p-[8px] rounded-[8px] shrink-0">
                <IconVideo className="shrink-0 size-[16px] text-black-2" />
              </div>
            )}
          </div>

          {/* Arrow Icon */}
          <IconArrowUpRight className="shrink-0 size-[24px] text-black-3 transition-transform group-hover:translate-x-1 group-hover:-translate-y-1" />
        </div>
      </div>

      {/* Border and Shadow overlay */}
      <div
        aria-hidden="true"
        className="absolute border border-white-2-5 inset-0 pointer-events-none rounded-[24px] shadow-[0px_4px_12px_0px_rgba(0,0,0,0.04)] transition-shadow group-hover:shadow-[0px_8px_16px_0px_rgba(0,0,0,0.06)]"
      />
    </Link>
  );
}
