/**
 * The PREACHER column is free text and was filled in by different people over
 * three years, so one person shows up under many spellings: "Pastor Femi
 * Luther-Abegunde", "Pastor Femi", "Femi Luther", "Pst Femi Luther Abegunde"
 * and "Femi Luther A." are all the same man. Counting the raw strings gives 37
 * "preachers" for what is really about a dozen people, which makes any
 * preacher chart meaningless.
 *
 * ---------------------------------------------------------------------------
 * TO CORRECT THIS MAP: edit ALIASES below. The key is the raw spelling as it
 * appears in the sheet (case- and punctuation-insensitive); the value is the
 * name you want shown on the dashboard. Anything not listed here is displayed
 * exactly as typed.
 * ---------------------------------------------------------------------------
 */

/** Lowercase, strip punctuation and honorifics, collapse whitespace. */
function key(raw: string): string {
  return raw
    .toLowerCase()
    .replace(/[.,/]/g, " ")
    .replace(/\b(pastor|pst|ps|rev|bro|bros|brother|sis|sister|mr|mrs|dr)\b/g, " ")
    .replace(/[^a-z\s-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

const FEMI = "Pastor Femi Luther-Abegunde";
const JOHN = "Pastor John Isiekwene";
const SEGUN = "Pastor Segun Aderibigbe";
const UFOOMA = "Pastor (Mrs) Ufooma Luther-Abegunde";

/** raw spelling -> canonical name */
const ALIASES: Record<string, string> = {
  // --- Pastor Femi Luther-Abegunde (~75 services, the resident pastor) ---
  "femi luther-abegunde": FEMI,
  "femi luther abegunde": FEMI,
  "femi-luther abegunde": FEMI,
  "femi-luther-abegunde": FEMI,
  "femi luther": FEMI,
  "femi luther a": FEMI,
  "femi": FEMI,

  // --- Pastor John Isiekwene (~15), last two are misspellings ---
  "john isiekwene": JOHN,
  "john isikwene": JOHN,
  "john itriekwene": JOHN,
  "john": JOHN,

  // --- Pastor Segun Aderibigbe (~4) ---
  "segun aderibigbe": SEGUN,
  "segun": SEGUN,

  // --- Pastor (Mrs) Ufooma Luther-Abegunde (~3) ---
  // "Pst Mrs Luther-Abegunde" and "Pst/Mrs Luther-Abegunde" have no first name,
  // but Luther-Abegunde + the Mrs honorific identifies her.
  "ufooma luther-abegunde": UFOOMA,
  "luther-abegunde": UFOOMA,

  // --- name order flipped between entries ---
  "kanayo allwell": "Allwell Kanayo",
  "allwell kanayo": "Allwell Kanayo",

  // --- first name only on one entry ---
  "kola": "Kola Roberts",
  "kola roberts": "Kola Roberts",
};

/**
 * Merges I did NOT make, because they could plausibly be different people.
 * These stay as separate entries on the dashboard and are surfaced for review.
 */
export const UNCERTAIN: { raw: string; note: string }[] = [
  { raw: "Seun Aderibigbe", note: "Same surname as Pastor Segun Aderibigbe. A misspelling of Segun, or a different person?" },
  { raw: "Bro Sola Aderibigbe", note: "Same surname as Pastor Segun Aderibigbe, but listed without the Pastor title." },
  { raw: "Ufuoma Usen", note: "First name resembles Ufooma Luther-Abegunde but the surname differs, so kept separate." },
  { raw: "Falade Bukola / Olumide Olanrewaju", note: "Two names in one cell, counted as a single joint entry." },
];

export function canonicalPreacher(raw: string | null): string | null {
  if (!raw) return null;
  const trimmed = raw.trim();
  if (!trimmed || trimmed === "-") return null;
  return ALIASES[key(trimmed)] ?? trimmed;
}

/** Groups the raw spellings seen in the data under the name each maps to. */
export function aliasReport(rawNames: string[]): { canonical: string; aliases: string[] }[] {
  const groups = new Map<string, Set<string>>();
  for (const raw of rawNames) {
    const canonical = canonicalPreacher(raw);
    if (!canonical) continue;
    if (!groups.has(canonical)) groups.set(canonical, new Set());
    if (raw.trim() !== canonical) groups.get(canonical)!.add(raw.trim());
  }
  return [...groups.entries()]
    .filter(([, aliases]) => aliases.size > 0)
    .map(([canonical, aliases]) => ({ canonical, aliases: [...aliases].sort() }))
    .sort((a, b) => b.aliases.length - a.aliases.length);
}
