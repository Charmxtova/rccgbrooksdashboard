/**
 * Minimal RFC-4180 CSV parser. The sheets contain quoted fields with commas
 * (service themes such as "The lover, the loved and the beloved"), so a plain
 * split(",") corrupts every column after THEME.
 */
export function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let field = "";
  let row: string[] = [];
  let inQuotes = false;

  const src = text.replace(/\r\n/g, "\n").replace(/\r/g, "\n");

  for (let i = 0; i < src.length; i++) {
    const ch = src[i];
    if (inQuotes) {
      if (ch === '"') {
        if (src[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        field += ch;
      }
    } else if (ch === '"') {
      inQuotes = true;
    } else if (ch === ",") {
      row.push(field);
      field = "";
    } else if (ch === "\n") {
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
    } else {
      field += ch;
    }
  }
  if (field.length > 0 || row.length > 0) {
    row.push(field);
    rows.push(row);
  }
  return rows.filter((r) => r.some((c) => c.trim() !== ""));
}

/** Turn a parsed grid into objects keyed by header name. */
export function toObjects(grid: string[][]): Record<string, string>[] {
  if (grid.length === 0) return [];
  const headers = grid[0].map((h) => h.trim());
  return grid.slice(1).map((cells) => {
    const obj: Record<string, string> = {};
    headers.forEach((h, i) => {
      // Duplicate headers (the form sheet has two "Preacher Name" columns):
      // keep whichever copy actually holds a value.
      const v = (cells[i] ?? "").trim();
      if (!(h in obj) || (obj[h] === "" && v !== "")) obj[h] = v;
    });
    return obj;
  });
}
