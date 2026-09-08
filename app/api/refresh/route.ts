import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";

export const runtime = "nodejs";

/**
 * Drops the cached copy of the dashboard so the next render re-reads the sheet.
 * Without this the Refresh button would just re-run the page against the same
 * five minute cache and appear to do nothing.
 *
 * The middleware matcher covers this route, so only a signed-in session can
 * call it.
 */
export async function POST() {
  revalidatePath("/");
  return NextResponse.json({ ok: true, refreshedAt: new Date().toISOString() });
}
