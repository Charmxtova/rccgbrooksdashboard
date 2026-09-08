import CompareClient from "@/components/CompareClient";
import Logo from "@/components/Logo";
import { fetchBothTabs, SHEET_ID, SHEET_URL } from "@/lib/sheets";
import { buildDataset } from "@/lib/transform";

/** Re-read the Google Sheet at most once every 5 minutes, same as the dashboard. */
export const revalidate = 300;

export const metadata = { title: "Compare | RCCG The Brooks" };

export default async function ComparePage() {
  let dataset = null;
  let error: string | null = null;

  try {
    const { manual, form } = await fetchBothTabs();
    dataset = buildDataset(manual, form);
  } catch (e) {
    error = e instanceof Error ? e.message : "Could not read the attendance sheet.";
  }

  if (error || !dataset) {
    return (
      <main className="mx-auto max-w-2xl px-4 py-16">
        <Logo className="mb-8" />
        <div className="card border-rose-200 bg-rose-50 p-6 dark:border-rose-500/30 dark:bg-rose-500/10">
          <h1 className="text-base font-semibold text-rose-900 dark:text-rose-200">
            Could not load the attendance sheet
          </h1>
          <p className="mt-2 text-sm text-rose-800 dark:text-rose-200/90">{error}</p>
          {SHEET_ID && (
            <a
              href={SHEET_URL}
              target="_blank"
              rel="noreferrer"
              className="mt-4 inline-block text-sm font-medium text-rose-900 underline dark:text-rose-200"
            >
              Open the sheet
            </a>
          )}
        </div>
      </main>
    );
  }

  return <CompareClient dataset={dataset} />;
}
