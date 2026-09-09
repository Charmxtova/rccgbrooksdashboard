import { attended, formatDate, mean, median } from "./aggregate";
import type { ServiceDay, ServiceRecord } from "./types";

export interface GroupStats {
  services: number;
  /** Services that actually carry an attendance figure. */
  counted: number;
  totalAttendance: number;
  meanAttendance: number | null;
  medianAttendance: number | null;
  peak: { value: number; date: string; day: ServiceDay } | null;
  low: { value: number; date: string; day: ServiceDay } | null;
  /** Highest minus lowest, a plain measure of how much attendance swings. */
  spread: number | null;
  menShare: number | null;
  womenShare: number | null;
  childrenShare: number | null;
  firstTimersTotal: number;
  firstTimersServices: number;
  youthTotal: number;
  youthServices: number;
  firstDate: string | null;
  lastDate: string | null;
}

function shareOf(
  rows: ServiceRecord[],
  pick: (s: ServiceRecord) => number | null,
): number | null {
  const known = rows.filter((s) => pick(s) !== null);
  const base = known.reduce((a, s) => a + s.total!, 0);
  if (base === 0) return null;
  return (known.reduce((a, s) => a + pick(s)!, 0) / base) * 100;
}

export function groupStats(services: ServiceRecord[]): GroupStats {
  const withTotals = attended(services);
  const totals = withTotals.map((s) => s.total!);

  const extreme = (best: (a: number, b: number) => boolean) =>
    withTotals.reduce<ServiceRecord | null>(
      (acc, s) => (acc === null || best(s.total!, acc.total!) ? s : acc),
      null,
    );

  const peakRow = extreme((a, b) => a > b);
  const lowRow = extreme((a, b) => a < b);

  const firstTimers = services.filter((s) => s.firstTimers !== null);
  const youth = services.filter((s) => s.sundaySchool !== null);

  return {
    services: services.length,
    counted: withTotals.length,
    totalAttendance: totals.reduce((a, b) => a + b, 0),
    meanAttendance: mean(totals),
    medianAttendance: median(totals),
    peak: peakRow
      ? { value: peakRow.total!, date: peakRow.date, day: peakRow.day }
      : null,
    low: lowRow ? { value: lowRow.total!, date: lowRow.date, day: lowRow.day } : null,
    spread:
      totals.length > 1 ? Math.max(...totals) - Math.min(...totals) : null,
    menShare: shareOf(withTotals, (s) => s.men),
    womenShare: shareOf(withTotals, (s) => s.women),
    childrenShare: shareOf(withTotals, (s) => s.children),
    firstTimersTotal: firstTimers.reduce((a, s) => a + s.firstTimers!, 0),
    firstTimersServices: firstTimers.length,
    youthTotal: youth.reduce((a, s) => a + s.sundaySchool!, 0),
    youthServices: youth.length,
    firstDate: services[0]?.date ?? null,
    lastDate: services[services.length - 1]?.date ?? null,
  };
}

export type InsightKind = "up" | "down" | "flat" | "note" | "warn";

export interface Insight {
  kind: InsightKind;
  text: string;
}

const pct = (n: number) => `${n >= 0 ? "+" : ""}${n.toFixed(1)}%`;
const pts = (n: number) => `${n >= 0 ? "up" : "down"} ${Math.abs(n).toFixed(1)} points`;

function direction(diff: number, tolerance = 0.05): InsightKind {
  if (Math.abs(diff) < tolerance) return "flat";
  return diff > 0 ? "up" : "down";
}

/**
 * Every sentence below is computed from the two groups, so it can only ever
 * restate what the numbers say. Where a figure is missing from one side the
 * comparison is skipped rather than guessed at.
 */
export function compareInsights(
  a: GroupStats,
  b: GroupStats,
  labelA: string,
  labelB: string,
): Insight[] {
  const out: Insight[] = [];

  if (a.services === 0 || b.services === 0) {
    out.push({
      kind: "warn",
      text: `${a.services === 0 ? labelA : labelB} has no services in it, so there is nothing to compare. Widen its filters.`,
    });
    return out;
  }

  // A handful of services is too few to read a trend from, and saying so is
  // more useful than quietly reporting a percentage built on three numbers.
  const thin = [
    a.counted < 4 ? `${labelA} (${a.counted})` : null,
    b.counted < 4 ? `${labelB} (${b.counted})` : null,
  ].filter(Boolean);
  if (thin.length > 0) {
    out.push({
      kind: "warn",
      text: `Few services to go on in ${thin.join(" and ")}. Treat the percentages below as rough.`,
    });
  }

  // Average attendance.
  if (a.meanAttendance !== null && b.meanAttendance !== null) {
    const diff = a.meanAttendance - b.meanAttendance;
    const rel = b.meanAttendance !== 0 ? (diff / b.meanAttendance) * 100 : 0;
    out.push({
      kind: direction(diff, 0.5),
      text:
        Math.abs(diff) < 0.5
          ? `Average attendance is effectively level: ${Math.round(a.meanAttendance)} in ${labelA} against ${Math.round(b.meanAttendance)} in ${labelB}.`
          : `${labelA} averages ${Math.round(a.meanAttendance)} per service against ${Math.round(b.meanAttendance)} in ${labelB}, a difference of ${Math.abs(Math.round(diff))} (${pct(rel)}).`,
    });
  }

  // Median, which a single unusual service cannot drag around.
  if (a.medianAttendance !== null && b.medianAttendance !== null) {
    const diff = a.medianAttendance - b.medianAttendance;
    if (Math.abs(diff) >= 1) {
      out.push({
        kind: direction(diff, 1),
        text: `Typical service (median) is ${Math.round(a.medianAttendance)} in ${labelA} against ${Math.round(b.medianAttendance)} in ${labelB}. The median ignores one off highs and lows.`,
      });
    }
  }

  // Peaks.
  if (a.peak && b.peak) {
    const higher = a.peak.value >= b.peak.value ? labelA : labelB;
    const hp = a.peak.value >= b.peak.value ? a.peak : b.peak;
    out.push({
      kind: "note",
      text: `Best attended service falls in ${higher}: ${hp.value} on ${hp.day}, ${formatDate(hp.date)}.`,
    });
  }

  // Swing between the quietest and busiest service.
  if (a.spread !== null && b.spread !== null) {
    const steadier = a.spread <= b.spread ? labelA : labelB;
    const swingier = a.spread <= b.spread ? labelB : labelA;
    if (a.spread !== b.spread) {
      out.push({
        kind: "note",
        text: `${steadier} is the steadier of the two, swinging ${Math.min(a.spread, b.spread)} between its quietest and busiest service against ${Math.max(a.spread, b.spread)} in ${swingier}.`,
      });
    }
  }

  // Who is in the room.
  const shares: [string, number | null, number | null][] = [
    ["Children", a.childrenShare, b.childrenShare],
    ["Men", a.menShare, b.menShare],
    ["Women", a.womenShare, b.womenShare],
  ];
  for (const [name, sa, sb] of shares) {
    if (sa === null || sb === null) continue;
    const diff = sa - sb;
    if (Math.abs(diff) < 1) continue;
    out.push({
      kind: direction(diff, 1),
      text: `${name} make up ${sa.toFixed(0)}% of ${labelA} against ${sb.toFixed(0)}% of ${labelB}, ${pts(diff)}.`,
    });
  }

  // First timers, expressed per service so groups of different sizes compare.
  if (a.firstTimersServices > 0 && b.firstTimersServices > 0) {
    const ra = a.firstTimersTotal / a.firstTimersServices;
    const rb = b.firstTimersTotal / b.firstTimersServices;
    const diff = ra - rb;
    if (Math.abs(diff) >= 0.2) {
      out.push({
        kind: direction(diff, 0.2),
        text: `First timers average ${ra.toFixed(1)} per service in ${labelA} against ${rb.toFixed(1)} in ${labelB}, counting only services where any were recorded.`,
      });
    }
  } else if (a.firstTimersServices === 0 || b.firstTimersServices === 0) {
    const missing = a.firstTimersServices === 0 ? labelA : labelB;
    out.push({
      kind: "note",
      text: `No first timers were recorded anywhere in ${missing}, so that comparison is not possible.`,
    });
  }

  // Youth Interactive Class.
  if (a.youthServices > 0 && b.youthServices > 0) {
    const ra = a.youthTotal / a.youthServices;
    const rb = b.youthTotal / b.youthServices;
    const diff = ra - rb;
    if (Math.abs(diff) >= 0.5) {
      out.push({
        kind: direction(diff, 0.5),
        text: `Youth Interactive Class averages ${ra.toFixed(0)} per session in ${labelA} against ${rb.toFixed(0)} in ${labelB}, across ${a.youthServices} and ${b.youthServices} sessions.`,
      });
    }
  }

  // How much of each group was actually recorded.
  const coverage = (g: GroupStats, label: string) =>
    g.services > g.counted
      ? `${label} has ${g.services - g.counted} of ${g.services} services with no attendance recorded`
      : null;
  const gaps = [coverage(a, labelA), coverage(b, labelB)].filter(Boolean);
  if (gaps.length > 0) {
    out.push({
      kind: "warn",
      text: `${gaps.join(", and ")}. Those are left out of every figure above.`,
    });
  }

  return out;
}

/** Pairs the two groups up by service number so unequal ranges still overlay. */
export function overlaySeries(
  a: ServiceRecord[],
  b: ServiceRecord[],
): { i: number; a: number | null; b: number | null }[] {
  const ta = attended(a);
  const tb = attended(b);
  const len = Math.max(ta.length, tb.length);
  return Array.from({ length: len }, (_, i) => ({
    i: i + 1,
    a: ta[i]?.total ?? null,
    b: tb[i]?.total ?? null,
  }));
}
