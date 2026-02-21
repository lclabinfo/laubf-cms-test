import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Giving",
  description: "Support the mission of LA UBF through generous giving.",
};

export default function Page() {
  return (
    <main className="min-h-screen bg-white-1 pt-32 pb-20">
      <div className="container-standard">
        <h1 className="text-h2 text-black-1 mb-6">Giving</h1>
        <p className="text-body-1 text-black-3 mb-8">This page is coming soon.</p>
        <Link href="/" className="text-body-1 text-brand-1 hover:underline">
          &larr; Back to home
        </Link>
      </div>
    </main>
  );
}
