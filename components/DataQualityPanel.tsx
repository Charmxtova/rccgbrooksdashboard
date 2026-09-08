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
        <span className="shrink-0 text-xs font-medium text-brand-700 group-open:hidden">
          Show
        </span>
        <span className="hidden shrink-0 text-xs font-medium text-brand-700 group-open:inline">
          Hide
        </span>
      </summary>

      <div className="mt-5 space-y-6 border-t border-slate-100 pt-5">
        {/* -------------------------------------------------- totals */}
        <div>
          <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-700">
            Recorded total disagrees with Men + Women + Children
          </h3>
          <p className="mt-1 text-xs text-slate-500">
            The dashboard uses Men + Women + Children throughout, so every chart
            agrees with the breakdown. These rows are worth correcting in the sheet.
          </p>
          {quality.totalMismatches.length === 0 ? (
            <p className="mt-3 text-sm text-slate-500">No disagreements.</p>
          ) : (
            <div className="mt-3 overflow-x-auto">
              <table className="w-full min-w-[460px] text-left text-xs">
                <thead className="text-slate-500">
                  <tr className="border-b border-slate-200">
                    <th className="pb-2 font-medium">Date</th>
                    <th className="pb-2 font-medium">Men</th>
                    <th className="pb-2 font-medium">Women</th>
                    <th className="pb-2 font-medium">Children</th>
                    <th className="pb-2 font-medium">Sheet total</th>
                    <th className="pb-2 font-medium">Sum</th>
                    <th className="pb-2 font-medium">Gap</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {quality.totalMismatches.map((m) => (
                    <tr key={`${m.date}-${m.day}`}>
                      <td className="py-2 text-slate-900">{formatDate(m.date)}</td>
                      <td className="py-2 tabular-nums text-slate-600">{m.men}</td>
                      <td className="py-2 tabular-nums text-slate-600">{m.women}</td>
                      <td className="py-2 tabular-nums text-slate-600">
                        {m.children}
                      </td>
                      <td className="py-2 tabular-nums text-slate-600">
                        {m.recordedTotal}
                      </td>
                      <td className="py-2 font-semibold tabular-nums text-slate-900">
                        {m.computedTotal}
                      </td>
                      <td
                        className={`py-2 font-semibold tabular-nums ${
                          Math.abs(m.recordedTotal - m.computedTotal) > 20
                            ? "text-red-600"
                            : "text-amber-600"
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
          <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-700">
            Preacher names merged
          </h3>
          <p className="mt-1 text-xs text-slate-500">
            The preacher column is free text, so one person appears under several
            spellings. These were folded together — edit{" "}
            <code className="font-mono text-[11px]">lib/preachers.ts</code> to change
            any of them.
          </p>
          <ul className="mt-3 space-y-2">
            {quality.preacherAliases.map((group) => (
              <li key={group.canonical} className="text-xs">
                <span className="font-semibold text-slate-900">
                  {group.canonical}
                </span>
                <span className="text-slate-400"> ← </span>
                <span className="text-slate-600">{group.aliases.join(" · ")}</span>
              </li>
            ))}
          </ul>

          {UNCERTAIN.length > 0 && (
            <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-3">
              <p className="text-xs font-semibold text-amber-900">
                Left separate — please confirm
              </p>
              <ul className="mt-2 space-y-1.5">
                {UNCERTAIN.map((u) => (
                  <li key={u.raw} className="text-xs text-amber-900">
                    <span className="font-semibold">{u.raw}</span> — {u.note}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* -------------------------------------------------- gaps */}
        <div>
          <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-700">
            Blank cells by column
          </h3>
          <p className="mt-1 text-xs text-slate-500">
            Out of {quality.rowCount} services. Charts built on a sparse column
            only cover the services where it was filled in.
          </p>
          <div className="mt-3 space-y-2">
            {gaps.map(([field, missing]) => {
              const pct = Math.round((missing / quality.rowCount) * 100);
              return (
                <div key={field} className="flex items-center gap-3 text-xs">
                  <span className="w-28 shrink-0 text-slate-600">
                    {FIELD_LABELS[field] ?? field}
                  </span>
                  <div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-100">
                    <div
                      className={`h-full rounded-full ${
                        pct >= 90
                          ? "bg-red-400"
                          : pct >= 40
                            ? "bg-amber-400"
                            : "bg-slate-300"
                      }`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <span className="w-24 shrink-0 text-right tabular-nums text-slate-500">
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
            <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-700">
              Services recorded twice
            </h3>
            <p className="mt-1 text-xs text-slate-500">
              Each is counted once on this dashboard. Rows marked{" "}
              <span className="font-medium">same sheet</span> are duplicated
              inside the attendance report itself and are worth deleting there —
              otherwise every average that anyone computes by hand will be off.
            </p>
            <ul className="mt-2 space-y-1 text-xs text-slate-600">
              {quality.duplicates.map((d) => (
                <li key={`${d.date}-${d.day}`} className="flex items-center gap-2">
                  <span>
                    {d.day}, {formatDate(d.date)}
                  </span>
                  <span
                    className={`rounded px-1.5 py-0.5 text-[10px] font-medium ${
                      d.kind === "within-sheet"
                        ? "bg-red-50 text-red-700"
                        : "bg-slate-100 text-slate-600"
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
          className="inline-block text-xs font-medium text-brand-700 underline"
        >
          Open the attendance sheet to make corrections
        </a>
      </div>
    </details>
  );
}
