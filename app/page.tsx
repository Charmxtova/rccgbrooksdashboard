import DashboardClient from "@/components/DashboardClient";
import Logo from "@/components/Logo";
import { fetchBothTabs, SHEET_URL } from "@/lib/sheets";
import { buildDataset } from "@/lib/transform";

/** Re-read the Google Sheet at most once every 5 minutes. */
export const revalidate = 300;

export default async function Page() {
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
        <div className="card border-red-200 bg-red-50 p-6">
          <h1 className="text-base font-semibold text-red-900">
            Could not load the attendance sheet
          </h1>
          <p className="mt-2 text-sm text-red-800">{error}</p>
          <a
            href={SHEET_URL}
            target="_blank"
            rel="noreferrer"
            className="mt-4 inline-block text-sm font-medium text-red-900 underline"
          >
            Open the sheet
          </a>
        </div>
      </main>
    );
  }

  return <DashboardClient dataset={dataset} sheetUrl={SHEET_URL} />;
}
