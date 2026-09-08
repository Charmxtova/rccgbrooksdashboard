"use client";

import { formatDate } from "@/lib/aggregate";
import type { GroupStats } from "@/lib/compare";

/**
 * Every card that reports on the two groups repeats which dates each one
 * covers. Without it a reader has to scroll back to the pickers to know what
 * they are looking at, and the numbers mean nothing without that context.
 */
export function CoverageLine({
  name,
  stats,
  dotClass,
}: {
  name: string;
  stats: GroupStats;
  dotClass: string;
}) {
  return (
    <p className="flex items-center gap-2">
      <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${dotClass}`} aria-hidden />
      <span>
        <span className="font-semibold text-ink-700 dark:text-slate-200">{name}</span>{" "}
        {stats.firstDate
          ? `covers ${formatDate(stats.firstDate)} to ${formatDate(stats.lastDate!)}`
          : "has no services in it"}
      </span>
    </p>
  );
}

export default function CoverageNote({
  statsA,
  statsB,
  className = "",
}: {
  statsA: GroupStats;
  statsB: GroupStats;
  className?: string;
}) {
  return (
    <div
      className={`grid gap-2 text-xs text-ink-500 sm:grid-cols-2 dark:text-slate-400 ${className}`}
    >
      <CoverageLine name="Set A" stats={statsA} dotClass="bg-brand-500" />
      <CoverageLine name="Set B" stats={statsB} dotClass="bg-accent-500" />
    </div>
  );
}
