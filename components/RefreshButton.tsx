"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

export default function RefreshButton() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [posting, setPosting] = useState(false);
  const [failed, setFailed] = useState(false);

  const busy = posting || isPending;

  async function refresh() {
    setPosting(true);
    setFailed(false);
    try {
      const res = await fetch("/api/refresh", { method: "POST" });
      if (!res.ok) throw new Error(String(res.status));
      // Clearing the cache server-side is only half of it; the page still has
      // to be re-rendered for the new rows to appear.
      startTransition(() => router.refresh());
    } catch {
      setFailed(true);
    } finally {
      setPosting(false);
    }
  }

  return (
    <button
      type="button"
      onClick={refresh}
      disabled={busy}
      title={
        failed
          ? "Could not refresh. Check your connection and try again."
          : "Re-read the attendance sheet now"
      }
      className={`inline-flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold text-white transition disabled:opacity-70 ${
        failed ? "bg-rose-600 hover:bg-rose-700" : "bg-brand-600 hover:bg-brand-700"
      }`}
    >
      <svg
        viewBox="0 0 24 24"
        className={`h-3.5 w-3.5 ${busy ? "animate-spin" : ""}`}
        fill="none"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
        aria-hidden
      >
        <path d="M20 11a8 8 0 1 0-.6 4" />
        <path d="M20 4v7h-7" />
      </svg>
      {busy ? "Refreshing" : failed ? "Try again" : "Refresh"}
    </button>
  );
}
