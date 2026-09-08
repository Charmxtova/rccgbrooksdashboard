import { parseCsv, toObjects } from "./csv";

export const SHEET_ID =
  process.env.SHEET_ID ?? "1EndionHzxlHIa1A7PWcsAOwW9_Y0JGgfGO97SwldXnA";

/** "Church Service & Attendance Report" — hand-entered, 2023 to date. */
export const MANUAL_GID = "1012038425";
/** "Form Responses 1" — fed automatically by the Google Form. */
export const FORM_GID = "2139658112";

export const SHEET_URL = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/edit`;

function csvUrl(gid: string): string {
  return `https://docs.google.com/spreadsheets/d/${SHEET_ID}/export?format=csv&gid=${gid}`;
}

async function fetchTab(gid: string): Promise<Record<string, string>[]> {
  const res = await fetch(csvUrl(gid), {
    // Revalidated by the caller's route segment config; this keeps the
    // underlying fetch from being cached indefinitely.
    next: { revalidate: 300 },
    headers: { "user-agent": "rccg-brooks-dashboard" },
  });
  if (!res.ok) {
    throw new Error(
      `Google Sheets returned ${res.status} for gid ${gid}. ` +
        `Check the sheet is shared as "Anyone with the link can view".`,
    );
  }
  const text = await res.text();
  if (text.trimStart().startsWith("<")) {
    throw new Error(
      `Google Sheets returned an HTML page instead of CSV for gid ${gid}, ` +
        `which means the sheet is not publicly readable.`,
    );
  }
  return toObjects(parseCsv(text));
}

export async function fetchBothTabs() {
  const [manual, form] = await Promise.all([
    fetchTab(MANUAL_GID),
    fetchTab(FORM_GID),
  ]);
  return { manual, form };
}
