"use client";

import type { Insight, InsightKind } from "@/lib/compare";

/**
 * Numbers carry the meaning in these sentences, so they are pulled out in a
 * heavier weight. The split keeps the capture group, so the parts alternate
 * between plain text and a numeric token.
 */
function highlight(text: string) {
  return text.split(/([+-]?\d[\d,]*(?:\.\d+)?%?)/g).map((part, i) =>
    /^[+-]?\d/.test(part) ? (
      <strong key={i} className="font-bold text-ink-900 dark:text-white">
        {part}
      </strong>
    ) : (
      <span key={i}>{part}</span>
    ),
  );
}

const STYLES: Record<
  InsightKind,
  { ring: string; badge: string; glyph: string; label: string }
> = {
  up: {
    ring: "border-emerald-200 bg-emerald-50/70 dark:border-emerald-500/25 dark:bg-emerald-500/10",
    badge: "bg-emerald-500 text-white",
    glyph: "▲",
    label: "higher",
  },
  down: {
    ring: "border-amber-200 bg-amber-50/70 dark:border-amber-500/25 dark:bg-amber-500/10",
    badge: "bg-amber-500 text-white",
    glyph: "▼",
    label: "lower",
  },
  flat: {
    ring: "border-brand-100 bg-brand-50/50 dark:border-night-600 dark:bg-night-800/60",
    badge: "bg-ink-400 text-white",
    glyph: "=",
    label: "level",
  },
  note: {
    ring: "border-brand-200 bg-brand-50/60 dark:border-brand-500/25 dark:bg-brand-500/10",
    badge: "bg-brand-500 text-white",
    glyph: "★",
    label: "worth noting",
  },
  warn: {
    ring: "border-rose-200 bg-rose-50/70 dark:border-rose-500/25 dark:bg-rose-500/10",
    badge: "bg-rose-500 text-white",
    glyph: "!",
    label: "caution",
  },
};

export default function CompareInsights({ insights }: { insights: Insight[] }) {
  if (insights.length === 0) {
    return (
      <p className="rounded-lg border border-dashed border-brand-200 bg-brand-50/40 px-4 py-6 text-center text-sm text-ink-500 dark:border-night-600 dark:bg-night-800/50 dark:text-slate-400">
        The two groups are too similar to draw anything out of.
      </p>
    );
  }

  // Cautions are about how far to trust the rest, so they belong above it.
  const cautions = insights.filter((i) => i.kind === "warn");
  const findings = insights.filter((i) => i.kind !== "warn");

  return (
    <div className="space-y-4">
      {cautions.length > 0 && (
        <div className="rounded-lg border border-rose-200 bg-rose-50/70 p-3 dark:border-rose-500/25 dark:bg-rose-500/10">
          <ul className="space-y-1.5">
            {cautions.map((c, i) => (
              <li
                key={i}
                className="flex gap-2 text-xs leading-relaxed text-rose-900 dark:text-rose-200"
              >
                <span aria-hidden className="font-bold">
                  !
                </span>
                <span>
                  <span className="sr-only">Caution: </span>
                  {highlight(c.text)}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <ul className="grid gap-3 lg:grid-cols-2">
        {findings.map((insight, i) => {
          const s = STYLES[insight.kind];
          return (
            <li
              key={i}
              className={`flex items-start gap-3 rounded-xl border p-3.5 transition ${s.ring}`}
            >
              <span
                aria-hidden
                className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[11px] font-bold leading-none ${s.badge}`}
              >
                {s.glyph}
              </span>
              <p className="text-sm leading-relaxed text-ink-700 dark:text-slate-200">
                <span className="sr-only">{s.label}: </span>
                {highlight(insight.text)}
              </p>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
