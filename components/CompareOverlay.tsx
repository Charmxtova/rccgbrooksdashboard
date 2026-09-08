"use client";

import {
  CartesianGrid,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { formatDate } from "@/lib/aggregate";
import type { GroupStats } from "@/lib/compare";
import { useChartTheme } from "./ThemeProvider";
import { ChartTooltipShell, EmptyChart } from "./ui";

interface Point {
  i: number;
  a: number | null;
  b: number | null;
}

export default function CompareOverlay({
  points,
  statsA,
  statsB,
}: {
  points: Point[];
  statsA: GroupStats;
  statsB: GroupStats;
}) {
  const t = useChartTheme();

  if (points.length === 0) {
    return <EmptyChart message="Neither group has any recorded attendance." />;
  }

  /**
   * Dots matter more than they look. Without them a group holding a single
   * service draws nothing at all, because a line needs two points to make a
   * segment. They are dropped only once the series is too dense to read them.
   */
  const dotFor = (count: number) =>
    count <= 80 ? { r: 2.5, strokeWidth: 0 } : false;

  return (
    <div>
      {/* ------------------------------------------------ summary chips */}
      <div className="mb-4 grid gap-2 sm:grid-cols-2">
        <SummaryChip
          name="Set A"
          stats={statsA}
          dotClass="bg-brand-500"
          ringClass="border-brand-200 bg-brand-50/60 dark:border-brand-500/25 dark:bg-brand-500/10"
        />
        <SummaryChip
          name="Set B"
          stats={statsB}
          dotClass="bg-accent-500"
          ringClass="border-accent-200 bg-accent-50/60 dark:border-accent-500/25 dark:bg-accent-500/10"
        />
      </div>

      <div className="h-[340px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={points} margin={{ top: 10, right: 14, left: -8, bottom: 16 }}>
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
                offset: -10,
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
            <Tooltip content={<OverlayTooltip />} cursor={{ stroke: t.axisLine }} />

            {statsA.medianAttendance !== null && (
              <ReferenceLine
                y={statsA.medianAttendance}
                stroke={t.primary}
                strokeDasharray="5 4"
                strokeWidth={1.4}
                label={{
                  value: `A median ${Math.round(statsA.medianAttendance)}`,
                  position: "insideTopLeft",
                  fill: t.primary,
                  fontSize: 10,
                  fontWeight: 700,
                }}
              />
            )}
            {statsB.medianAttendance !== null && (
              <ReferenceLine
                y={statsB.medianAttendance}
                stroke={t.accent}
                strokeDasharray="5 4"
                strokeWidth={1.4}
                label={{
                  value: `B median ${Math.round(statsB.medianAttendance)}`,
                  position: "insideBottomLeft",
                  fill: t.accent,
                  fontSize: 10,
                  fontWeight: 700,
                }}
              />
            )}

            <Line
              type="monotone"
              dataKey="a"
              name="Set A"
              stroke={t.primary}
              strokeWidth={2}
              dot={dotFor(statsA.counted)}
              activeDot={{ r: 5 }}
              connectNulls
              isAnimationActive={false}
            />
            <Line
              type="monotone"
              dataKey="b"
              name="Set B"
              stroke={t.accent}
              strokeWidth={2}
              dot={dotFor(statsB.counted)}
              activeDot={{ r: 5 }}
              connectNulls
              isAnimationActive={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* --------------------------------------------------- coverage */}
      <div className="mt-3 grid gap-2 border-t border-brand-100 pt-3 text-xs text-ink-500 sm:grid-cols-2 dark:border-night-700 dark:text-slate-400">
        <Coverage name="Set A" stats={statsA} dotClass="bg-brand-500" />
        <Coverage name="Set B" stats={statsB} dotClass="bg-accent-500" />
      </div>
    </div>
  );
}

function SummaryChip({
  name,
  stats,
  dotClass,
  ringClass,
}: {
  name: string;
  stats: GroupStats;
  dotClass: string;
  ringClass: string;
}) {
  const bits = [
    `${stats.services} ${stats.services === 1 ? "service" : "services"}`,
    stats.meanAttendance !== null ? `avg ${Math.round(stats.meanAttendance)}` : null,
    stats.medianAttendance !== null
      ? `median ${Math.round(stats.medianAttendance)}`
      : null,
  ].filter(Boolean);

  return (
    <div className={`flex items-center gap-2.5 rounded-lg border px-3 py-2 ${ringClass}`}>
      <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${dotClass}`} aria-hidden />
      <span className="text-xs font-bold text-ink-800 dark:text-slate-100">{name}</span>
      <span className="text-xs text-ink-600 dark:text-slate-300">{bits.join(" · ")}</span>
    </div>
  );
}

function Coverage({
  name,
  stats,
  dotClass,
}: {
  name: string;
  stats: GroupStats;
  dotClass: string;
}) {
  return (
    <p className="flex items-center gap-2">
      <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${dotClass}`} aria-hidden />
      <span>
        <span className="font-semibold text-ink-700 dark:text-slate-200">{name}</span>{" "}
        {stats.firstDate
          ? `covers ${formatDate(stats.firstDate)} to ${formatDate(stats.lastDate!)}`
          : "has no services in it"}
      </span>
    </p>
  );
}

function OverlayTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;

  const a = payload.find((p: any) => p.dataKey === "a")?.value ?? null;
  const b = payload.find((p: any) => p.dataKey === "b")?.value ?? null;
  const gap = a !== null && b !== null ? a - b : null;

  return (
    <ChartTooltipShell>
      <p className="font-semibold text-ink-700 dark:text-slate-100">
        Service {label} of each group
      </p>
      {payload.map((p: any) => (
        <p key={p.dataKey} className="mt-1 flex items-center gap-2">
          <span
            className="h-2 w-2 shrink-0 rounded-full"
            style={{ background: p.stroke }}
            aria-hidden
          />
          <span className="text-ink-600 dark:text-slate-300">
            {p.name}:{" "}
            <span className="font-bold text-ink-800 dark:text-slate-100">
              {p.value ?? "no service"}
            </span>
          </span>
        </p>
      ))}
      {gap !== null && gap !== 0 && (
        <p className="mt-1.5 border-t border-brand-100 pt-1.5 text-ink-500 dark:border-night-600 dark:text-slate-400">
          {Math.abs(gap)} {gap > 0 ? "more" : "fewer"} in Set A
        </p>
      )}
    </ChartTooltipShell>
  );
}
