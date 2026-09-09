"use client";

import {
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import { formatDate } from "@/lib/aggregate";
import type { GroupStats } from "@/lib/compare";
import type { RadarAxis } from "@/lib/metrics";
import { useChartTheme } from "./ThemeProvider";
import { ChartTooltipShell } from "./ui";

export default function CompareRadar({
  axes,
  skipped,
  statsA,
  statsB,
}: {
  axes: RadarAxis[];
  skipped: string[];
  statsA: GroupStats;
  statsB: GroupStats;
}) {
  const t = useChartTheme();

  // Three points is the minimum that encloses an area. Fewer draws a line or a
  // dot, which reads as a broken chart rather than a thin comparison.
  if (axes.length < 3) {
    return (
      <div className="mb-4 rounded-lg border border-dashed border-brand-200 bg-brand-50/40 px-4 py-5 text-center text-sm text-ink-500 dark:border-night-600 dark:bg-night-800/50 dark:text-slate-400">
        Not enough shared indicators to draw a shape. These two groups have{" "}
        {axes.length} in common, and a radar needs at least three.
      </div>
    );
  }

  return (
    <div className="mb-5">
      <h3 className="mb-2 text-xs font-bold uppercase tracking-wider text-brand-600 dark:text-brand-300">
        Indicator profile
      </h3>

      {/* The shape and the labels ringing it both need room, so the chart grows
          with the viewport rather than sitting at one fixed height. */}
      <div className="h-[380px] w-full sm:h-[460px] lg:h-[520px]">
        <ResponsiveContainer width="100%" height="100%">
          <RadarChart
            data={axes}
            outerRadius="76%"
            /* Side margins only need to clear the longest label, and those are
               deliberately short, so the shape gets the rest of the width. */
            margin={{ top: 16, right: 44, bottom: 16, left: 44 }}
          >
            <PolarGrid stroke={t.grid} />
            <PolarAngleAxis dataKey="axis" tick={{ fontSize: 11, fill: t.axis }} />
            <PolarRadiusAxis domain={[0, 100]} tick={false} axisLine={false} />
            <Tooltip content={<RadarTooltip />} />
            <Radar
              name="Set A"
              dataKey="a"
              stroke={t.primary}
              fill={t.primary}
              fillOpacity={0.14}
              strokeWidth={2}
              dot={{ r: 2.5, strokeWidth: 0, fill: t.primary }}
              isAnimationActive={false}
            />
            <Radar
              name="Set B"
              dataKey="b"
              stroke={t.accent}
              fill={t.accent}
              fillOpacity={0.14}
              strokeWidth={2}
              dot={{ r: 2.5, strokeWidth: 0, fill: t.accent }}
              isAnimationActive={false}
            />
          </RadarChart>
        </ResponsiveContainer>
      </div>

      {/* The legend sits under the chart and carries each group's date range,
          so the colours and what they cover are read in one place. */}
      <div className="mt-3 grid gap-2 border-t border-brand-100 pt-3 sm:grid-cols-2 dark:border-night-700">
        <Key dotClass="bg-brand-500" label="Set A" stats={statsA} />
        <Key dotClass="bg-accent-500" label="Set B" stats={statsB} />
      </div>

      {skipped.length > 0 && (
        <p className="mt-2 text-[11px] text-ink-400 dark:text-slate-500">
          Left off because one group has no figure for it:{" "}
          {skipped.join(", ").toLowerCase()}.
        </p>
      )}
    </div>
  );
}

function Key({
  dotClass,
  label,
  stats,
}: {
  dotClass: string;
  label: string;
  stats: GroupStats;
}) {
  return (
    <p className="flex items-center gap-2 text-xs">
      <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${dotClass}`} aria-hidden />
      <span className="font-bold text-ink-700 dark:text-slate-100">{label}</span>
      <span className="text-ink-500 dark:text-slate-400">
        {stats.firstDate
          ? `${formatDate(stats.firstDate)} to ${formatDate(stats.lastDate!)}`
          : "no services"}
      </span>
    </p>
  );
}

function RadarTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null;
  const row = payload[0].payload as RadarAxis;
  const show = (v: number) => v.toFixed(row.dp) + row.suffix;

  return (
    <ChartTooltipShell>
      <p className="text-[10px] font-bold uppercase tracking-wider text-brand-600 dark:text-brand-300">
        {row.section}
      </p>
      <p className="font-semibold text-ink-700 dark:text-slate-100">{row.axis}</p>
      <p className="mt-1 flex items-center gap-2 text-ink-600 dark:text-slate-300">
        <span className="h-2 w-2 shrink-0 rounded-full bg-brand-500" aria-hidden />
        Set A:{" "}
        <span className="font-bold text-ink-800 dark:text-slate-100">
          {show(row.rawA)}
        </span>
      </p>
      <p className="flex items-center gap-2 text-ink-600 dark:text-slate-300">
        <span className="h-2 w-2 shrink-0 rounded-full bg-accent-500" aria-hidden />
        Set B:{" "}
        <span className="font-bold text-ink-800 dark:text-slate-100">
          {show(row.rawB)}
        </span>
      </p>
    </ChartTooltipShell>
  );
}
