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
import { CHART_COLORS, EmptyChart } from "./ui";

function RunTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null;
  const p = payload[0].payload;
  return (
    <div className="max-w-[220px] rounded-lg border border-slate-200 bg-white p-3 text-xs shadow-lg">
      <p className="font-semibold text-slate-900">
        {p.day}, {p.label}
      </p>
      <p className="mt-1 text-slate-700">
        Attendance: <span className="font-semibold">{p.value}</span>
      </p>
      {p.theme && <p className="mt-1 text-slate-500">{p.theme}</p>}
      {p.preacher && <p className="text-slate-500">{p.preacher}</p>}
    </div>
  );
}

export default function RunChart({ data }: { data: RunChartResult }) {
  if (data.points.length === 0) {
    return <EmptyChart message="No services with recorded attendance in this range." />;
  }

  // Recharts needs a stable index to key shift bands off.
  const points = data.points.map((p, i) => ({ ...p, i }));

  return (
    <div>
      <div className="h-[320px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={points} margin={{ top: 8, right: 12, left: -8, bottom: 4 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
            <XAxis
              dataKey="label"
              tick={{ fontSize: 11, fill: "#64748b" }}
              tickLine={false}
              axisLine={{ stroke: "#e2e8f0" }}
              minTickGap={24}
            />
            <YAxis
              tick={{ fontSize: 11, fill: "#64748b" }}
              tickLine={false}
              axisLine={false}
              width={44}
            />
            <Tooltip content={<RunTooltip />} />
            {data.median !== null && (
              <ReferenceLine
                y={data.median}
                stroke={CHART_COLORS.median}
                strokeDasharray="5 4"
                strokeWidth={1.6}
                label={{
                  value: `Median ${data.median}`,
                  position: "insideTopRight",
                  fill: CHART_COLORS.median,
                  fontSize: 11,
                  fontWeight: 600,
                }}
              />
            )}
            <Line
              type="monotone"
              dataKey="value"
              stroke={CHART_COLORS.primary}
              strokeWidth={2}
              dot={{ r: 2.5, fill: CHART_COLORS.primary, strokeWidth: 0 }}
              activeDot={{ r: 5 }}
              isAnimationActive={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2 border-t border-slate-100 pt-3 text-xs text-slate-600">
        <span>
          <span className="font-semibold text-slate-900">{data.points.length}</span>{" "}
          services plotted
        </span>
        <span>
          <span className="font-semibold text-slate-900">{data.shifts.length}</span>{" "}
          shift{data.shifts.length === 1 ? "" : "s"}
          <span className="text-slate-400"> (6+ points one side of the median)</span>
        </span>
        <span>
          <span className="font-semibold text-slate-900">{data.trends.length}</span>{" "}
          trend{data.trends.length === 1 ? "" : "s"}
          <span className="text-slate-400"> (5+ points moving one way)</span>
        </span>
      </div>

      {(data.shifts.length > 0 || data.trends.length > 0) && (
        <ul className="mt-2 space-y-1 text-xs text-slate-600">
          {data.shifts.map((s, idx) => (
            <li key={`shift-${idx}`}>
              <span
                className={`font-semibold ${
                  s.direction === "above" ? "text-emerald-700" : "text-red-700"
                }`}
              >
                Shift {s.direction} the median
              </span>{" "}
              — {points[s.start]?.label} to {points[s.end]?.label} (
              {s.end - s.start + 1} services)
            </li>
          ))}
          {data.trends.map((t, idx) => (
            <li key={`trend-${idx}`}>
              <span
                className={`font-semibold ${
                  t.direction === "up" ? "text-emerald-700" : "text-red-700"
                }`}
              >
                {t.direction === "up" ? "Rising" : "Falling"} trend
              </span>{" "}
              — {points[t.start]?.label} to {points[t.end]?.label} (
              {t.end - t.start + 1} services)
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
