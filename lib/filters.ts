import type { ServiceDay, ServiceRecord } from "./types";

export type DayFilter = ServiceDay | "All";
/** "all", "12m", or a four digit year. */
export type PeriodFilter = string;

export interface FilterState {
  day: DayFilter;
  period: PeriodFilter;
  /** "" for every month, otherwise "YYYY-MM". */
  month: string;
  /** "" or an ISO date. */
  from: string;
  to: string;
}

/**
 * Sunday by default: Sundays average about 130 and midweek services about 45,
 * so mixing them makes a median line meaningless.
 */
export const DEFAULT_FILTERS: FilterState = {
  day: "Sunday",
  period: "all",
  month: "",
  from: "",
  to: "",
};

export function byPeriod(
  services: ServiceRecord[],
  period: PeriodFilter,
): ServiceRecord[] {
  if (period === "all") return services;

  if (period === "12m") {
    const latest = services[services.length - 1];
    if (!latest) return services;
    const cutoff = new Date(`${latest.date}T12:00:00Z`);
    cutoff.setUTCFullYear(cutoff.getUTCFullYear() - 1);
    const iso = cutoff.toISOString().slice(0, 10);
    return services.filter((s) => s.date >= iso);
  }

  return services.filter((s) => s.date.startsWith(period));
}

/** Months present inside the chosen period, newest first. */
export function monthOptions(
  services: ServiceRecord[],
  period: PeriodFilter,
): string[] {
  const keys = [...new Set(byPeriod(services, period).map((s) => s.date.slice(0, 7)))];
  return keys.sort((a, b) => b.localeCompare(a));
}

/**
 * Changing the period can strip the chosen month out of the list. Falling back
 * to every month beats leaving a stale month quietly matching nothing.
 */
export function activeMonth(services: ServiceRecord[], f: FilterState): string {
  return monthOptions(services, f.period).includes(f.month) ? f.month : "";
}

/**
 * Everything except the service type filter. The service mix and the average
 * by service type both need to see every kind of service, so they stop here.
 */
export function applyExceptDay(
  services: ServiceRecord[],
  f: FilterState,
): ServiceRecord[] {
  let out = byPeriod(services, f.period);

  const month = activeMonth(services, f);
  if (month) out = out.filter((s) => s.date.startsWith(month));

  if (f.from || f.to) {
    out = out.filter((s) => (!f.from || s.date >= f.from) && (!f.to || s.date <= f.to));
  }
  return out;
}

export function applyFilters(
  services: ServiceRecord[],
  f: FilterState,
): ServiceRecord[] {
  const out = applyExceptDay(services, f);
  return f.day === "All" ? out : out.filter((s) => s.day === f.day);
}

/** A short human label for what a filter state selected, used on the compare page. */
export function describeFilters(f: FilterState): string {
  const parts: string[] = [f.day === "All" ? "All services" : `${f.day} services`];

  if (f.month) parts.push(formatMonthLong(f.month));
  else if (f.period === "12m") parts.push("last 12 months");
  else if (f.period !== "all") parts.push(f.period);

  if (f.from && f.to) parts.push(`${f.from} to ${f.to}`);
  else if (f.from) parts.push(`from ${f.from}`);
  else if (f.to) parts.push(`up to ${f.to}`);

  if (parts.length === 1) parts.push("all time");
  return parts.join(", ");
}

/** "2026-09" becomes "September 2026", spelled out for an unambiguous dropdown. */
export function formatMonthLong(ym: string): string {
  return new Date(`${ym}-01T12:00:00Z`).toLocaleDateString("en-GB", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
}
