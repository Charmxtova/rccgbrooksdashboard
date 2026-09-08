import { canonicalPreacher, aliasReport } from "./preachers";
import type {
  Dataset,
  DataQuality,
  ServiceDay,
  ServiceRecord,
  TotalMismatch,
} from "./types";

/** Column headers on the hand-entered "Church Service & Attendance Report" tab. */
const MANUAL_COL = {
  date: "DATE",
  day: "DAY",
  men: "MEN",
  women: "WOMEN",
  children: "CHILDREN",
  total: "TOTAL",
  sundaySchool: "SUNDAY SCHOOL",
  newConverts: "NEW CONVERTS",
  firstTimers: "FIRST TIMER",
  theme: "THEME",
  text: "TEXT",
  preacher: "PREACHER",
} as const;

/** Column headers on the "Form Responses 1" tab (Google Form questions). */
const FORM_COL = {
  date: "Date of Service",
  day: "Day of the Week",
  men: "Number of Men",
  women: "Number of Women",
  children: "Number of Children",
  total: "Total Attendance",
  sundaySchool: "Sunday School Attendance",
  newConverts: "Number of New Converts",
  firstTimers: "Number of First Timers",
  theme: "Service Theme",
  text: "Scripture Text",
  preacher: "Preacher Name",
} as const;

const BLANK = new Set(["", "-", "--", "n/a", "na", "nil", "none"]);

function str(v: string | undefined): string | null {
  const t = (v ?? "").trim();
  return BLANK.has(t.toLowerCase()) ? null : t;
}

function num(v: string | undefined): number | null {
  const t = str(v);
  if (t === null) return null;
  const n = Number(t.replace(/[,\s]/g, ""));
  return Number.isFinite(n) ? n : null;
}

/** Accepts the manual tab's 2023-01-01 and the form's 8/26/2026. */
function isoDate(v: string | undefined): string | null {
  const t = str(v);
  if (!t) return null;

  const iso = t.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
  if (iso) {
    const [, y, m, d] = iso;
    return `${y}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`;
  }

  // Google Forms writes M/D/YYYY in this spreadsheet's locale.
  const us = t.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})/);
  if (us) {
    const [, m, d, y] = us;
    return `${y}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`;
  }

  const parsed = new Date(t);
  if (!Number.isNaN(parsed.getTime())) {
    return parsed.toISOString().slice(0, 10);
  }
  return null;
}

const DAY_NAMES: ServiceDay[] = [
  "Other", // Sunday handled explicitly below
  "Other",
  "Other",
  "Wednesday",
  "Thursday",
  "Other",
  "Other",
];

function normaliseDay(v: string | undefined, date: string): ServiceDay {
  const t = (str(v) ?? "").toLowerCase();
  if (t.startsWith("sun")) return "Sunday";
  if (t.startsWith("wed")) return "Wednesday";
  if (t.startsWith("thu")) return "Thursday";

  // Fall back to the date itself if the Day column is blank or unrecognised.
  const dow = new Date(`${date}T12:00:00Z`).getUTCDay();
  if (dow === 0) return "Sunday";
  return DAY_NAMES[dow] ?? "Other";
}

function buildRecord(
  row: Record<string, string>,
  col: typeof MANUAL_COL | typeof FORM_COL,
  source: "manual" | "form",
): ServiceRecord | null {
  const date = isoDate(row[col.date]);
  if (!date) return null;

  const men = num(row[col.men]);
  const women = num(row[col.women]);
  const children = num(row[col.children]);
  const recordedTotal = num(row[col.total]);

  // Decision: the dashboard's headline total is Men + Women + Children, not the
  // typed TOTAL column, so the KPI always agrees with the breakdown charts.
  const parts = [men, women, children].filter((n): n is number => n !== null);
  const total = parts.length > 0 ? parts.reduce((a, b) => a + b, 0) : null;

  const preacherRaw = str(row[col.preacher]);

  return {
    date,
    day: normaliseDay(row[col.day], date),
    men,
    women,
    children,
    total,
    recordedTotal,
    sundaySchool: num(row[col.sundaySchool]),
    newConverts: num(row[col.newConverts]),
    firstTimers: num(row[col.firstTimers]),
    theme: str(row[col.theme]),
    text: str(row[col.text]),
    preacher: canonicalPreacher(preacherRaw),
    preacherRaw,
    source,
  };
}

export function buildDataset(
  manualRows: Record<string, string>[],
  formRows: Record<string, string>[],
): Dataset {
  const manual = manualRows
    .map((r) => buildRecord(r, MANUAL_COL, "manual"))
    .filter((r): r is ServiceRecord => r !== null);
  const form = formRows
    .map((r) => buildRecord(r, FORM_COL, "form"))
    .filter((r): r is ServiceRecord => r !== null);

  // Both sheets stay in use, so the same service can be recorded twice. Key on
  // date + day; the hand-maintained sheet wins because it is the curated record.
  // The manual sheet also contains genuine copy-paste duplicates (every March
  // 2025 service is listed twice), so collisions are reported by kind.
  const byKey = new Map<string, ServiceRecord>();
  const duplicates: DataQuality["duplicates"] = [];

  for (const rec of form) byKey.set(`${rec.date}|${rec.day}`, rec);
  for (const rec of manual) {
    const k = `${rec.date}|${rec.day}`;
    const existing = byKey.get(k);
    if (existing) {
      duplicates.push({
        date: rec.date,
        day: rec.day,
        kind: existing.source === "manual" ? "within-sheet" : "across-sheets",
      });
    }
    byKey.set(k, rec);
  }

  const services = [...byKey.values()].sort((a, b) =>
    a.date.localeCompare(b.date),
  );

  const totalMismatches: TotalMismatch[] = services
    .filter(
      (s) =>
        s.men !== null &&
        s.women !== null &&
        s.children !== null &&
        s.recordedTotal !== null &&
        s.total !== null &&
        s.recordedTotal !== s.total,
    )
    .map((s) => ({
      date: s.date,
      day: s.day,
      men: s.men!,
      women: s.women!,
      children: s.children!,
      recordedTotal: s.recordedTotal!,
      computedTotal: s.total!,
    }));

  const fields: (keyof ServiceRecord)[] = [
    "men", "women", "children", "sundaySchool",
    "newConverts", "firstTimers", "theme", "text", "preacher",
  ];
  const missingCounts: Record<string, number> = {};
  for (const f of fields) {
    missingCounts[f] = services.filter((s) => s[f] === null).length;
  }

  const quality: DataQuality = {
    totalMismatches,
    preacherAliases: aliasReport(
      services.map((s) => s.preacherRaw).filter((n): n is string => n !== null),
    ),
    duplicates,
    missingCounts,
    rowCount: services.length,
  };

  return { services, quality, fetchedAt: new Date().toISOString() };
}
