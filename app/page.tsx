import DashboardClient from "@/components/DashboardClient";
import SheetError from "@/components/SheetError";
import { fetchBothTabs } from "@/lib/sheets";
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
    return <SheetError message={error ?? "Unknown error."} />;
  }

  return <DashboardClient dataset={dataset} />;
}
