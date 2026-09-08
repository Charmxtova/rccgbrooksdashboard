import type { Kpi, KpiTone } from "@/lib/aggregate";

/**
 * Every fill is taken from the church logo: the teal wordmark, the orange
 * swoosh, the charcoal tagline, and the green and red of the RCCG roundel.
 * All seven are dark enough to carry white text at AA contrast.
 */
const TONE_FILL: Record<KpiTone, string> = {
  teal: "bg-[#2494a3]",
  deepTeal: "bg-[#23616c]",
  orange: "bg-[#ef8b24]",
  charcoal: "bg-[#58595b]",
  green: "bg-[#0f8a4d]",
  deepOrange: "bg-[#b55312]",
  red: "bg-[#c22a2f]",
};

function DeltaBadge({ pct }: { pct: number }) {
  const up = pct >= 0;
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-white/20 px-2 py-0.5 text-xs font-semibold text-white">
      <span aria-hidden>{up ? "▲" : "▼"}</span>
      {Math.abs(pct).toFixed(1)}%
      <span className="sr-only">{up ? "increase" : "decrease"}</span>
    </span>
  );
}

export default function KpiCards({ kpis }: { kpis: Kpi[] }) {
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
      {kpis.map((kpi) => (
        <div
          key={kpi.label}
          className={`rounded-xl p-4 shadow-sm ${TONE_FILL[kpi.tone]}`}
        >
          <div className="flex items-start justify-between gap-2">
            <p className="text-xs font-semibold uppercase tracking-wide text-white/85">
              {kpi.label}
            </p>
            {kpi.deltaPct !== null && <DeltaBadge pct={kpi.deltaPct} />}
          </div>

          <p className="mt-2 text-3xl font-bold tabular-nums text-white">
            {kpi.value === null
              ? "n/a"
              : kpi.value.toLocaleString("en-GB") + (kpi.suffix ?? "")}
          </p>

          <p className="mt-1 text-xs leading-snug text-white/75">{kpi.hint}</p>
        </div>
      ))}
    </div>
  );
}
