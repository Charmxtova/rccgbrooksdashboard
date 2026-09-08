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
import { useChartTheme } from "./ThemeProvider";
import { ChartTooltipShell, EmptyChart } from "./ui";

export type Tone = "primary" | "accent" | "neutral";

function BarTooltip({ active, payload, valueLabel, countLabel }: any) {
  if (!active || !payload?.length) return null;
  const p = payload[0].payload as Bucket;
  return (
    <ChartTooltipShell>
      <p className="font-semibold text-ink-700 dark:text-slate-100">{p.name}</p>
      <p className="mt-1 text-ink-600 dark:text-slate-300">
        {valueLabel}: <span className="font-semibold">{p.value}</span>
      </p>
      {p.count !== undefined && countLabel && (
        <p className="text-ink-500 dark:text-slate-400">
          {countLabel}: {p.count}
        </p>
      )}
    </ChartTooltipShell>
  );
}

export function SimpleBar({
  data,
  valueLabel,
  countLabel,
  tone = "primary",
  layout = "horizontal",
  height = 260,
  emptyMessage = "No data in this range.",
}: {
  data: Bucket[];
  valueLabel: string;
  countLabel?: string;
  tone?: Tone;
  layout?: "horizontal" | "vertical";
  height?: number;
  emptyMessage?: string;
}) {
  const t = useChartTheme();
  if (data.length === 0) return <EmptyChart message={emptyMessage} />;

  const vertical = layout === "vertical";
  const fill =
    tone === "accent" ? t.accent : tone === "neutral" ? t.children : t.primary;
  const axisTick = { fontSize: 11, fill: t.axis };

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
            stroke={t.grid}
            vertical={vertical}
            horizontal={!vertical}
          />
          {vertical ? (
            <>
              <XAxis type="number" tick={axisTick} tickLine={false} axisLine={false} />
              <YAxis
                type="category"
                dataKey="name"
                tick={axisTick}
                tickLine={false}
                axisLine={false}
                width={150}
              />
            </>
          ) : (
            <>
              <XAxis
                dataKey="name"
                tick={axisTick}
                tickLine={false}
                axisLine={{ stroke: t.axisLine }}
                minTickGap={16}
              />
              <YAxis tick={axisTick} tickLine={false} axisLine={false} width={44} />
            </>
          )}
          <Tooltip
            cursor={{ fill: t.cursor }}
            content={<BarTooltip valueLabel={valueLabel} countLabel={countLabel} />}
          />
          <Bar
            dataKey="value"
            fill={fill}
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
    <ChartTooltipShell>
      <p className="font-semibold text-ink-700 dark:text-slate-100">{p.name}</p>
      <p className="mt-1 text-ink-600 dark:text-slate-300">
        {p.value.toLocaleString("en-GB")}{" "}
        <span className="text-ink-500 dark:text-slate-400">({pct}%)</span>
      </p>
    </ChartTooltipShell>
  );
}

export function SimplePie({
  data,
  colors,
  height = 260,
  emptyMessage = "No data in this range.",
}: {
  data: Bucket[];
  /** Defaults to the themed categorical palette. */
  colors?: string[];
  height?: number;
  emptyMessage?: string;
}) {
  const t = useChartTheme();
  if (data.length === 0) return <EmptyChart message={emptyMessage} />;

  const swatches = colors ?? t.palette;
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
            stroke={t.dark ? "#0f1b1f" : "#ffffff"}
            strokeWidth={2}
            isAnimationActive={false}
          >
            {data.map((entry, i) => (
              <Cell key={entry.name} fill={swatches[i % swatches.length]} />
            ))}
          </Pie>
          <Tooltip content={<PieTooltip total={total} />} />
          <Legend
            verticalAlign="bottom"
            height={28}
            iconType="circle"
            formatter={(value: string) => (
              <span className="text-xs text-ink-600 dark:text-slate-300">{value}</span>
            )}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
