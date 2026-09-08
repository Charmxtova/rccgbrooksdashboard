"use client";

import { useState } from "react";
import type { GroupStats, Insight } from "@/lib/compare";
import { buildComparisonCsv, downloadCsv, type ExportSection } from "@/lib/exportCsv";

export default function ExportButton({
  labelA,
  labelB,
  statsA,
  statsB,
  sections,
  insights,
}: {
  labelA: string;
  labelB: string;
  statsA: GroupStats;
  statsB: GroupStats;
  sections: ExportSection[];
  insights: Insight[];
}) {
  const [done, setDone] = useState(false);

  function handleExport() {
    const csv = buildComparisonCsv({
      labelA,
      labelB,
      statsA,
      statsB,
      sections,
      insights,
    });
    const stamp = new Date().toISOString().slice(0, 10);
    downloadCsv(`brooks-comparison-${stamp}.csv`, csv);

    // Downloads give no visible feedback of their own, so confirm briefly.
    setDone(true);
    setTimeout(() => setDone(false), 2000);
  }

  return (
    <button
      type="button"
      onClick={handleExport}
      className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-brand-200 px-2.5 py-1.5 text-xs font-semibold text-brand-700 transition hover:bg-brand-50 dark:border-night-600 dark:text-brand-300 dark:hover:bg-night-700"
    >
      {done ? (
        <svg
          viewBox="0 0 24 24"
          className="h-3.5 w-3.5"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden
        >
          <path d="M20 6 9 17l-5-5" />
        </svg>
      ) : (
        <svg
          viewBox="0 0 24 24"
          className="h-3.5 w-3.5"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden
        >
          <path d="M12 3v12M7 11l5 5 5-5M4 20h16" />
        </svg>
      )}
      {done ? "Downloaded" : "Export CSV"}
    </button>
  );
}
