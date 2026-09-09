import { formatDate } from "./aggregate";
import type { GroupStats, Insight } from "./compare";
import type { MetricSection, RadarAxis } from "./metrics";

/**
 * RFC 4180 quoting. Service themes contain commas and the insight sentences
 * contain both commas and full stops, so unquoted output would corrupt the
 * moment anyone opened it in Excel.
 */
function cell(value: string | number | null): string {
  if (value === null) return "";
  const s = String(value);
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export function toCsv(rows: (string | number | null)[][]): string {
  return rows.map((r) => r.map(cell).join(",")).join("\r\n");
}


export function buildComparisonCsv({
  labelA,
  labelB,
  statsA,
  statsB,
  sections,
  insights,
  radar,
}: {
  labelA: string;
  labelB: string;
  statsA: GroupStats;
  statsB: GroupStats;
  sections: MetricSection[];
  insights: Insight[];
  radar: RadarAxis[];
}): string {
  const coverage = (s: GroupStats) =>
    s.firstDate ? `${formatDate(s.firstDate)} to ${formatDate(s.lastDate!)}` : "no services";

  const rows: (string | number | null)[][] = [
    ["RCCG The Brooks, attendance comparison"],
    ["Exported", formatDate(new Date().toISOString().slice(0, 10))],
    [],
    ["Group", "Selection", "Covers", "Services"],
    ["Set A", labelA, coverage(statsA), statsA.services],
    ["Set B", labelB, coverage(statsB), statsB.services],
    [],
    ["Section", "Metric", "Set A", "Set B", "Difference"],
  ];

  for (const section of sections) {
    for (const row of section.rows) {
      // Values are written unformatted so a spreadsheet can total and chart
      // them. The suffix goes in its own column rather than glued to a number.
      const diff =
        row.a !== null && row.b !== null
          ? Number((row.a - row.b).toFixed(row.dp))
          : null;
      rows.push([
        section.title,
        row.suffix ? `${row.label} (${row.suffix})` : row.label,
        row.a === null ? null : Number(row.a.toFixed(row.dp)),
        row.b === null ? null : Number(row.b.toFixed(row.dp)),
        diff,
      ]);
    }
  }

  if (radar.length > 0) {
    rows.push(
      [],
      ["Indicator profile"],
      [
        "The index columns are what the radar plots. Each indicator is scaled on its own, with the leading group set to 100, so indicators measured in different units can sit on one chart.",
      ],
      ["Section", "Indicator", "Set A", "Set B", "Set A index", "Set B index"],
    );
    for (const axis of radar) {
      rows.push([
        axis.section,
        axis.suffix ? `${axis.axis} (${axis.suffix})` : axis.axis,
        Number(axis.rawA.toFixed(axis.dp)),
        Number(axis.rawB.toFixed(axis.dp)),
        axis.a,
        axis.b,
      ]);
    }
  }

  if (insights.length > 0) {
    rows.push([], ["Key insights"], ["Type", "Observation"]);
    for (const insight of insights) {
      rows.push([insight.kind, insight.text]);
    }
  }

  return toCsv(rows);
}

/** Triggers a browser download without leaving the page. */
export function downloadCsv(filename: string, csv: string): void {
  // The BOM makes Excel open UTF-8 correctly rather than mangling accents.
  const blob = new Blob(["﻿", csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
