"use client";

import { useMemo } from "react";
import {
  activeMonth,
  formatMonthLong,
  monthOptions,
  type FilterState,
} from "@/lib/filters";
import type { ServiceDay, ServiceRecord } from "@/lib/types";

const LABEL = "mb-1 block text-xs font-medium text-ink-600 dark:text-slate-300";
const FIELD =
  "w-full rounded-lg border border-brand-200 bg-white px-3 py-2 text-sm text-ink-700 outline-none transition focus:border-brand-400 focus:ring-2 focus:ring-brand-100 dark:border-night-600 dark:bg-night-800 dark:text-slate-100 dark:[color-scheme:dark] dark:focus:ring-brand-900";

export default function FilterControls({
  services,
  value,
  onChange,
  idPrefix,
  compact = false,
}: {
  /** The full dataset, so the dropdowns can offer only what exists. */
  services: ServiceRecord[];
  value: FilterState;
  onChange: (next: FilterState) => void;
  /** Keeps input ids unique when two panels sit on one page. */
  idPrefix: string;
  /** Drops the date inputs onto their own row, for narrow side by side panels. */
  compact?: boolean;
}) {
  const set = <K extends keyof FilterState>(key: K, v: FilterState[K]) =>
    onChange({ ...value, [key]: v });

  const years = useMemo(
    () => [...new Set(services.map((s) => s.date.slice(0, 4)))].sort((a, b) => b.localeCompare(a)),
    [services],
  );

  const dayOptions = useMemo(() => {
    const present = [...new Set(services.map((s) => s.day))];
    const ordered: ServiceDay[] = ["Sunday", "Wednesday", "Thursday", "Other"];
    return ordered.filter((d) => present.includes(d));
  }, [services]);

  const months = useMemo(
    () => monthOptions(services, value.period),
    [services, value.period],
  );
  const month = activeMonth(services, value);

  const bounds = useMemo(() => {
    const dates = services.map((s) => s.date);
    return { first: dates[0] ?? "", last: dates[dates.length - 1] ?? "" };
  }, [services]);

  return (
    <div className={`flex flex-wrap items-end gap-3 ${compact ? "gap-y-3" : "gap-4"}`}>
      <Field
        id={`${idPrefix}-service`}
        label="Service"
        compact={compact}
        control={
          <select
            id={`${idPrefix}-service`}
            value={value.day}
            onChange={(e) => set("day", e.target.value as FilterState["day"])}
            className={FIELD}
          >
            {dayOptions.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
            <option value="All">All services</option>
          </select>
        }
      />

      <Field
        id={`${idPrefix}-period`}
        label="Period"
        compact={compact}
        control={
          <select
            id={`${idPrefix}-period`}
            value={value.period}
            onChange={(e) => set("period", e.target.value)}
            className={FIELD}
          >
            <option value="all">All time</option>
            <option value="12m">Last 12 months</option>
            {years.map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
        }
      />

      <Field
        id={`${idPrefix}-month`}
        label="Month"
        compact={compact}
        control={
          <select
            id={`${idPrefix}-month`}
            value={month}
            onChange={(e) => set("month", e.target.value)}
            className={FIELD}
          >
            <option value="">All months</option>
            {months.map((m) => (
              <option key={m} value={m}>
                {formatMonthLong(m)}
              </option>
            ))}
          </select>
        }
      />

      <Field
        id={`${idPrefix}-from`}
        label="From"
        compact={compact}
        control={
          <input
            id={`${idPrefix}-from`}
            type="date"
            value={value.from}
            min={bounds.first || undefined}
            max={value.to || bounds.last || undefined}
            onChange={(e) => set("from", e.target.value)}
            className={FIELD}
          />
        }
      />

      <Field
        id={`${idPrefix}-to`}
        label="To"
        compact={compact}
        control={
          <input
            id={`${idPrefix}-to`}
            type="date"
            value={value.to}
            min={value.from || bounds.first || undefined}
            max={bounds.last || undefined}
            onChange={(e) => set("to", e.target.value)}
            className={FIELD}
          />
        }
      />

      {(value.from || value.to) && (
        <button
          type="button"
          onClick={() => onChange({ ...value, from: "", to: "" })}
          className="rounded-lg border border-brand-200 px-3 py-2 text-xs font-medium text-ink-600 transition hover:bg-brand-50 dark:border-night-600 dark:text-slate-300 dark:hover:bg-night-700"
        >
          Clear dates
        </button>
      )}
    </div>
  );
}

function Field({
  id,
  label,
  control,
  compact,
}: {
  id: string;
  label: string;
  control: React.ReactNode;
  compact: boolean;
}) {
  return (
    <div className={compact ? "min-w-[128px] flex-1" : "min-w-[150px]"}>
      <label htmlFor={id} className={LABEL}>
        {label}
      </label>
      {control}
    </div>
  );
}
