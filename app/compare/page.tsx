import CompareClient from "@/components/CompareClient";
import SheetError from "@/components/SheetError";
import { fetchBothTabs } from "@/lib/sheets";
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
    return <SheetError message={error ?? "Unknown error."} />;
  }

  return <CompareClient dataset={dataset} />;
}
