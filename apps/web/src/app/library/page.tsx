import type { Metadata } from "next";

import { LibraryClient } from "@/components/works/LibraryClient";

export const metadata: Metadata = {
  title: "Library | Andromeda",
  description: "The literary copies you own on Andromeda.",
};

export default function LibraryPage() {
  return (
    <div className="space-y-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-bold tracking-tight">Your library</h1>
        <p className="text-sm text-white/60">
          Every copy you own, ready to read in your browser.
        </p>
      </header>

      <LibraryClient />
    </div>
  );
}
