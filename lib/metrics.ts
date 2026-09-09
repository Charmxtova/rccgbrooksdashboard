export interface RadarOverride {
  /** Shorter label, since full metric names collide on one ring. */
  label?: string;
  /** Different figures to plot, which is how a total becomes a rate. */
  a?: number | null;
  b?: number | null;
  dp?: number;
  suffix?: string;
  /**
   * Set when a smaller raw figure is the better showing, so the axis is
   * inverted and the leading group reaches further out.
   */
  invert?: boolean;
}

export interface MetricRow {
  label: string;
  a: number | null;
  b: number | null;
  dp: number;
  suffix?: string;
  /** Shown under the label in the table when the figure needs explaining. */
  note?: string;
  /**
   * How this row appears on the radar. Omitted plots the row's own figures.
   * `false` keeps it off the radar entirely, which suits raw counts and totals
   * that only measure how big a group is. An object plots different figures,
   * which is how a total is shown as a per service rate.
   */
  radar?: false | RadarOverride;
}

export interface MetricSection {
  title: string;
  rows: MetricRow[];
  /**
   * Defaults to true. Set false to keep a section in the table but off the
   * radar, which suits the share rows: Men, Women and Children always sum to
   * about 100, so they move against each other rather than independently and
   * add three near identical axes without adding a third dimension.
   */
  inRadar?: boolean;
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
    if (section.inRadar === false) continue;

    for (const row of section.rows) {
      if (row.radar === false) continue;

      const override = row.radar ?? {};
      const label = override.label ?? row.label;
      const a = override.a !== undefined ? override.a : row.a;
      const b = override.b !== undefined ? override.b : row.b;

      // An axis missing from either side would draw a dent that reads as a
      // finding rather than a gap in the sheet, so it is left off entirely.
      if (a === null || b === null) {
        skipped.push(label);
        continue;
      }

      // Clamping keeps the reciprocal finite when a figure is zero.
      const scale = (v: number) => (override.invert ? 1 / Math.max(v, 1) : v);
      const va = scale(a);
      const vb = scale(b);
      const max = Math.max(va, vb);

      if (max <= 0) {
        skipped.push(label);
        continue;
      }

      axes.push({
        axis: label,
        a: Math.round((va / max) * 100),
        b: Math.round((vb / max) * 100),
        rawA: a,
        rawB: b,
        suffix: override.suffix ?? row.suffix ?? "",
        dp: override.dp ?? row.dp,
        section: section.title,
      });
    }
  }

  return { axes, skipped };
}
