import type { Kpi } from "@/lib/aggregate";

function DeltaBadge({ pct }: { pct: number }) {
  const up = pct >= 0;
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold ${
        up
          ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300"
          : "bg-rose-50 text-rose-700 dark:bg-rose-500/15 dark:text-rose-300"
      }`}
    >
      <span aria-hidden>{up ? "▲" : "▼"}</span>
      {Math.abs(pct).toFixed(1)}%
      <span className="sr-only">{up ? "increase" : "decrease"}</span>
    </span>
  );
}

export default function KpiCards({ kpis }: { kpis: Kpi[] }) {
  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      {kpis.map((kpi) => (
        <div
          key={kpi.label}
          className="card relative overflow-hidden p-4 pl-5"
        >
          {/* Teal spine, echoing the wordmark. */}
          <span
            aria-hidden
            className="absolute inset-y-0 left-0 w-1 bg-brand-400 dark:bg-brand-600"
          />
          <div className="flex items-start justify-between gap-2">
            <p className="text-xs font-medium uppercase tracking-wide text-ink-500 dark:text-slate-400">
              {kpi.label}
            </p>
            {kpi.deltaPct !== null && <DeltaBadge pct={kpi.deltaPct} />}
          </div>

          <p
            className={`mt-2 text-2xl font-bold tabular-nums sm:text-3xl ${
              kpi.value === null
                ? "text-ink-400/50 dark:text-slate-600"
                : "text-ink-700 dark:text-slate-50"
            }`}
          >
            {kpi.value === null
              ? "—"
              : kpi.value.toLocaleString("en-GB") + (kpi.suffix ?? "")}
          </p>

          <p className="mt-1 text-xs leading-snug text-ink-500 dark:text-slate-400">
            {kpi.hint}
          </p>

          {kpi.empty && (
            <p className="mt-2 rounded bg-accent-50 px-2 py-1 text-[11px] leading-snug text-accent-800 dark:bg-accent-500/15 dark:text-accent-200">
              Nothing to show until this column is filled in.
            </p>
          )}
        </div>
      ))}
    </div>
  );
}
