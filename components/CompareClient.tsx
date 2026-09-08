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
import CompareInsights from "./CompareInsights";
import CompareTable, { type MetricSection } from "./CompareTable";
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

  const sections: MetricSection[] = [
    {
      title: "Attendance",
      rows: [
        { label: "Services", a: statsA.services, b: statsB.services, dp: 0 },
        {
          label: "Total attendance",
          a: statsA.totalAttendance,
          b: statsB.totalAttendance,
          dp: 0,
        },
        {
          label: "Average per service",
          a: statsA.meanAttendance,
          b: statsB.meanAttendance,
          dp: 0,
        },
        {
          label: "Median per service",
          a: medA,
          b: medB,
          dp: 0,
          note: "Unmoved by one off highs and lows",
        },
        {
          label: "Best attended",
          a: statsA.peak?.value ?? null,
          b: statsB.peak?.value ?? null,
          dp: 0,
        },
        {
          label: "Least attended",
          a: statsA.low?.value ?? null,
          b: statsB.low?.value ?? null,
          dp: 0,
        },
      ],
    },
    {
      title: "Who was in the room",
      rows: [
        { label: "Men", a: statsA.menShare, b: statsB.menShare, dp: 0, suffix: "%" },
        { label: "Women", a: statsA.womenShare, b: statsB.womenShare, dp: 0, suffix: "%" },
        {
          label: "Children",
          a: statsA.childrenShare,
          b: statsB.childrenShare,
          dp: 0,
          suffix: "%",
        },
      ],
    },
    {
      title: "Participation",
      rows: [
        {
          label: "First timers",
          a: statsA.firstTimersTotal,
          b: statsB.firstTimersTotal,
          dp: 0,
          note: `Across ${statsA.firstTimersServices} and ${statsB.firstTimersServices} services`,
        },
        {
          label: "Youth Interactive Class",
          a: statsA.youthTotal,
          b: statsB.youthTotal,
          dp: 0,
          note: `Across ${statsA.youthServices} and ${statsB.youthServices} sessions`,
        },
      ],
    },
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
          subtitle="Worked out from the two groups above. Every line restates the numbers, nothing is inferred."
        >
          <CompareInsights insights={insights} />
        </Card>
      </div>

      {/* ------------------------------------------------ metric table */}
      <div className="mt-6">
        <Card
          title="Side by side"
          subtitle="An n/a means that figure was never recorded for the group"
        >
          <CompareTable sections={sections} />
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
