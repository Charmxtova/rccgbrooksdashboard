"use client";

import { useMemo, useState } from "react";
import { compareInsights, groupStats, overlaySeries, type GroupStats } from "@/lib/compare";
import { applyFilters, DEFAULT_FILTERS, describeFilters, type FilterState } from "@/lib/filters";
import type { Dataset } from "@/lib/types";
import CompareInsights from "./CompareInsights";
import CoverageNote, { CoverageLine } from "./CoverageNote";
import ExportButton from "./ExportButton";
import CompareOverlay from "./CompareOverlay";
import CompareTable, { type MetricSection } from "./CompareTable";
import FilterControls from "./FilterControls";
import SiteHeader from "./SiteHeader";
import { Card } from "./ui";

/** Set A is teal, Set B is orange, matching the two logo swooshes. */
const A_TEXT = "text-brand-600 dark:text-brand-300";
const B_TEXT = "text-accent-600 dark:text-accent-400";

export default function CompareClient({ dataset }: { dataset: Dataset }) {
  const [a, setA] = useState<FilterState>({ ...DEFAULT_FILTERS, period: "2025" });
  const [b, setB] = useState<FilterState>({ ...DEFAULT_FILTERS, period: "2026" });

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
      title: "Attendance distribution",
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
          dotClass="bg-brand-500"
          label={labelA}
          count={rowsA.length}
          stats={statsA}
          services={dataset.services}
          value={a}
          onChange={setA}
          idPrefix="a"
        />
        <GroupPanel
          name="Set B"
          accent="border-l-4 border-l-accent-500"
          textClass={B_TEXT}
          dotClass="bg-accent-500"
          label={labelB}
          count={rowsB.length}
          stats={statsB}
          services={dataset.services}
          value={b}
          onChange={setB}
          idPrefix="b"
        />
      </div>

      {/* ----------------------------------------------------- insights */}
      <div className="mt-6">
        <Card title="Key insights">
          <CoverageNote
            statsA={statsA}
            statsB={statsB}
            className="mb-4 border-b border-brand-100 pb-3 dark:border-night-700"
          />
          <CompareInsights insights={insights} />
        </Card>
      </div>

      {/* ------------------------------------------------ metric table */}
      <div className="mt-6">
        <Card
          title="Side by side"
          subtitle="An n/a means that figure was never recorded for the group"
          action={
            <ExportButton
              labelA={labelA}
              labelB={labelB}
              statsA={statsA}
              statsB={statsB}
              sections={sections}
              insights={insights}
            />
          }
        >
          <CoverageNote
            statsA={statsA}
            statsB={statsB}
            className="mb-4 border-b border-brand-100 pb-3 dark:border-night-700"
          />
          <CompareTable sections={sections} />
        </Card>
      </div>

      {/* -------------------------------------------------- overlay chart */}
      <div className="mt-6">
        <Card
          title="Attendance overlaid"
          subtitle="Each group plotted in its own order, service 1 against service 1, so ranges of different lengths still line up"
        >
          <CompareOverlay points={overlay} statsA={statsA} statsB={statsB} />
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
  dotClass,
  label,
  count,
  stats,
  services,
  value,
  onChange,
  idPrefix,
}: {
  name: string;
  accent: string;
  textClass: string;
  dotClass: string;
  label: string;
  count: number;
  stats: GroupStats;
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
          {count === 1 ? "service" : "services"}
        </p>
      </div>

      <FilterControls
        services={services}
        value={value}
        onChange={onChange}
        idPrefix={idPrefix}
        compact
      />

      <div className="mt-3 space-y-1 border-t border-brand-100 pt-3 text-xs text-ink-500 dark:border-night-700 dark:text-slate-400">
        <p>{label}</p>
        <CoverageLine name={name} stats={stats} dotClass={dotClass} />
      </div>
    </section>
  );
}

