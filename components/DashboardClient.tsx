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
  firstTimersByService,
  formatDate,
  serviceTypeCounts,
} from "@/lib/aggregate";
import type { Dataset, ServiceDay } from "@/lib/types";
import { Card } from "./ui";
import { SimpleBar, SimplePie } from "./Charts";
import KpiCards from "./KpiCards";
import Logo from "./Logo";
import RefreshButton from "./RefreshButton";
import RunChart from "./RunChart";
import ThemeToggle from "./ThemeToggle";
import { useChartTheme } from "./ThemeProvider";

type DayFilter = ServiceDay | "All";
type PeriodFilter = "all" | "12m" | string; // string = a four-digit year

/** Public response link for the attendance form, not the editor URL. */
const FORM_URL =
  "https://docs.google.com/forms/d/e/1FAIpQLScVj9KxawUSBTVCIOfLmBJFUvLFMIw1c5ZYWjslBFifJgrfwQ/viewform";

export default function DashboardClient({ dataset }: { dataset: Dataset }) {
  // Sunday by default: Sundays average about 130 and midweek services about 45,
  // so mixing them makes the median line meaningless.
  const [day, setDay] = useState<DayFilter>("Sunday");
  const [period, setPeriod] = useState<PeriodFilter>("all");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
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

  const bounds = useMemo(() => {
    const dates = dataset.services.map((s) => s.date);
    return {
      first: dates[0] ?? "",
      last: dates[dates.length - 1] ?? "",
    };
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

  // The date range narrows whatever the period already selected, so the two
  // compose rather than fight each other.
  const dateFiltered = useMemo(() => {
    if (!from && !to) return periodFiltered;
    return periodFiltered.filter(
      (s) => (!from || s.date >= from) && (!to || s.date <= to),
    );
  }, [periodFiltered, from, to]);

  const filtered = useMemo(
    () => (day === "All" ? dateFiltered : dateFiltered.filter((s) => s.day === day)),
    [dateFiltered, day],
  );

  const kpis = useMemo(() => buildKpis(filtered), [filtered]);
  const runChart = useMemo(() => buildRunChart(filtered), [filtered]);
  const monthly = useMemo(() => byMonth(filtered), [filtered]);
  const yearly = useMemo(() => byYear(filtered), [filtered]);
  const preachers = useMemo(() => byPreacher(filtered), [filtered]);
  const demo = useMemo(() => demographics(filtered), [filtered]);
  const firstTimers = useMemo(() => firstTimersByService(filtered), [filtered]);
  const serviceAverages = useMemo(() => byServiceType(dateFiltered), [dateFiltered]);
  const serviceMix = useMemo(() => serviceTypeCounts(dateFiltered), [dateFiltered]);

  const latest = dataset.services[dataset.services.length - 1];
  const scopeLabel = day === "All" ? "all services" : `${day} services`;
  const scopeWord = day === "All" ? "" : `${day} `;
  const datesActive = Boolean(from || to);

  return (
    <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:py-8">
      {/* ------------------------------------------------------- header */}
      <header className="mb-5">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Logo />
            <div>
              <p className="text-base font-bold tracking-tight text-ink-700 dark:text-slate-50">
                Attendance Dashboard
              </p>
              <p className="text-xs text-ink-500 dark:text-slate-400">
                RCCG The Brooks
                {latest ? `, latest service ${formatDate(latest.date)}` : ""}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <a
              href={FORM_URL}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 rounded-lg bg-accent-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-accent-700"
            >
              <svg
                viewBox="0 0 24 24"
                className="h-3.5 w-3.5"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden
              >
                <path d="M12 5v14M5 12h14" />
              </svg>
              Enter data
            </a>
            <RefreshButton />
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
      <div className="card mb-6 p-4">
        <div className="flex flex-wrap items-end gap-4">
          <SelectFilter
            id="service-filter"
            label="Service"
            value={day}
            onChange={(v) => setDay(v as DayFilter)}
            options={[
              ...dayOptions.map((d) => ({ value: d as string, label: d })),
              { value: "All", label: "All services" },
            ]}
          />
          <SelectFilter
            id="period-filter"
            label="Period"
            value={period}
            onChange={setPeriod}
            options={[
              { value: "all", label: "All time" },
              { value: "12m", label: "Last 12 months" },
              ...years.map((y) => ({ value: y, label: y })),
            ]}
          />
          <DateFilter
            id="from-filter"
            label="From"
            value={from}
            min={bounds.first}
            max={to || bounds.last}
            onChange={setFrom}
          />
          <DateFilter
            id="to-filter"
            label="To"
            value={to}
            min={from || bounds.first}
            max={bounds.last}
            onChange={setTo}
          />

          {datesActive && (
            <button
              type="button"
              onClick={() => {
                setFrom("");
                setTo("");
              }}
              className="rounded-lg border border-brand-200 px-3 py-2 text-xs font-medium text-ink-600 transition hover:bg-brand-50 dark:border-night-600 dark:text-slate-300 dark:hover:bg-night-700"
            >
              Clear dates
            </button>
          )}

          <p className="ml-auto pb-2 text-xs text-ink-500 dark:text-slate-400">
            Showing{" "}
            <span className="font-semibold text-ink-700 dark:text-slate-100">
              {filtered.length}
            </span>{" "}
            {scopeLabel}
          </p>
        </div>
      </div>

      {/* --------------------------------------------------------- KPIs */}
      <KpiCards kpis={kpis} />

      {/* ---------------------------------------------------- run chart */}
      <div className="mt-6">
        <Card
          title="Attendance run chart"
          subtitle={`Every ${scopeWord}service in date order, against the median. Shifts and trends are listed below the chart.`}
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
          subtitle="How many of each service type were held (ignores the service filter)"
        >
          <SimplePie data={serviceMix} />
        </Card>

        <Card
          title="Average attendance by service type"
          subtitle="Sunday against midweek (ignores the service filter)"
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
          title="First timers by service"
          subtitle="Hover a bar for the theme the service was built around"
          className="lg:col-span-2"
        >
          <SimpleBar
            data={firstTimers}
            valueLabel="First timers"
            tone="neutral"
            emptyMessage="No first timers were recorded for these services."
          />
        </Card>
      </div>
    </main>
  );
}

function SelectFilter({
  id,
  label,
  value,
  onChange,
  options,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <div className="min-w-[150px]">
      <label htmlFor={id} className={LABEL}>
        {label}
      </label>
      <select
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={FIELD}
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  );
}

function DateFilter({
  id,
  label,
  value,
  min,
  max,
  onChange,
}: {
  id: string;
  label: string;
  value: string;
  min?: string;
  max?: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="min-w-[150px]">
      <label htmlFor={id} className={LABEL}>
        {label}
      </label>
      <input
        id={id}
        type="date"
        value={value}
        min={min || undefined}
        max={max || undefined}
        onChange={(e) => onChange(e.target.value)}
        className={FIELD}
      />
    </div>
  );
}

const LABEL = "mb-1 block text-xs font-medium text-ink-600 dark:text-slate-300";
const FIELD =
  "w-full rounded-lg border border-brand-200 bg-white px-3 py-2 text-sm text-ink-700 outline-none transition focus:border-brand-400 focus:ring-2 focus:ring-brand-100 dark:border-night-600 dark:bg-night-800 dark:text-slate-100 dark:[color-scheme:dark] dark:focus:ring-brand-900";
