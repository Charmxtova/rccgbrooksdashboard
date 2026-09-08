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
import type { RunChartResult } from "@/lib/aggregate";
import { useChartTheme } from "./ThemeProvider";
import { ChartTooltipShell, EmptyChart } from "./ui";

function RunTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null;
  const p = payload[0].payload;
  return (
    <ChartTooltipShell>
      <p className="font-semibold text-ink-700 dark:text-slate-100">
        {p.day}, {p.label}
      </p>
      <p className="mt-1 text-ink-600 dark:text-slate-300">
        Attendance: <span className="font-semibold">{p.value}</span>
      </p>
      {p.theme && <p className="mt-1 text-ink-500 dark:text-slate-400">{p.theme}</p>}
      {p.preacher && <p className="text-ink-500 dark:text-slate-400">{p.preacher}</p>}
    </ChartTooltipShell>
  );
}

export default function RunChart({ data }: { data: RunChartResult }) {
  const t = useChartTheme();

  if (data.points.length === 0) {
    return <EmptyChart message="No services with recorded attendance in this range." />;
  }

  const points = data.points.map((p, i) => ({ ...p, i }));
  const good = t.dark ? "text-emerald-400" : "text-emerald-700";
  const bad = t.dark ? "text-rose-400" : "text-rose-700";

  return (
    <div>
      <div className="h-[320px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={points} margin={{ top: 8, right: 12, left: -8, bottom: 4 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={t.grid} vertical={false} />
            <XAxis
              dataKey="label"
              tick={{ fontSize: 11, fill: t.axis }}
              tickLine={false}
              axisLine={{ stroke: t.axisLine }}
              minTickGap={24}
            />
            <YAxis
              tick={{ fontSize: 11, fill: t.axis }}
              tickLine={false}
              axisLine={false}
              width={44}
            />
            <Tooltip content={<RunTooltip />} />
            {data.median !== null && (
              <ReferenceLine
                y={data.median}
                stroke={t.median}
                strokeDasharray="5 4"
                strokeWidth={1.6}
                label={{
                  value: `Median ${data.median}`,
                  position: "insideTopRight",
                  fill: t.median,
                  fontSize: 11,
                  fontWeight: 600,
                }}
              />
            )}
            <Line
              type="monotone"
              dataKey="value"
              stroke={t.primary}
              strokeWidth={2}
              dot={{ r: 2.5, fill: t.primary, strokeWidth: 0 }}
              activeDot={{ r: 5 }}
              isAnimationActive={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2 border-t border-brand-100 pt-3 text-xs text-ink-600 dark:border-night-700 dark:text-slate-300">
        <span>
          <span className="font-semibold text-ink-700 dark:text-slate-100">
            {data.points.length}
          </span>{" "}
          services plotted
        </span>
        <span>
          <span className="font-semibold text-ink-700 dark:text-slate-100">
            {data.shifts.length}
          </span>{" "}
          shift{data.shifts.length === 1 ? "" : "s"}
          <span className="text-ink-400 dark:text-slate-500">
            {" "}
            (6+ points one side of the median)
          </span>
        </span>
        <span>
          <span className="font-semibold text-ink-700 dark:text-slate-100">
            {data.trends.length}
          </span>{" "}
          trend{data.trends.length === 1 ? "" : "s"}
          <span className="text-ink-400 dark:text-slate-500">
            {" "}
            (5+ points moving one way)
          </span>
        </span>
      </div>

      {(data.shifts.length > 0 || data.trends.length > 0) && (
        <ul className="mt-2 space-y-1 text-xs text-ink-600 dark:text-slate-300">
          {data.shifts.map((s, idx) => (
            <li key={`shift-${idx}`}>
              <span
                className={`font-semibold ${s.direction === "above" ? good : bad}`}
              >
                Shift {s.direction} the median
              </span>{" "}
              — {points[s.start]?.label} to {points[s.end]?.label} (
              {s.end - s.start + 1} services)
            </li>
          ))}
          {data.trends.map((tr, idx) => (
            <li key={`trend-${idx}`}>
              <span className={`font-semibold ${tr.direction === "up" ? good : bad}`}>
                {tr.direction === "up" ? "Rising" : "Falling"} trend
              </span>{" "}
              — {points[tr.start]?.label} to {points[tr.end]?.label} (
              {tr.end - tr.start + 1} services)
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
