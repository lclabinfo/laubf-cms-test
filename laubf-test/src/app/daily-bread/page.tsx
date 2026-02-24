import type { Metadata } from "next";
import { TODAYS_DAILY_BREAD } from "@/lib/mock-data/daily-bread";
import DailyBreadDetailPage from "@/components/daily-bread/DailyBreadDetailPage";

export const metadata: Metadata = {
  title: "Daily Bread",
  description:
    "Today\u2019s Daily Bread devotional \u2014 Bible passage, reflection, and prayer from LA UBF.",
};

export default function DailyBreadPage() {
  return <DailyBreadDetailPage entry={TODAYS_DAILY_BREAD} />;
}
