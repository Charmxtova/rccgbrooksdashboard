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
  medianByMonth,
  serviceTypeCounts,
} from "@/lib/aggregate";
import {
  applyExceptDay,
  applyFilters,
  DEFAULT_FILTERS,
  type FilterState,
} from "@/lib/filters";
import type { Dataset } from "@/lib/types";
import { Card } from "./ui";
import { SimpleBar, SimplePie } from "./Charts";
import FilterControls from "./FilterControls";
import InstallApp from "./InstallApp";
import KpiCards from "./KpiCards";
import RunChart from "./RunChart";
import SiteHeader from "./SiteHeader";
import { useChartTheme } from "./ThemeProvider";

export default function DashboardClient({ dataset }: { dataset: Dataset }) {
  const [filters, setFilters] = useState<FilterState>(DEFAULT_FILTERS);
  const chart = useChartTheme();

  // The service mix and the average by service type both need to see every
  // kind of service, so they stop before the service filter is applied.
  const exceptDay = useMemo(
    () => applyExceptDay(dataset.services, filters),
    [dataset.services, filters],
  );
  const filtered = useMemo(
    () => applyFilters(dataset.services, filters),
    [dataset.services, filters],
  );

  const kpis = useMemo(() => buildKpis(filtered), [filtered]);
  const runChart = useMemo(() => buildRunChart(filtered), [filtered]);
  const monthly = useMemo(() => byMonth(filtered), [filtered]);
  const monthlyMedian = useMemo(() => medianByMonth(filtered), [filtered]);
  const yearly = useMemo(() => byYear(filtered), [filtered]);
  const preachers = useMemo(() => byPreacher(filtered), [filtered]);
  const demo = useMemo(() => demographics(filtered), [filtered]);
  const firstTimers = useMemo(() => firstTimersByService(filtered), [filtered]);
  const serviceAverages = useMemo(() => byServiceType(exceptDay), [exceptDay]);
  const serviceMix = useMemo(() => serviceTypeCounts(exceptDay), [exceptDay]);

  const latest = dataset.services[dataset.services.length - 1];
  const scopeLabel =
    filters.day === "All" ? "all services" : `${filters.day} services`;
  const scopeWord = filters.day === "All" ? "" : `${filters.day} `;

  return (
    <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:py-8">
      <SiteHeader
        title="Attendance Dashboard"
        latestDate={latest?.date ?? null}
        current="/"
      />

      <InstallApp />

      {/* ------------------------------------------------------ filters */}
      <div className="card mb-6 p-4">
        <FilterControls
          services={dataset.services}
          value={filters}
          onChange={setFilters}
          idPrefix="dash"
        />
        <p className="mt-3 text-right text-xs text-ink-500 dark:text-slate-400">
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
          title="Median attendance by month"
          subtitle={`Median attendance per month across ${scopeLabel}. Unmoved by a single unusually large or small service.`}
        >
          <SimpleBar
            data={monthlyMedian}
            valueLabel="Median attendance"
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

        <Card title="Services led by preacher" subtitle="Preachers by numbers of services">
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
