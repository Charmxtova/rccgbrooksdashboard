export interface MetricRow {
  label: string;
  a: number | null;
  b: number | null;
  dp: number;
  suffix?: string;
  /** Shown under the label in the table when the figure needs explaining. */
  note?: string;
  /** Shorter label for the radar, where eleven long names would collide. */
  radarLabel?: string;
  /**
   * Set when a smaller raw figure is the better showing, so the radar can
   * invert it and let the leading group reach further out.
   */
  invert?: boolean;
}

export interface MetricSection {
  title: string;
  rows: MetricRow[];
}

export interface RadarAxis {
  axis: string;
  /** Normalised 0 to 100, where whichever group leads this axis reads 100. */
  a: number;
  b: number;
  /** The real figures, which are what the tooltip and the export show. */
  rawA: number;
  rawB: number;
  suffix: string;
  dp: number;
  section: string;
}

/**
 * The radar is built from the same rows as the side by side table, so the two
 * can never drift apart. A radar needs one shared scale and these metrics have
 * nothing in common, from services in the tens to attendance in the thousands
 * to shares in percent, so each axis is normalised on its own with the leading
 * group pinned to 100.
 *
 * That makes the chart a comparison of shape, not of size. A point on the outer
 * ring means "ahead on this axis", never "good".
 */
export function radarFromSections(sections: MetricSection[]): {
  axes: RadarAxis[];
  skipped: string[];
} {
  const axes: RadarAxis[] = [];
  const skipped: string[] = [];

  for (const section of sections) {
    for (const row of section.rows) {
      // An axis missing from either side would draw a dent that reads as a
      // finding rather than a gap in the sheet, so it is left off entirely.
      if (row.a === null || row.b === null) {
        skipped.push(row.radarLabel ?? row.label);
        continue;
      }

      // Clamping keeps the reciprocal finite when a figure is zero.
      const scale = (v: number) => (row.invert ? 1 / Math.max(v, 1) : v);
      const va = scale(row.a);
      const vb = scale(row.b);
      const max = Math.max(va, vb);

      if (max <= 0) {
        skipped.push(row.radarLabel ?? row.label);
        continue;
      }

      axes.push({
        axis: row.radarLabel ?? row.label,
        a: Math.round((va / max) * 100),
        b: Math.round((vb / max) * 100),
        rawA: row.a,
        rawB: row.b,
        suffix: row.suffix ?? "",
        dp: row.dp,
        section: section.title,
      });
    }
  }

  return { axes, skipped };
}
