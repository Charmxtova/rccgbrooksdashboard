"use client";

import type { MetricRow, MetricSection } from "@/lib/metrics";

function show(v: number | null, row: MetricRow) {
  return v === null ? "n/a" : v.toFixed(row.dp) + (row.suffix ?? "");
}

/**
 * The split bar puts the two groups on one 100% width so their relative size
 * reads at a glance. It is proportion only, which is why every row is scaled
 * against its own pair rather than against the table.
 */
function SplitBar({ a, b }: { a: number | null; b: number | null }) {
  if (a === null || b === null || a + b <= 0) {
    return <div className="h-1.5 w-full rounded-full bg-brand-50 dark:bg-night-800" />;
  }
  const share = (a / (a + b)) * 100;
  return (
    <div
      className="flex h-1.5 w-full overflow-hidden rounded-full bg-brand-50 dark:bg-night-800"
      role="img"
      aria-label={`Set A holds ${share.toFixed(0)} percent of the pair`}
    >
      <div className="h-full bg-brand-500" style={{ width: `${share}%` }} />
      <div className="h-full bg-accent-500" style={{ width: `${100 - share}%` }} />
    </div>
  );
}

export default function CompareTable({ sections }: { sections: MetricSection[] }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[600px] border-separate border-spacing-0 text-left text-sm">
        <thead>
          <tr className="text-xs uppercase tracking-wide text-ink-500 dark:text-slate-400">
            <th className="pb-3 font-medium">Metric</th>
            <th className="pb-3 text-right font-medium">
              <span className="inline-flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-brand-500" aria-hidden />
                Set A
              </span>
            </th>
            <th className="pb-3 text-right font-medium">
              <span className="inline-flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-accent-500" aria-hidden />
                Set B
              </span>
            </th>
            <th className="w-[26%] pb-3 pl-4 font-medium">Split</th>
            <th className="pb-3 text-right font-medium">Difference</th>
          </tr>
        </thead>

        <tbody>
          {sections.map((section) => (
            <SectionRows key={section.title} section={section} />
          ))}
        </tbody>
      </table>

      <p className="mt-3 text-xs text-ink-500 dark:text-slate-400">
        Difference is Set A minus Set B. It is tinted by which group is ahead,
        not by whether being ahead is a good thing.
      </p>
    </div>
  );
}

function SectionRows({ section }: { section: MetricSection }) {
  return (
    <>
      <tr>
        <td colSpan={5} className="pb-1.5 pt-4">
          <span className="text-[11px] font-bold uppercase tracking-wider text-brand-600 dark:text-brand-300">
            {section.title}
          </span>
        </td>
      </tr>

      {section.rows.map((row) => {
        // A tiny difference rounds to "-0", which reads like a mistake.
        const raw = row.a !== null && row.b !== null ? row.a - row.b : null;
        const diff = raw === null ? null : Number(raw.toFixed(row.dp));
        const suffix = row.suffix ?? "";

        return (
          <tr
            key={row.label}
            className="border-t border-brand-50 transition hover:bg-brand-50/40 dark:border-night-800 dark:hover:bg-night-800/50"
          >
            <td className="py-2.5 pr-3">
              <span className="text-ink-700 dark:text-slate-200">{row.label}</span>
              {row.note && (
                <span className="block text-[11px] text-ink-400 dark:text-slate-500">
                  {row.note}
                </span>
              )}
            </td>

            <td className="py-2.5 text-right font-bold tabular-nums text-ink-800 dark:text-slate-50">
              {show(row.a, row)}
            </td>
            <td className="py-2.5 text-right font-bold tabular-nums text-ink-800 dark:text-slate-50">
              {show(row.b, row)}
            </td>

            <td className="py-2.5 pl-4 align-middle">
              <SplitBar a={row.a} b={row.b} />
            </td>

            <td className="py-2.5 text-right">
              {diff === null ? (
                <span className="text-xs text-ink-400 dark:text-slate-500">n/a</span>
              ) : diff === 0 ? (
                <span className="inline-flex items-center rounded-full bg-brand-50 px-2 py-0.5 text-xs font-semibold text-ink-500 dark:bg-night-800 dark:text-slate-400">
                  level
                </span>
              ) : (
                <span
                  className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-bold tabular-nums ${
                    diff > 0
                      ? "bg-brand-100 text-brand-800 dark:bg-brand-500/20 dark:text-brand-200"
                      : "bg-accent-100 text-accent-800 dark:bg-accent-500/20 dark:text-accent-200"
                  }`}
                >
                  <span aria-hidden>{diff > 0 ? "▲" : "▼"}</span>
                  {diff > 0 ? "+" : ""}
                  {diff.toFixed(row.dp)}
                  {suffix}
                </span>
              )}
            </td>
          </tr>
        );
      })}
    </>
  );
}
