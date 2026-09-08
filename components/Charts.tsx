"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { Bucket } from "@/lib/aggregate";
import { CHART_COLORS, EmptyChart, PIE_PALETTE } from "./ui";

const AXIS = { fontSize: 11, fill: "#64748b" };

function BarTooltip({ active, payload, valueLabel, countLabel }: any) {
  if (!active || !payload?.length) return null;
  const p = payload[0].payload as Bucket;
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-3 text-xs shadow-lg">
      <p className="font-semibold text-slate-900">{p.name}</p>
      <p className="mt-1 text-slate-700">
        {valueLabel}: <span className="font-semibold">{p.value}</span>
      </p>
      {p.count !== undefined && countLabel && (
        <p className="text-slate-500">
          {countLabel}: {p.count}
        </p>
      )}
    </div>
  );
}

export function SimpleBar({
  data,
  valueLabel,
  countLabel,
  color = CHART_COLORS.primary,
  layout = "horizontal",
  height = 260,
  emptyMessage = "No data in this range.",
}: {
  data: Bucket[];
  valueLabel: string;
  countLabel?: string;
  color?: string;
  layout?: "horizontal" | "vertical";
  height?: number;
  emptyMessage?: string;
}) {
  if (data.length === 0) return <EmptyChart message={emptyMessage} />;

  const vertical = layout === "vertical";

  return (
    <div style={{ height }} className="w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          layout={layout}
          margin={
            vertical
              ? { top: 4, right: 16, left: 8, bottom: 4 }
              : { top: 4, right: 8, left: -12, bottom: 4 }
          }
        >
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="#e2e8f0"
            vertical={vertical}
            horizontal={!vertical}
          />
          {vertical ? (
            <>
              <XAxis type="number" tick={AXIS} tickLine={false} axisLine={false} />
              <YAxis
                type="category"
                dataKey="name"
                tick={AXIS}
                tickLine={false}
                axisLine={false}
                width={150}
              />
            </>
          ) : (
            <>
              <XAxis
                dataKey="name"
                tick={AXIS}
                tickLine={false}
                axisLine={{ stroke: "#e2e8f0" }}
                minTickGap={16}
              />
              <YAxis tick={AXIS} tickLine={false} axisLine={false} width={44} />
            </>
          )}
          <Tooltip
            cursor={{ fill: "rgba(148,163,184,0.12)" }}
            content={
              <BarTooltip valueLabel={valueLabel} countLabel={countLabel} />
            }
          />
          <Bar
            dataKey="value"
            fill={color}
            radius={vertical ? [0, 4, 4, 0] : [4, 4, 0, 0]}
            isAnimationActive={false}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

function PieTooltip({ active, payload, total }: any) {
  if (!active || !payload?.length) return null;
  const p = payload[0].payload as Bucket;
  const pct = total > 0 ? ((p.value / total) * 100).toFixed(1) : "0";
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-3 text-xs shadow-lg">
      <p className="font-semibold text-slate-900">{p.name}</p>
      <p className="mt-1 text-slate-700">
        {p.value.toLocaleString("en-GB")}{" "}
        <span className="text-slate-500">({pct}%)</span>
      </p>
    </div>
  );
}

export function SimplePie({
  data,
  colors = PIE_PALETTE,
  height = 260,
  emptyMessage = "No data in this range.",
}: {
  data: Bucket[];
  colors?: string[];
  height?: number;
  emptyMessage?: string;
}) {
  if (data.length === 0) return <EmptyChart message={emptyMessage} />;
  const total = data.reduce((a, b) => a + b.value, 0);

  return (
    <div style={{ height }} className="w-full">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            dataKey="value"
            nameKey="name"
            cx="50%"
            cy="46%"
            innerRadius="52%"
            outerRadius="76%"
            paddingAngle={2}
            isAnimationActive={false}
          >
            {data.map((entry, i) => (
              <Cell key={entry.name} fill={colors[i % colors.length]} />
            ))}
          </Pie>
          <Tooltip content={<PieTooltip total={total} />} />
          <Legend
            verticalAlign="bottom"
            height={28}
            iconType="circle"
            formatter={(value: string) => (
              <span className="text-xs text-slate-600">{value}</span>
            )}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
