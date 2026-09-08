import type { Kpi } from "@/lib/aggregate";

function DeltaBadge({ pct }: { pct: number }) {
  const up = pct >= 0;
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold ${
        up ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"
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
        <div key={kpi.label} className="card p-4">
          <div className="flex items-start justify-between gap-2">
            <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
              {kpi.label}
            </p>
            {kpi.deltaPct !== null && <DeltaBadge pct={kpi.deltaPct} />}
          </div>

          <p
            className={`mt-2 text-2xl font-bold tabular-nums sm:text-3xl ${
              kpi.value === null ? "text-slate-300" : "text-slate-900"
            }`}
          >
            {kpi.value === null
              ? "—"
              : kpi.value.toLocaleString("en-GB") + (kpi.suffix ?? "")}
          </p>

          <p className="mt-1 text-xs leading-snug text-slate-500">{kpi.hint}</p>

          {kpi.empty && (
            <p className="mt-2 rounded bg-amber-50 px-2 py-1 text-[11px] leading-snug text-amber-800">
              Nothing to show until this column is filled in.
            </p>
          )}
        </div>
      ))}
    </div>
  );
}
