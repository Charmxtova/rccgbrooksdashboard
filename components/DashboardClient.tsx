"use client";

import { useMemo, useState } from "react";
import {
  buildKpis,
  buildRunChart,
  byMonth,
  byPreacher,
  byServiceType,
  byYear,
  demographics,
  firstTimersOverTime,
  formatDate,
  serviceTypeCounts,
} from "@/lib/aggregate";
import type { Dataset, ServiceDay } from "@/lib/types";
import { CHART_COLORS, Card } from "./ui";
import { SimpleBar, SimplePie } from "./Charts";
import DataQualityPanel from "./DataQualityPanel";
import KpiCards from "./KpiCards";
import Logo from "./Logo";
import RunChart from "./RunChart";

type DayFilter = ServiceDay | "All";
type PeriodFilter = "all" | "12m" | string; // string = a four-digit year

export default function DashboardClient({
  dataset,
  sheetUrl,
}: {
  dataset: Dataset;
  sheetUrl: string;
}) {
  // Sunday by default: Sundays average ~130 and midweek services ~40, so mixing
  // them makes the median line meaningless.
  const [day, setDay] = useState<DayFilter>("Sunday");
  const [period, setPeriod] = useState<PeriodFilter>("all");

  const years = useMemo(
    () =>
      [...new Set(dataset.services.map((s) => s.date.slice(0, 4)))].sort(
        (a, b) => b.localeCompare(a),
      ),
    [dataset.services],
  );

  const dayOptions = useMemo(() => {
    const present = [...new Set(dataset.services.map((s) => s.day))];
    const ordered: ServiceDay[] = ["Sunday", "Wednesday", "Thursday", "Other"];
    return ordered.filter((d) => present.includes(d));
  }, [dataset.services]);

  const periodFiltered = useMemo(() => {
    if (period === "all") return dataset.services;
    if (period === "12m") {
      const latest = dataset.services[dataset.services.length - 1];
      if (!latest) return dataset.services;
      const cutoff = new Date(`${latest.date}T12:00:00Z`);
      cutoff.setUTCFullYear(cutoff.getUTCFullYear() - 1);
      const iso = cutoff.toISOString().slice(0, 10);
      return dataset.services.filter((s) => s.date >= iso);
    }
    return dataset.services.filter((s) => s.date.startsWith(period));
  }, [dataset.services, period]);

  const filtered = useMemo(
    () =>
      day === "All"
        ? periodFiltered
        : periodFiltered.filter((s) => s.day === day),
    [periodFiltered, day],
  );

  const kpis = useMemo(() => buildKpis(filtered), [filtered]);
  const runChart = useMemo(() => buildRunChart(filtered), [filtered]);
  const monthly = useMemo(() => byMonth(filtered), [filtered]);
  const yearly = useMemo(() => byYear(filtered), [filtered]);
  const preachers = useMemo(() => byPreacher(filtered), [filtered]);
  const demo = useMemo(() => demographics(filtered), [filtered]);
  const firstTimers = useMemo(() => firstTimersOverTime(filtered), [filtered]);
  const serviceAverages = useMemo(
    () => byServiceType(periodFiltered),
    [periodFiltered],
  );
  const serviceMix = useMemo(
    () => serviceTypeCounts(periodFiltered),
    [periodFiltered],
  );

  const latest = dataset.services[dataset.services.length - 1];
  const scopeLabel = day === "All" ? "all services" : `${day} services`;

  return (
    <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:py-8">
      {/* ------------------------------------------------------- header */}
      <header className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <Logo />
        <div className="text-right text-xs text-slate-500">
          {latest && (
            <p>
              Latest service{" "}
              <span className="font-semibold text-slate-700">
                {formatDate(latest.date)}
              </span>
            </p>
          )}
          <p className="mt-0.5">Refreshes from the sheet every 5 minutes</p>
          <form action="/api/logout" method="POST" className="mt-1">
            <button
              type="submit"
              className="font-medium text-brand-700 underline hover:text-brand-800"
            >
              Sign out
            </button>
          </form>
        </div>
      </header>

      {/* ------------------------------------------------------ filters */}
      <div className="card mb-6 flex flex-wrap items-center gap-x-6 gap-y-3 p-3 sm:p-4">
        <FilterGroup
          label="Service"
          options={[
            ...dayOptions.map((d) => ({ value: d as string, label: d })),
            { value: "All", label: "All" },
          ]}
          value={day}
          onChange={(v) => setDay(v as DayFilter)}
        />
        <FilterGroup
          label="Period"
          options={[
            { value: "all", label: "All time" },
            { value: "12m", label: "Last 12 months" },
            ...years.map((y) => ({ value: y, label: y })),
          ]}
          value={period}
          onChange={setPeriod}
        />
        <p className="ml-auto text-xs text-slate-500">
          Showing{" "}
          <span className="font-semibold text-slate-700">{filtered.length}</span>{" "}
          {scopeLabel}
        </p>
      </div>

      {/* --------------------------------------------------------- KPIs */}
      <KpiCards kpis={kpis} />

      {/* ---------------------------------------------------- run chart */}
      <div className="mt-6">
        <Card
          title="Attendance run chart"
          subtitle={`Every ${scopeLabel.replace(" services", "")} service in date order, against the median. Shifts and trends are flagged below the chart.`}
        >
          <RunChart data={runChart} />
        </Card>
      </div>

      {/* ------------------------------------------------------- charts */}
      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <Card
          title="Average attendance by month"
          subtitle={`Mean attendance per month across ${scopeLabel}`}
        >
          <SimpleBar
            data={monthly}
            valueLabel="Average attendance"
            countLabel="Services in month"
          />
        </Card>

        <Card
          title="Average attendance by year"
          subtitle={`Mean attendance per year across ${scopeLabel}`}
        >
          <SimpleBar
            data={yearly}
            valueLabel="Average attendance"
            countLabel="Services in year"
            color={CHART_COLORS.accent}
          />
        </Card>

        <Card
          title="Congregation make-up"
          subtitle={`Total men, women and children across ${scopeLabel}`}
        >
          <SimplePie
            data={demo}
            colors={[CHART_COLORS.men, CHART_COLORS.women, CHART_COLORS.children]}
          />
        </Card>

        <Card
          title="Service mix"
          subtitle="How many of each service type were held — ignores the service filter"
        >
          <SimplePie data={serviceMix} />
        </Card>

        <Card
          title="Average attendance by service type"
          subtitle="Sunday against midweek — ignores the service filter"
        >
          <SimpleBar
            data={serviceAverages}
            valueLabel="Average attendance"
            countLabel="Services held"
            color={CHART_COLORS.primary}
          />
        </Card>

        <Card
          title="Services led by preacher"
          subtitle="Top preachers by number of services, after merging name spellings"
        >
          <SimpleBar
            data={preachers}
            valueLabel="Services led"
            countLabel="Average attendance"
            color={CHART_COLORS.accent}
            layout="vertical"
            emptyMessage="No preacher was recorded for these services."
          />
        </Card>

        <Card
          title="First timers by month"
          subtitle={`Total first timers recorded across ${scopeLabel}`}
          className="lg:col-span-2"
        >
          <SimpleBar
            data={firstTimers}
            valueLabel="First timers"
            color={CHART_COLORS.children}
            emptyMessage="First timers were not recorded for these services."
          />
        </Card>
      </div>

      {/* ------------------------------------------------ data quality */}
      <div className="mt-6">
        <DataQualityPanel quality={dataset.quality} sheetUrl={sheetUrl} />
      </div>

      <footer className="mt-8 border-t border-slate-200 pt-4 text-xs text-slate-500">
        <p>
          Built from the church attendance sheet — the hand-entered report and
          the Google Form responses, combined. Attendance totals are Men + Women
          + Children.
        </p>
      </footer>
    </main>
  );
}

function FilterGroup({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: { value: string; label: string }[];
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-xs font-medium uppercase tracking-wide text-slate-500">
        {label}
      </span>
      <div className="flex flex-wrap gap-1">
        {options.map((opt) => (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(opt.value)}
            aria-pressed={value === opt.value}
            className={`rounded-md px-2.5 py-1 text-xs font-medium transition ${
              value === opt.value
                ? "bg-brand-700 text-white"
                : "bg-slate-100 text-slate-700 hover:bg-slate-200"
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  );
}
