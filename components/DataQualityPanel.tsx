import { formatDate } from "@/lib/aggregate";
import { UNCERTAIN } from "@/lib/preachers";
import type { DataQuality } from "@/lib/types";

const FIELD_LABELS: Record<string, string> = {
  men: "Men",
  women: "Women",
  children: "Children",
  sundaySchool: "Sunday school",
  newConverts: "New converts",
  firstTimers: "First timers",
  theme: "Theme",
  text: "Scripture text",
  preacher: "Preacher",
};

const H3 =
  "text-xs font-semibold uppercase tracking-wide text-ink-700 dark:text-slate-200";
const SUB = "mt-1 text-xs text-ink-500 dark:text-slate-400";

export default function DataQualityPanel({
  quality,
  sheetUrl,
}: {
  quality: DataQuality;
  sheetUrl: string;
}) {
  const gaps = Object.entries(quality.missingCounts)
    .filter(([, missing]) => missing > 0)
    .sort((a, b) => b[1] - a[1]);

  return (
    <details className="card group p-4 sm:p-5">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-3">
        <div>
          <h2 className="card-title">Data quality</h2>
          <p className="card-sub">
            {quality.totalMismatches.length} total mismatch
            {quality.totalMismatches.length === 1 ? "" : "es"} ·{" "}
            {quality.preacherAliases.length} preacher name
            {quality.preacherAliases.length === 1 ? "" : "s"} merged ·{" "}
            {quality.duplicates.length} duplicate
            {quality.duplicates.length === 1 ? "" : "s"} removed ·{" "}
            {gaps.length} column{gaps.length === 1 ? "" : "s"} with gaps
          </p>
        </div>
        <span className="shrink-0 text-xs font-medium text-brand-600 group-open:hidden dark:text-brand-300">
          Show
        </span>
        <span className="hidden shrink-0 text-xs font-medium text-brand-600 group-open:inline dark:text-brand-300">
          Hide
        </span>
      </summary>

      <div className="mt-5 space-y-6 border-t border-brand-100 pt-5 dark:border-night-700">
        {/* -------------------------------------------------- totals */}
        <div>
          <h3 className={H3}>Recorded total disagrees with Men + Women + Children</h3>
          <p className={SUB}>
            The dashboard uses Men + Women + Children throughout, so every chart
            agrees with the breakdown. These rows are worth correcting in the sheet.
          </p>
          {quality.totalMismatches.length === 0 ? (
            <p className="mt-3 text-sm text-ink-500 dark:text-slate-400">
              No disagreements.
            </p>
          ) : (
            <div className="mt-3 overflow-x-auto">
              <table className="w-full min-w-[460px] text-left text-xs">
                <thead className="text-ink-500 dark:text-slate-400">
                  <tr className="border-b border-brand-100 dark:border-night-700">
                    <th className="pb-2 font-medium">Date</th>
                    <th className="pb-2 font-medium">Men</th>
                    <th className="pb-2 font-medium">Women</th>
                    <th className="pb-2 font-medium">Children</th>
                    <th className="pb-2 font-medium">Sheet total</th>
                    <th className="pb-2 font-medium">Sum</th>
                    <th className="pb-2 font-medium">Gap</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-brand-50 dark:divide-night-800">
                  {quality.totalMismatches.map((m) => (
                    <tr key={`${m.date}-${m.day}`}>
                      <td className="py-2 text-ink-700 dark:text-slate-200">
                        {formatDate(m.date)}
                      </td>
                      <td className="py-2 tabular-nums text-ink-600 dark:text-slate-300">
                        {m.men}
                      </td>
                      <td className="py-2 tabular-nums text-ink-600 dark:text-slate-300">
                        {m.women}
                      </td>
                      <td className="py-2 tabular-nums text-ink-600 dark:text-slate-300">
                        {m.children}
                      </td>
                      <td className="py-2 tabular-nums text-ink-600 dark:text-slate-300">
                        {m.recordedTotal}
                      </td>
                      <td className="py-2 font-semibold tabular-nums text-ink-700 dark:text-slate-100">
                        {m.computedTotal}
                      </td>
                      <td
                        className={`py-2 font-semibold tabular-nums ${
                          Math.abs(m.recordedTotal - m.computedTotal) > 20
                            ? "text-rose-600 dark:text-rose-400"
                            : "text-accent-600 dark:text-accent-400"
                        }`}
                      >
                        {m.recordedTotal - m.computedTotal > 0 ? "+" : ""}
                        {m.recordedTotal - m.computedTotal}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* ----------------------------------------------- preachers */}
        <div>
          <h3 className={H3}>Preacher names merged</h3>
          <p className={SUB}>
            The preacher column is free text, so one person appears under several
            spellings. These were folded together — edit{" "}
            <code className="font-mono text-[11px]">lib/preachers.ts</code> to change
            any of them.
          </p>
          <ul className="mt-3 space-y-2">
            {quality.preacherAliases.map((group) => (
              <li key={group.canonical} className="text-xs">
                <span className="font-semibold text-ink-700 dark:text-slate-100">
                  {group.canonical}
                </span>
                <span className="text-ink-400 dark:text-slate-500"> ← </span>
                <span className="text-ink-600 dark:text-slate-300">
                  {group.aliases.join(" · ")}
                </span>
              </li>
            ))}
          </ul>

          {UNCERTAIN.length > 0 && (
            <div className="mt-4 rounded-lg border border-accent-200 bg-accent-50 p-3 dark:border-accent-500/30 dark:bg-accent-500/10">
              <p className="text-xs font-semibold text-accent-800 dark:text-accent-200">
                Left separate — please confirm
              </p>
              <ul className="mt-2 space-y-1.5">
                {UNCERTAIN.map((u) => (
                  <li
                    key={u.raw}
                    className="text-xs text-accent-900 dark:text-accent-100/90"
                  >
                    <span className="font-semibold">{u.raw}</span> — {u.note}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* -------------------------------------------------- gaps */}
        <div>
          <h3 className={H3}>Blank cells by column</h3>
          <p className={SUB}>
            Out of {quality.rowCount} services. Charts built on a sparse column only
            cover the services where it was filled in.
          </p>
          <div className="mt-3 space-y-2">
            {gaps.map(([field, missing]) => {
              const pct = Math.round((missing / quality.rowCount) * 100);
              return (
                <div key={field} className="flex items-center gap-3 text-xs">
                  <span className="w-28 shrink-0 text-ink-600 dark:text-slate-300">
                    {FIELD_LABELS[field] ?? field}
                  </span>
                  <div className="h-2 flex-1 overflow-hidden rounded-full bg-brand-50 dark:bg-night-800">
                    <div
                      className={`h-full rounded-full ${
                        pct >= 90
                          ? "bg-rose-400"
                          : pct >= 40
                            ? "bg-accent-400"
                            : "bg-brand-300"
                      }`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <span className="w-24 shrink-0 text-right tabular-nums text-ink-500 dark:text-slate-400">
                    {missing} blank ({pct}%)
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* --------------------------------------------- duplicates */}
        {quality.duplicates.length > 0 && (
          <div>
            <h3 className={H3}>Services recorded twice</h3>
            <p className={SUB}>
              Each is counted once on this dashboard. Rows marked{" "}
              <span className="font-medium">same sheet</span> are duplicated inside
              the attendance report itself and are worth deleting there — otherwise
              every average that anyone computes by hand will be off.
            </p>
            <ul className="mt-2 space-y-1 text-xs text-ink-600 dark:text-slate-300">
              {quality.duplicates.map((d) => (
                <li key={`${d.date}-${d.day}`} className="flex items-center gap-2">
                  <span>
                    {d.day}, {formatDate(d.date)}
                  </span>
                  <span
                    className={`rounded px-1.5 py-0.5 text-[10px] font-medium ${
                      d.kind === "within-sheet"
                        ? "bg-rose-50 text-rose-700 dark:bg-rose-500/15 dark:text-rose-300"
                        : "bg-brand-50 text-ink-600 dark:bg-night-800 dark:text-slate-300"
                    }`}
                  >
                    {d.kind === "within-sheet" ? "same sheet" : "both sheets"}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}

        <a
          href={sheetUrl}
          target="_blank"
          rel="noreferrer"
          className="inline-block text-xs font-medium text-brand-600 underline dark:text-brand-300"
        >
          Open the attendance sheet to make corrections
        </a>
      </div>
    </details>
  );
}
