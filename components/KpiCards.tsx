import type { Kpi, KpiTone } from "@/lib/aggregate";

/**
 * Fills come from the church logo and the RCCG roundel. Every one was checked
 * against white text and clears 4.5:1, the WCAG AA threshold for body text.
 * The lighter teal and orange of the logo itself sit at 3.6:1 and 2.5:1, so
 * they are darkened here rather than used raw.
 *
 * The three share cards use the same teal, orange and charcoal as the
 * congregation pie, so the card and the chart read as one split.
 */
const TONE_FILL: Record<KpiTone, string> = {
  deepTeal: "bg-[#1d5560]",
  navy: "bg-[#1f4e79]",
  green: "bg-[#0d7a44]",
  plum: "bg-[#7a3560]",
  red: "bg-[#b3262b]",
  amber: "bg-[#7a3f0c]",
  shareMen: "bg-[#1f7f8c]",
  shareWomen: "bg-[#ad5a0a]",
  shareChildren: "bg-[#4f5052]",
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
