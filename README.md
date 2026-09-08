# RCCG The Brooks — Attendance Dashboard

A password-gated dashboard of service attendance for RCCG The Brooks, built with
Next.js and read live from the church's Google Sheet. Nothing is copied into a
database: every page load reads the sheet, so adding a row in Google Sheets is
all it takes to update the dashboard.

## How the data flows

The workbook has two tabs and **both are used**:

| Tab | Filled in by | Role |
| --- | --- | --- |
| `Church Service & Attendance Report` (gid `1012038425`) | By hand | The curated record, 2023 to date |
| `Form Responses 1` (gid `2139658112`) | Google Form | New services as they are submitted |

Both are fetched as CSV, normalised to a common shape, then merged on
**date + day of week**. Where the same service appears on both tabs, the
hand-entered sheet wins, because it is the one that gets corrected.

The page is an ISR route with `revalidate = 300`, so the sheet is re-read at
most once every five minutes.

## Decisions worth knowing

- **Attendance = Men + Women + Children**, not the typed `TOTAL` column. Six
  rows disagree with their own breakdown (16 Jul 2023 records a total of 257
  against a breakdown summing to 187). Recomputing keeps every KPI consistent
  with every chart. All six are listed in the dashboard's Data quality panel.
- **Sunday is the default filter.** Sundays average about 130 and midweek
  services about 45; plotting them on one run chart makes the median line
  meaningless. The service filter switches between them.
- **Preacher names are normalised.** The column is free text, so one person
  appears under many spellings — "Pastor Femi Luther-Abegunde", "Pastor Femi",
  "Femi Luther", "Pst Femi Luther Abegunde" are all the same person. The map
  lives in [`lib/preachers.ts`](lib/preachers.ts) and is easy to edit; a few
  ambiguous cases are deliberately left unmerged and flagged in the UI.
- **Duplicate rows are collapsed.** Every March 2025 service is entered twice in
  the source sheet. They are counted once here and flagged as "same sheet" in
  the Data quality panel so they can be deleted at source.
- **New Converts has never been filled in** — that KPI shows an empty state and
  will start working on its own once the column has data.

## Branding and theming

Colours are taken from the church logo — the teal wordmark, the orange swoosh,
and the charcoal of "The" and the tagline. Those three are also the categorical
chart palette, so Men / Women / Children read as the logo's own triad. They are
defined once in [`tailwind.config.ts`](tailwind.config.ts) as `brand` (teal),
`accent` (orange) and `ink` (charcoal).

**The logo**: drop the artwork at `public/logo.png` and it is picked up
automatically — no code change. Until that file exists,
[`components/Logo.tsx`](components/Logo.tsx) falls back to an SVG lockup built
from the same three swooshes.

**Dark mode**: a toggle in the header, remembered per browser in
`localStorage`. A first-time visitor follows their operating system setting, and
nothing is written until they actually click the toggle — so the dashboard keeps
tracking their system preference rather than silently pinning a choice they
never made. An inline script in [`app/layout.tsx`](app/layout.tsx) applies the
theme before first paint, so there is no white flash for dark-mode users.

Chart colours cannot be Tailwind classes because Recharts needs literal values,
so they come from `useChartTheme()` in
[`components/ThemeProvider.tsx`](components/ThemeProvider.tsx) and swap with the
theme.

## Run charts

The main chart follows the usual QI run-chart rules rather than just drawing a
line: the median is plotted, a **shift** is six or more consecutive points on one
side of it, and a **trend** is five or more consecutive moves in one direction.
Points sitting exactly on the median are skipped rather than breaking a run.
Detected shifts and trends are listed under the chart with their date ranges.

## Local development

```bash
npm install
echo "DASHBOARD_PASSWORD=choose-something" > .env.local
npm run dev
```

The sheet must be shared as **Anyone with the link → Viewer** for the CSV export
to be readable. If it is not, the dashboard shows an explicit error saying so
rather than an empty chart.

## Configuration

| Variable | Required | Purpose |
| --- | --- | --- |
| `DASHBOARD_PASSWORD` | Yes | The shared password for the gate. With it unset, every request is redirected to a page saying the dashboard is not configured — it never silently falls open. |
| `SHEET_ID` | No | Overrides the workbook id baked into `lib/sheets.ts`. |

## Layout

```
app/
  page.tsx              Server component: reads the sheet, renders the dashboard
  login/page.tsx        Password gate
  api/login|logout      Sets and clears the session cookie
  api/data              The merged dataset as JSON, if it is ever needed elsewhere
lib/
  sheets.ts             Fetches both tabs as CSV
  csv.ts                RFC-4180 parser (themes contain commas)
  transform.ts          Normalise, merge, dedupe, flag problems
  preachers.ts          Preacher name map — edit this one by hand
  aggregate.ts          KPIs, run-chart rules, groupings
components/             Charts, KPI cards, data quality panel
middleware.ts           Redirects anonymous requests to /login
```
