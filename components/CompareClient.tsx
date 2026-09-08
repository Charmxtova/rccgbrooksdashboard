"use client";

import { useMemo, useState } from "react";
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { formatDate, median } from "@/lib/aggregate";
import { compareInsights, groupStats, overlaySeries } from "@/lib/compare";
import { applyFilters, DEFAULT_FILTERS, describeFilters, type FilterState } from "@/lib/filters";
import type { Dataset } from "@/lib/types";
import FilterControls from "./FilterControls";
import SiteHeader from "./SiteHeader";
import { useChartTheme } from "./ThemeProvider";
import { Card, ChartTooltipShell, EmptyChart } from "./ui";

/** Set A is teal, Set B is orange, matching the two logo swooshes. */
const A_TEXT = "text-brand-600 dark:text-brand-300";
const B_TEXT = "text-accent-600 dark:text-accent-400";

export default function CompareClient({ dataset }: { dataset: Dataset }) {
  const [a, setA] = useState<FilterState>({ ...DEFAULT_FILTERS, period: "2025" });
  const [b, setB] = useState<FilterState>({ ...DEFAULT_FILTERS, period: "2026" });
  const t = useChartTheme();

  const rowsA = useMemo(() => applyFilters(dataset.services, a), [dataset.services, a]);
  const rowsB = useMemo(() => applyFilters(dataset.services, b), [dataset.services, b]);

  const statsA = useMemo(() => groupStats(rowsA), [rowsA]);
  const statsB = useMemo(() => groupStats(rowsB), [rowsB]);

  const labelA = describeFilters(a);
  const labelB = describeFilters(b);

  const insights = useMemo(
    () => compareInsights(statsA, statsB, "Set A", "Set B"),
    [statsA, statsB],
  );

  const overlay = useMemo(() => overlaySeries(rowsA, rowsB), [rowsA, rowsB]);
  const medA = statsA.medianAttendance;
  const medB = statsB.medianAttendance;

  const rows: MetricRow[] = [
    { label: "Services", a: statsA.services, b: statsB.services, dp: 0 },
    { label: "Total attendance", a: statsA.totalAttendance, b: statsB.totalAttendance, dp: 0 },
    { label: "Average per service", a: statsA.meanAttendance, b: statsB.meanAttendance, dp: 0 },
    { label: "Median per service", a: medA, b: medB, dp: 0 },
    { label: "Best attended", a: statsA.peak?.value ?? null, b: statsB.peak?.value ?? null, dp: 0 },
    { label: "Least attended", a: statsA.low?.value ?? null, b: statsB.low?.value ?? null, dp: 0 },
    { label: "Men share", a: statsA.menShare, b: statsB.menShare, dp: 0, suffix: "%" },
    { label: "Women share", a: statsA.womenShare, b: statsB.womenShare, dp: 0, suffix: "%" },
    { label: "Children share", a: statsA.childrenShare, b: statsB.childrenShare, dp: 0, suffix: "%" },
    { label: "First timers", a: statsA.firstTimersTotal, b: statsB.firstTimersTotal, dp: 0 },
    { label: "Youth Interactive Class", a: statsA.youthTotal, b: statsB.youthTotal, dp: 0 },
  ];

  return (
    <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:py-8">
      <SiteHeader
        title="Compare"
        latestDate={dataset.services[dataset.services.length - 1]?.date ?? null}
        current="/compare"
      />

      <p className="mb-5 max-w-3xl text-sm text-ink-600 dark:text-slate-300">
        Set up two groups of services and put them side by side. Each group uses the
        same filters as the dashboard, so you can weigh one year against another,
        Sundays against midweek, or any two stretches of time.
      </p>

      {/* ------------------------------------------------- group pickers */}
      <div className="grid gap-4 lg:grid-cols-2">
        <GroupPanel
          name="Set A"
          accent="border-l-4 border-l-brand-500"
          textClass={A_TEXT}
          label={labelA}
          count={rowsA.length}
          services={dataset.services}
          value={a}
          onChange={setA}
          idPrefix="a"
        />
        <GroupPanel
          name="Set B"
          accent="border-l-4 border-l-accent-500"
          textClass={B_TEXT}
          label={labelB}
          count={rowsB.length}
          services={dataset.services}
          value={b}
          onChange={setB}
          idPrefix="b"
        />
      </div>

      {/* ----------------------------------------------------- insights */}
      <div className="mt-6">
        <Card
          title="Key insights"
          subtitle="Worked out from the two groups below. Every line restates the numbers, nothing is inferred."
        >
          {insights.length === 0 ? (
            <p className="text-sm text-ink-500 dark:text-slate-400">
              The two groups are too similar to draw anything out of.
            </p>
          ) : (
            <ul className="space-y-2">
              {insights.map((insight, i) => (
                <li key={i} className="flex gap-2.5 text-sm">
                  <InsightMark kind={insight.kind} />
                  <span className="text-ink-700 dark:text-slate-200">{insight.text}</span>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      {/* ------------------------------------------------ metric table */}
      <div className="mt-6">
        <Card
          title="Side by side"
          subtitle="A blank cell means that figure was never recorded for the group"
        >
          <div className="overflow-x-auto">
            <table className="w-full min-w-[520px] text-left text-sm">
              <thead>
                <tr className="border-b border-brand-100 text-xs uppercase tracking-wide text-ink-500 dark:border-night-700 dark:text-slate-400">
                  <th className="pb-2 font-medium">Metric</th>
                  <th className={`pb-2 text-right font-semibold ${A_TEXT}`}>Set A</th>
                  <th className={`pb-2 text-right font-semibold ${B_TEXT}`}>Set B</th>
                  <th className="pb-2 text-right font-medium">Difference</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-brand-50 dark:divide-night-800">
                {rows.map((row) => (
                  <MetricLine key={row.label} row={row} />
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>

      {/* -------------------------------------------------- overlay chart */}
      <div className="mt-6">
        <Card
          title="Attendance overlaid"
          subtitle="Each group plotted in its own order, service 1 against service 1, so ranges of different lengths still line up. Dashed lines are each group's median."
        >
          {overlay.length === 0 ? (
            <EmptyChart message="Neither group has any recorded attendance." />
          ) : (
            <div className="h-[340px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={overlay} margin={{ top: 8, right: 12, left: -8, bottom: 4 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={t.grid} vertical={false} />
                  <XAxis
                    dataKey="i"
                    tick={{ fontSize: 11, fill: t.axis }}
                    tickLine={false}
                    axisLine={{ stroke: t.axisLine }}
                    minTickGap={20}
                    label={{
                      value: "Service number within each group",
                      position: "insideBottom",
                      offset: -2,
                      fill: t.axis,
                      fontSize: 11,
                    }}
                  />
                  <YAxis
                    tick={{ fontSize: 11, fill: t.axis }}
                    tickLine={false}
                    axisLine={false}
                    width={44}
                  />
                  <Tooltip content={<OverlayTooltip />} />
                  <Legend
                    verticalAlign="top"
                    height={26}
                    iconType="plainline"
                    formatter={(v: string) => (
                      <span className="text-xs text-ink-600 dark:text-slate-300">{v}</span>
                    )}
                  />
                  {medA !== null && (
                    <ReferenceLine y={medA} stroke={t.primary} strokeDasharray="5 4" strokeWidth={1.4} />
                  )}
                  {medB !== null && (
                    <ReferenceLine y={medB} stroke={t.accent} strokeDasharray="5 4" strokeWidth={1.4} />
                  )}
                  <Line
                    type="monotone"
                    dataKey="a"
                    name="Set A"
                    stroke={t.primary}
                    strokeWidth={2}
                    dot={false}
                    connectNulls
                    isAnimationActive={false}
                  />
                  <Line
                    type="monotone"
                    dataKey="b"
                    name="Set B"
                    stroke={t.accent}
                    strokeWidth={2}
                    dot={false}
                    connectNulls
                    isAnimationActive={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}

          <p className="mt-3 border-t border-brand-100 pt-3 text-xs text-ink-500 dark:border-night-700 dark:text-slate-400">
            Set A covers{" "}
            {statsA.firstDate
              ? `${formatDate(statsA.firstDate)} to ${formatDate(statsA.lastDate!)}`
              : "nothing"}
            . Set B covers{" "}
            {statsB.firstDate
              ? `${formatDate(statsB.firstDate)} to ${formatDate(statsB.lastDate!)}`
              : "nothing"}
            .
          </p>
        </Card>
      </div>
    </main>
  );
}

/* ------------------------------------------------------------- pieces */

function GroupPanel({
  name,
  accent,
  textClass,
  label,
  count,
  services,
  value,
  onChange,
  idPrefix,
}: {
  name: string;
  accent: string;
  textClass: string;
  label: string;
  count: number;
  services: Dataset["services"];
  value: FilterState;
  onChange: (f: FilterState) => void;
  idPrefix: string;
}) {
  return (
    <section className={`card p-4 ${accent}`}>
      <div className="mb-3 flex items-baseline justify-between gap-3">
        <h2 className={`text-sm font-bold ${textClass}`}>{name}</h2>
        <p className="text-xs text-ink-500 dark:text-slate-400">
          <span className="font-semibold text-ink-700 dark:text-slate-100">{count}</span>{" "}
          services
        </p>
      </div>
      <FilterControls
        services={services}
        value={value}
        onChange={onChange}
        idPrefix={idPrefix}
        compact
      />
      <p className="mt-3 text-xs text-ink-500 dark:text-slate-400">{label}</p>
    </section>
  );
}

interface MetricRow {
  label: string;
  a: number | null;
  b: number | null;
  dp: number;
  suffix?: string;
}

function MetricLine({ row }: { row: MetricRow }) {
  const show = (v: number | null) =>
    v === null ? "n/a" : v.toFixed(row.dp) + (row.suffix ?? "");

  const diff = row.a !== null && row.b !== null ? row.a - row.b : null;
  // A tiny negative difference rounds to "-0%", which reads like a mistake.
  const rounded = diff === null ? null : Number(diff.toFixed(row.dp));
  const diffText =
    rounded === null
      ? "n/a"
      : rounded === 0
        ? `0${row.suffix ?? ""}`
        : `${rounded > 0 ? "+" : ""}${rounded.toFixed(row.dp)}${row.suffix ?? ""}`;

  return (
    <tr>
      <td className="py-2 text-ink-700 dark:text-slate-200">{row.label}</td>
      <td className="py-2 text-right font-semibold tabular-nums text-ink-800 dark:text-slate-100">
        {show(row.a)}
      </td>
      <td className="py-2 text-right font-semibold tabular-nums text-ink-800 dark:text-slate-100">
        {show(row.b)}
      </td>
      <td
        className={`py-2 text-right font-semibold tabular-nums ${
          rounded === null || rounded === 0
            ? "text-ink-400 dark:text-slate-500"
            : rounded > 0
              ? "text-emerald-600 dark:text-emerald-400"
              : "text-amber-600 dark:text-amber-400"
        }`}
      >
        {diffText}
      </td>
    </tr>
  );
}

function InsightMark({ kind }: { kind: string }) {
  const map: Record<string, { glyph: string; className: string; label: string }> = {
    up: { glyph: "▲", className: "text-emerald-600 dark:text-emerald-400", label: "higher" },
    down: { glyph: "▼", className: "text-amber-600 dark:text-amber-400", label: "lower" },
    flat: { glyph: "=", className: "text-ink-400 dark:text-slate-500", label: "level" },
    note: { glyph: "•", className: "text-brand-500", label: "note" },
    warn: { glyph: "!", className: "text-rose-600 dark:text-rose-400", label: "caution" },
  };
  const m = map[kind] ?? map.note;
  return (
    <span className={`mt-0.5 shrink-0 font-bold ${m.className}`} aria-hidden>
      {m.glyph}
      <span className="sr-only">{m.label}</span>
    </span>
  );
}

function OverlayTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <ChartTooltipShell>
      <p className="font-semibold text-ink-700 dark:text-slate-100">Service {label}</p>
      {payload.map((p: any) => (
        <p key={p.dataKey} className="mt-1" style={{ color: p.stroke }}>
          {p.name}: <span className="font-semibold">{p.value ?? "n/a"}</span>
        </p>
      ))}
    </ChartTooltipShell>
  );
}
