# RCCG The Brooks, Attendance Dashboard

A password-gated dashboard of service attendance for RCCG The Brooks, built with
Next.js and read live from the church's Google Sheet. Nothing is copied into a
database: every page load reads the sheet, so adding a row in Google Sheets is
all it takes to update the dashboard.

Live at https://rccgbrooksdashboard.vercel.app

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

These are applied silently in the data layer. They are not shown in the UI, so
they are recorded here instead.

- **Attendance is Men + Women + Children**, not the typed `TOTAL` column. Six
  rows disagree with their own breakdown (16 Jul 2023 records a total of 257
  against a breakdown summing to 187). Recomputing keeps every KPI consistent
  with every chart.
- **Sunday is the default filter.** Sundays average about 130 and midweek
  services about 45, so plotting them on one run chart makes the median line
  meaningless. The service dropdown switches between them.
- **Preacher names are normalised.** The column is free text, so one person
  appears under many spellings: "Pastor Femi Luther-Abegunde", "Pastor Femi",
  "Femi Luther" and "Pst Femi Luther Abegunde" are all the same person. The map
  lives in [`lib/preachers.ts`](lib/preachers.ts) and is easy to edit. "Pastor
  Segun Aderibigbe", "Seun Aderibigbe" and "Bro Sola Aderibigbe" were confirmed
  by the church as one man and are merged. Two genuinely ambiguous entries are
  left alone and listed in `UNCERTAIN` in that same file.
- **Duplicate rows are collapsed.** Every March 2025 service is entered twice in
  the source sheet. They are counted once here, but they are still duplicated at
  source and worth deleting there.
- **New Converts has never been filled in**, so that KPI was removed. The column
  is still read and still reaches `/api/data` if it is ever populated.

## Controls

- **Service**, **Period** and **Month** dropdowns, plus a **From** and **To**
  date range. They all compose: picking 2025 and a From date of 1 June gives
  June to December 2025. A Clear dates button appears once either date is set.
  Month only ever offers months that exist inside the chosen period, and falls
  back to every month if changing the period strips the selection out, rather
  than leaving a stale month quietly matching nothing.
- **Enter data** opens the attendance Google Form in a new tab. It points at the
  form's public response URL, not the `/edit` editor URL, which would prompt
  people to sign in as an editor instead of letting them submit.
- **Refresh** calls `/api/refresh`, which runs `revalidatePath("/")` and then
  re-renders. Without dropping the cache first the button would re-run the page
  against the same five minute cache and appear to do nothing.

## The compare page

`/compare` puts two groups of services side by side. Each group is defined with
the same five filters as the dashboard, so a group can be a year, a month, a
date range, one service type, or any combination. Set A is teal and Set B is
orange throughout, matching the two logo swooshes.

It shows three things: computed insights in plain sentences, a side by side
table of eleven metrics with the difference, and both groups' attendance
overlaid on one chart. Every card repeats which dates each group covers, since
none of the numbers mean anything without that and scrolling back to the
pickers to check is a poor substitute.

**Export CSV** on the Side by side card downloads the whole comparison: both
group definitions and date ranges, every metric with its difference, and the
insight sentences. Numbers are written unformatted so a spreadsheet can total
and chart them, with any percent sign moved into the metric name rather than
glued to the value. The file is quoted per RFC 4180, which matters because the
insight sentences contain commas, and carries a byte order mark so Excel opens
it as UTF-8.

### The indicator profile radar

Key insights opens with a radar comparing the two groups across six size
independent indicators. It is built from the same rows the side by side table
renders, in
[`lib/metrics.ts`](lib/metrics.ts), so the two views can never drift apart.

Each row carries an optional `radar` override, which can shorten the label for
the ring, plot different figures from the table, or drop the row entirely with
`radar: false`. A whole section leaves the radar with `inRadar: false`. The
three shares are excluded that way: Men, Women and Children sum to about 100, so
they move against each other rather than independently and would add three near
identical axes without a third dimension.

The legend sits under the chart and carries each group's date range, so the
colours and the period they cover are read in one place. That is why the Key
insights card has no separate coverage note: it would repeat the legend a few
lines above it.

Note that the chart carries no explanatory caption on screen, so the
normalisation described below is documented here rather than in the interface.
The tooltip still shows each indicator's real figures.

The catch with a radar is that every axis has to share one scale, and these
indicators do not: attendance runs into the hundreds, shares are percentages,
first timers are single figures. So **each axis is normalised on its own**, with
whichever group leads it pinned to 100 and the other drawn in proportion. That
makes the chart a comparison of shape, not of absolute size. A point on the
outer ring means "ahead on this axis", never "good". The tooltip carries the
real figures so nothing has to be read off the rings.

Two consequences fall out of that:

- **Nothing on the radar scales with group size.** Raw counts and totals are
  kept off it with `radar: false`, since comparing 51 Sundays against 35 would
  otherwise show the bigger group ahead on those axes almost by definition. The
  participation rows carry a `radar` override plotting a per service rate, so
  the table can show 111 first timers while the radar shows 2.8 per service.
  `RadarOverride.invert` handles any metric where a smaller figure is the better
  showing, though none of the current axes need it.
- **An axis missing from either group is dropped, not zeroed.** A zero would
  draw a dent that reads as a finding rather than a gap in the sheet. Dropped
  axes are named underneath. Below three shared indicators the radar is replaced
  by a note, since three points is the minimum that encloses a shape.
- **The export carries it.** The CSV gains an Indicator profile block with each
  indicator, both raw figures, and the two index columns the radar actually
  plots.

Two decisions worth knowing:

- **The overlay plots by service number, not by date.** Group A's first service
  sits against group B's first service. Comparing 51 Sundays in 2025 with 24
  Wednesdays spread over three years has no shared time axis, so a date axis
  would leave one line stranded at one end of the chart.
- **The overlay draws dots, and that is load bearing.** A group holding a single
  service renders nothing at all without them, because a line needs two points
  to make a segment, so the group looks empty when it is not. Dots are dropped
  only once a series passes 80 points and they stop being readable.
- **The insights are computed, never inferred.** Each sentence in
  [`lib/compare.ts`](lib/compare.ts) restates arithmetic, so it cannot overstate
  what the data shows. Where a figure is missing on one side, the comparison is
  skipped rather than guessed. It warns when a group has fewer than four
  services, since a percentage built on three numbers is close to meaningless,
  and it says how many services in each group have no attendance recorded.

Both pages share [`lib/filters.ts`](lib/filters.ts) for the filter logic and
[`components/FilterControls.tsx`](components/FilterControls.tsx) for the
controls, so a change to filtering behaviour only needs making once.

## Branding and theming

Colours are taken from the church logo: the teal wordmark, the orange swoosh,
and the charcoal of "The" and the tagline. Those three are also the categorical
chart palette, so Men / Women / Children read as the logo's own triad. They are
defined once in [`tailwind.config.ts`](tailwind.config.ts) as `brand` (teal),
`accent` (orange) and `ink` (charcoal). The KPI cards add the green and red of
the RCCG roundel so each card carries its own fill.

Those KPI fills are darkened versions of the logo colours. The logo teal and
orange sit at 3.6:1 and 2.5:1 against white text, both under the 4.5:1 that WCAG
AA asks for body text, so the raw brand colours are not used as card fills.
Every fill in `TONE_FILL` clears 4.5:1. The change badge on each card is green
for a rise and yellow for a fall, kept as a light chip with dark text because it
has to stay legible on all six fills.

**The logo** lives at `public/logo.jpg`. It is a JPEG on a solid white
background, so [`components/Logo.tsx`](components/Logo.tsx) sits it inside a
white rounded panel, which reads as deliberate in dark mode rather than looking
like a stray white rectangle. Supplying a transparent PNG instead would let that
panel be dropped. If the file is ever missing, the component falls back to an
SVG lockup built from the same three swooshes.

**Dark mode** is a toggle in the header, remembered per browser in
`localStorage`. A first-time visitor follows their operating system setting, and
nothing is written until they actually click the toggle, so the dashboard keeps
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
cp .env.example .env.local   # then fill in both values
npm run dev
```

Do not run `npm run build` while `npm run dev` is running. The build overwrites
the `.next` directory the dev server is serving from, and the page then loads
with 404s on its client bundle and renders no charts.

The sheet must be shared as **Anyone with the link, Viewer** for the CSV export
to be readable. If it is not, the dashboard shows an explicit error saying so
rather than an empty chart.

## Configuration

Both variables are required. Set them in Vercel under Settings, then Environment
Variables, and in `.env.local` for local development.

| Variable | Purpose |
| --- | --- |
| `DASHBOARD_PASSWORD` | The shared password for the gate. With it unset, every request is redirected to a page saying the dashboard is not configured. It never silently falls open. |
| `SHEET_ID` | The Google Sheets workbook id, taken from the sheet URL. Kept out of the code so it is not published in this repository. |

## Layout

```
app/
  page.tsx              Server component: reads the sheet, renders the dashboard
  login/page.tsx        Password gate
  api/login|logout      Sets and clears the session cookie
  api/data              The merged dataset as JSON, including data-quality notes
  api/refresh           Clears the route cache for the Refresh button
  compare/page.tsx      Two group comparison with computed insights
lib/
  sheets.ts             Fetches both tabs as CSV
  csv.ts                RFC-4180 parser (themes contain commas)
  transform.ts          Normalise, merge, dedupe, flag problems
  preachers.ts          Preacher name map, edit this one by hand
  aggregate.ts          KPIs, run-chart rules, groupings
  filters.ts            Filter state and the logic both pages share
  compare.ts            Group statistics and the computed insight sentences
  metrics.ts            Metric row types shared by the table, radar and export
  exportCsv.ts          RFC 4180 quoting and the comparison CSV builder
components/             Charts, KPI cards, theme provider
middleware.ts           Redirects anonymous requests to /login
```
