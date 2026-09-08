export type ServiceDay = "Sunday" | "Wednesday" | "Thursday" | "Other";

/** One church service, after both sheets have been merged and cleaned. */
export interface ServiceRecord {
  /** ISO date, YYYY-MM-DD. Also the first half of the dedupe key. */
  date: string;
  day: ServiceDay;
  men: number | null;
  women: number | null;
  children: number | null;
  /** Men + Women + Children. Null when no demographic split was recorded. */
  total: number | null;
  /** The TOTAL column exactly as typed in the sheet, kept so we can flag disagreements. */
  recordedTotal: number | null;
  sundaySchool: number | null;
  newConverts: number | null;
  firstTimers: number | null;
  theme: string | null;
  text: string | null;
  /** Preacher name after canonicalisation (see lib/preachers.ts). */
  preacher: string | null;
  /** Preacher name exactly as typed, for the data-quality panel. */
  preacherRaw: string | null;
  source: "manual" | "form";
}

export interface TotalMismatch {
  date: string;
  day: ServiceDay;
  men: number;
  women: number;
  children: number;
  recordedTotal: number;
  computedTotal: number;
}

export interface DataQuality {
  /** Rows where the typed TOTAL disagreed with Men+Women+Children. */
  totalMismatches: TotalMismatch[];
  /** Distinct raw preacher spellings that were folded into a canonical name. */
  preacherAliases: { canonical: string; aliases: string[] }[];
  /**
   * Services recorded more than once, counted only once here.
   * "within-sheet" = the same tab lists the service twice (a copy-paste slip).
   * "across-sheets" = it is on both tabs; the hand-entered sheet wins.
   */
  duplicates: {
    date: string;
    day: ServiceDay;
    kind: "within-sheet" | "across-sheets";
  }[];
  missingCounts: Record<string, number>;
  rowCount: number;
}

export interface Dataset {
  services: ServiceRecord[];
  quality: DataQuality;
  fetchedAt: string;
}
