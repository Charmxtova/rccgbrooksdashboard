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
import { Card } from "./ui";
import { SimpleBar, SimplePie } from "./Charts";
import DataQualityPanel from "./DataQualityPanel";
import KpiCards from "./KpiCards";
import Logo from "./Logo";
import RunChart from "./RunChart";
import ThemeToggle from "./ThemeToggle";
import { useChartTheme } from "./ThemeProvider";

type DayFilter = ServiceDay | "All";
type PeriodFilter = "all" | "12m" | string; // string = a four-digit year

export default function DashboardClient({
  dataset,
  sheetUrl,
}: {
  dataset: Dataset;
  sheetUrl: string;
}) {
  // Sunday by default: Sundays average ~130 and midweek services ~45, so mixing
  // them makes the median line meaningless.
  const [day, setDay] = useState<DayFilter>("Sunday");
  const [period, setPeriod] = useState<PeriodFilter>("all");
  const chart = useChartTheme();

  const years = useMemo(
    () =>
      [...new Set(dataset.services.map((s) => s.date.slice(0, 4)))].sort((a, b) =>
        b.localeCompare(a),
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
    () => (day === "All" ? periodFiltered : periodFiltered.filter((s) => s.day === day)),
    [periodFiltered, day],
  );

  const kpis = useMemo(() => buildKpis(filtered), [filtered]);
  const runChart = useMemo(() => buildRunChart(filtered), [filtered]);
  const monthly = useMemo(() => byMonth(filtered), [filtered]);
  const yearly = useMemo(() => byYear(filtered), [filtered]);
  const preachers = useMemo(() => byPreacher(filtered), [filtered]);
  const demo = useMemo(() => demographics(filtered), [filtered]);
  const firstTimers = useMemo(() => firstTimersOverTime(filtered), [filtered]);
  const serviceAverages = useMemo(() => byServiceType(periodFiltered), [periodFiltered]);
  const serviceMix = useMemo(() => serviceTypeCounts(periodFiltered), [periodFiltered]);

  const latest = dataset.services[dataset.services.length - 1];
  const scopeLabel = day === "All" ? "all services" : `${day} services`;

  return (
    <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:py-8">
      {/* ------------------------------------------------------- header */}
      <header className="mb-5">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Logo />
            <div className="hidden border-l border-brand-100 pl-4 sm:block dark:border-night-700">
              <p className="text-sm font-semibold text-ink-700 dark:text-slate-100">
                Attendance Dashboard
              </p>
              <p className="text-xs text-ink-500 dark:text-slate-400">
                {latest ? `Latest service ${formatDate(latest.date)}` : "No services yet"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <p className="hidden text-right text-xs text-ink-500 sm:block dark:text-slate-400">
              Refreshes from the
              <br />
              sheet every 5 minutes
            </p>
            <ThemeToggle />
            <form action="/api/logout" method="POST">
              <button
                type="submit"
                className="rounded-lg border border-brand-100 px-3 py-2 text-xs font-medium text-ink-600 transition hover:bg-brand-50 hover:text-brand-700 dark:border-night-700 dark:text-slate-300 dark:hover:bg-night-700"
              >
                Sign out
              </button>
            </form>
          </div>
        </div>
        <div className="brand-rule mt-4" />
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
        <p className="ml-auto text-xs text-ink-500 dark:text-slate-400">
          Showing{" "}
          <span className="font-semibold text-ink-700 dark:text-slate-100">
            {filtered.length}
          </span>{" "}
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
          <SimpleBar data={monthly} valueLabel="Average attendance" countLabel="Services in month" />
        </Card>

        <Card
          title="Average attendance by year"
          subtitle={`Mean attendance per year across ${scopeLabel}`}
        >
          <SimpleBar
            data={yearly}
            valueLabel="Average attendance"
            countLabel="Services in year"
            tone="accent"
          />
        </Card>

        <Card
          title="Congregation make-up"
          subtitle={`Total men, women and children across ${scopeLabel}`}
        >
          <SimplePie data={demo} colors={[chart.men, chart.women, chart.children]} />
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
            tone="accent"
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
            tone="neutral"
            emptyMessage="First timers were not recorded for these services."
          />
        </Card>
      </div>

      {/* ------------------------------------------------ data quality */}
      <div className="mt-6">
        <DataQualityPanel quality={dataset.quality} sheetUrl={sheetUrl} />
      </div>

      <footer className="mt-8 border-t border-brand-100 pt-4 text-xs text-ink-500 dark:border-night-700 dark:text-slate-400">
        <p>
          Built from the church attendance sheet — the hand-entered report and the
          Google Form responses, combined. Attendance totals are Men + Women +
          Children.
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
      <span className="text-xs font-medium uppercase tracking-wide text-ink-500 dark:text-slate-400">
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
                ? "bg-brand-500 text-white shadow-sm dark:bg-brand-600"
                : "bg-brand-50 text-ink-600 hover:bg-brand-100 dark:bg-night-800 dark:text-slate-300 dark:hover:bg-night-700"
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  );
}
