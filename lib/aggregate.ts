import type { ServiceRecord, ServiceDay } from "./types";

export function median(values: number[]): number | null {
  if (values.length === 0) return null;
  const s = [...values].sort((a, b) => a - b);
  const mid = Math.floor(s.length / 2);
  return s.length % 2 ? s[mid] : (s[mid - 1] + s[mid]) / 2;
}

export function mean(values: number[]): number | null {
  if (values.length === 0) return null;
  return values.reduce((a, b) => a + b, 0) / values.length;
}

export function attended(services: ServiceRecord[]): ServiceRecord[] {
  return services.filter((s) => s.total !== null);
}

/* ------------------------------------------------------------------ KPIs */

/**
 * Fill colour for the card, drawn from the church logo and its RCCG roundel.
 * The three share cards deliberately reuse the congregation pie's own colours
 * so the two readings of the same split line up visually.
 */
export type KpiTone =
  | "deepTeal"
  | "navy"
  | "green"
  | "plum"
  | "red"
  | "amber"
  | "shareMen"
  | "shareWomen"
  | "shareChildren";

export interface Kpi {
  label: string;
  value: number | null;
  /** Percent change against the comparison window, when one exists. */
  deltaPct: number | null;
  hint: string;
  suffix?: string;
  tone: KpiTone;
}

export function buildKpis(services: ServiceRecord[]): Kpi[] {
  const withTotals = attended(services);
  const totals = withTotals.map((s) => s.total!);

  const latest = withTotals[withTotals.length - 1] ?? null;
  const previous = withTotals[withTotals.length - 2] ?? null;

  // Average of the most recent 8 services vs the 8 before them.
  const recentAvg = mean(totals.slice(-8));
  const priorAvg = mean(totals.slice(-16, -8));

  const firstTimers = services
    .map((s) => s.firstTimers)
    .filter((n): n is number => n !== null);
  const sundaySchool = services
    .map((s) => s.sundaySchool)
    .filter((n): n is number => n !== null);

  const peak = withTotals.reduce<ServiceRecord | null>(
    (best, s) => (best === null || s.total! > best.total! ? s : best),
    null,
  );

  /**
   * Share of attendance for one group, counted only across services where that
   * group's number was actually recorded, so a blank cell does not read as a
   * zero and drag the percentage down.
   */
  const shareOf = (pick: (s: ServiceRecord) => number | null): number | null => {
    const known = withTotals.filter((s) => pick(s) !== null);
    const base = known.reduce((a, s) => a + s.total!, 0);
    if (base === 0) return null;
    return (known.reduce((a, s) => a + pick(s)!, 0) / base) * 100;
  };

  const menShare = shareOf((s) => s.men);
  const womenShare = shareOf((s) => s.women);
  const childrenShare = shareOf((s) => s.children);

  return [
    {
      label: "Latest service",
      value: latest?.total ?? null,
      deltaPct:
        latest?.total != null && previous?.total != null && previous.total !== 0
          ? ((latest.total - previous.total) / previous.total) * 100
          : null,
      hint: latest ? `${latest.day}, ${formatDate(latest.date)}` : "No services yet",
      tone: "deepTeal",
    },
    {
      label: "Average attendance",
      value: recentAvg === null ? null : Math.round(recentAvg),
      deltaPct:
        recentAvg !== null && priorAvg !== null && priorAvg !== 0
          ? ((recentAvg - priorAvg) / priorAvg) * 100
          : null,
      hint: "Last 8 services vs the 8 before",
      tone: "navy",
    },
    {
      label: "Services recorded",
      value: services.length,
      deltaPct: null,
      hint: services.length
        ? `${formatDate(services[0].date)} to ${formatDate(services[services.length - 1].date)}`
        : "No services in range",
      tone: "green",
    },
    {
      label: "Peak attendance",
      value: peak?.total ?? null,
      deltaPct: null,
      hint: peak ? `${peak.day}, ${formatDate(peak.date)}` : "No data yet",
      tone: "plum",
    },
    {
      label: "First timers",
      value: firstTimers.length ? firstTimers.reduce((a, b) => a + b, 0) : null,
      deltaPct: null,
      hint: `Recorded at ${firstTimers.length} of ${services.length} services`,
      tone: "red",
    },
    {
      label: "Sunday school",
      value: sundaySchool.length ? Math.round(mean(sundaySchool)!) : null,
      deltaPct: null,
      hint: `Average, from ${sundaySchool.length} of ${services.length} services`,
      tone: "amber",
    },
    {
      label: "Men share",
      value: menShare === null ? null : Math.round(menShare),
      suffix: "%",
      deltaPct: null,
      hint: "Men as a share of total attendance",
      tone: "shareMen",
    },
    {
      label: "Women share",
      value: womenShare === null ? null : Math.round(womenShare),
      suffix: "%",
      deltaPct: null,
      hint: "Women as a share of total attendance",
      tone: "shareWomen",
    },
    {
      label: "Children share",
      value: childrenShare === null ? null : Math.round(childrenShare),
      suffix: "%",
      deltaPct: null,
      hint: "Children as a share of total attendance",
      tone: "shareChildren",
    },
  ];
}

/* ------------------------------------------------------- Run chart (QI) */

export interface RunPoint {
  date: string;
  label: string;
  value: number;
  day: ServiceDay;
  theme: string | null;
  preacher: string | null;
}

export interface RunChartResult {
  points: RunPoint[];
  median: number | null;
  /** Runs of 6+ consecutive points on one side of the median. */
  shifts: { start: number; end: number; direction: "above" | "below" }[];
  /** Runs of 5+ consecutive increases or decreases. */
  trends: { start: number; end: number; direction: "up" | "down" }[];
}

export function buildRunChart(services: ServiceRecord[]): RunChartResult {
  const points: RunPoint[] = attended(services).map((s) => ({
    date: s.date,
    label: formatShortDate(s.date),
    value: s.total!,
    day: s.day,
    theme: s.theme,
    preacher: s.preacher,
  }));

  const med = median(points.map((p) => p.value));
  const shifts: RunChartResult["shifts"] = [];
  const trends: RunChartResult["trends"] = [];

  if (med !== null) {
    // Shift: 6 or more consecutive points on the same side of the median.
    // Points sitting exactly on the median are skipped, not treated as breaks.
    let runStart = -1;
    let runDir: "above" | "below" | null = null;
    let runLen = 0;

    const flushShift = (end: number) => {
      if (runDir !== null && runLen >= 6) {
        shifts.push({ start: runStart, end, direction: runDir });
      }
      runDir = null;
      runLen = 0;
      runStart = -1;
    };

    for (let i = 0; i < points.length; i++) {
      if (points[i].value === med) continue;
      const dir: "above" | "below" = points[i].value > med ? "above" : "below";
      if (dir === runDir) {
        runLen++;
      } else {
        flushShift(i - 1);
        runDir = dir;
        runLen = 1;
        runStart = i;
      }
    }
    flushShift(points.length - 1);
  }

  // Trend: 5 or more consecutive points moving the same way. Equal neighbouring
  // values are skipped rather than breaking the run.
  let tStart = -1;
  let tDir: "up" | "down" | null = null;
  let tCount = 0;

  const flushTrend = (end: number) => {
    if (tDir !== null && tCount >= 5) {
      trends.push({ start: tStart, end, direction: tDir });
    }
    tDir = null;
    tCount = 0;
    tStart = -1;
  };

  for (let i = 1; i < points.length; i++) {
    const diff = points[i].value - points[i - 1].value;
    if (diff === 0) continue;
    const dir: "up" | "down" = diff > 0 ? "up" : "down";
    if (dir === tDir) {
      tCount++;
    } else {
      flushTrend(i - 1);
      tDir = dir;
      tCount = 2;
      tStart = i - 1;
    }
  }
  flushTrend(points.length - 1);

  return { points, median: med, shifts, trends };
}

/* ------------------------------------------------------------- Groupings */

export interface Bucket {
  name: string;
  value: number;
  count?: number;
  /** Extra lines for the tooltip, used where a bar is a single service. */
  theme?: string | null;
  preacher?: string | null;
  day?: ServiceDay;
}

function averageBy(
  services: ServiceRecord[],
  keyOf: (s: ServiceRecord) => string,
): Map<string, number[]> {
  const groups = new Map<string, number[]>();
  for (const s of attended(services)) {
    const key = keyOf(s);
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(s.total!);
  }
  return groups;
}

export function byMonth(services: ServiceRecord[]): Bucket[] {
  return [...averageBy(services, (s) => s.date.slice(0, 7)).entries()]
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([key, vals]) => ({
      name: formatMonth(key),
      value: Math.round(mean(vals)!),
      count: vals.length,
    }));
}

export function byYear(services: ServiceRecord[]): Bucket[] {
  return [...averageBy(services, (s) => s.date.slice(0, 4)).entries()]
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([key, vals]) => ({
      name: key,
      value: Math.round(mean(vals)!),
      count: vals.length,
    }));
}

export function byServiceType(services: ServiceRecord[]): Bucket[] {
  return [...averageBy(services, (s) => s.day).entries()]
    .map(([name, vals]) => ({
      name,
      value: Math.round(mean(vals)!),
      count: vals.length,
    }))
    .sort((a, b) => b.count! - a.count!);
}

export function serviceTypeCounts(services: ServiceRecord[]): Bucket[] {
  const groups = new Map<string, number>();
  for (const s of services) groups.set(s.day, (groups.get(s.day) ?? 0) + 1);
  return [...groups.entries()]
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);
}

export function demographics(services: ServiceRecord[]): Bucket[] {
  let men = 0;
  let women = 0;
  let children = 0;
  for (const s of services) {
    men += s.men ?? 0;
    women += s.women ?? 0;
    children += s.children ?? 0;
  }
  return [
    { name: "Men", value: men },
    { name: "Women", value: women },
    { name: "Children", value: children },
  ].filter((b) => b.value > 0);
}

/** Ranked by services led; `count` carries their average attendance. */
export function byPreacher(services: ServiceRecord[], limit = 8): Bucket[] {
  const groups = new Map<string, number[]>();
  for (const s of attended(services)) {
    if (!s.preacher) continue;
    if (!groups.has(s.preacher)) groups.set(s.preacher, []);
    groups.get(s.preacher)!.push(s.total!);
  }
  return [...groups.entries()]
    .map(([name, vals]) => ({
      name,
      value: vals.length,
      count: Math.round(mean(vals)!),
    }))
    .sort((a, b) => b.value - a.value)
    .slice(0, limit);
}

/**
 * One bar per service rather than per month, so each bar can carry the theme
 * that service was built around. Monthly buckets would mix several themes into
 * a single bar and there would be nothing meaningful to label it with.
 */
export function firstTimersByService(services: ServiceRecord[]): Bucket[] {
  return services
    .filter((s) => s.firstTimers !== null && s.firstTimers > 0)
    .map((s) => ({
      name: formatShortDate(s.date),
      value: s.firstTimers!,
      theme: s.theme,
      preacher: s.preacher,
      day: s.day,
    }));
}

/* ------------------------------------------------------------ Formatting */

export function formatDate(iso: string): string {
  return new Date(`${iso}T12:00:00Z`).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  });
}

/**
 * Includes the year: the run chart spans several years, so "1 Sept to 5 Jan"
 * is ambiguous without it.
 */
export function formatShortDate(iso: string): string {
  return new Date(`${iso}T12:00:00Z`).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "2-digit",
    timeZone: "UTC",
  });
}

export function formatMonth(ym: string): string {
  return new Date(`${ym}-01T12:00:00Z`).toLocaleDateString("en-GB", {
    month: "short",
    year: "2-digit",
    timeZone: "UTC",
  });
}
