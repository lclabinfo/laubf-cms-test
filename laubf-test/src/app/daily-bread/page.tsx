import type { Metadata } from "next";
import { getLatestDailyBread } from "@/lib/dal";
import { getChurchId } from "@/lib/get-church-id";
import { toUIDailyBread } from "@/lib/adapters";
import DailyBreadDetailPage from "@/components/daily-bread/DailyBreadDetailPage";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Daily Bread",
  description:
    "Today\u2019s Daily Bread devotional \u2014 Bible passage, reflection, and prayer from LA UBF.",
};

export default async function DailyBreadPage() {
  const churchId = await getChurchId();
  const dbEntry = await getLatestDailyBread(churchId);

  if (!dbEntry) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-white-1">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-black-1 mb-2">Daily Bread</h1>
          <p className="text-black-3">No daily bread entries available yet.</p>
        </div>
      </main>
    );
  }

  const entry = toUIDailyBread(dbEntry);
  return <DailyBreadDetailPage entry={entry} />;
}
