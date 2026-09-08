import { NextResponse } from "next/server";
import { fetchBothTabs } from "@/lib/sheets";
import { buildDataset } from "@/lib/transform";

/** Re-read the sheet at most once every 5 minutes. */
export const revalidate = 300;
export const runtime = "nodejs";

export async function GET() {
  try {
    const { manual, form } = await fetchBothTabs();
    return NextResponse.json(buildDataset(manual, form));
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unknown error reading the sheet";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
