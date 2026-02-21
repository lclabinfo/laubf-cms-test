import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Campus Ministries",
  description: "Explore LA UBF campus ministries across colleges and universities in Los Angeles.",
};

export default function Page() {
  return (
    <main className="min-h-screen bg-white-1 pt-32 pb-20">
      <div className="container-standard">
        <h1 className="text-h2 text-black-1 mb-6">Campus Ministries</h1>
        <p className="text-body-1 text-black-3 mb-8">This page is coming soon.</p>
        <Link href="/ministries" className="text-body-1 text-brand-1 hover:underline">
          &larr; Back to ministries
        </Link>
      </div>
    </main>
  );
}
