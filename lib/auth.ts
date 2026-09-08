/**
 * A single shared password for the whole dashboard, since church leadership are all
 * looking at the same aggregate numbers, so there are no per-user accounts.
 * The cookie holds a SHA-256 of the password rather than the password itself,
 * and is httpOnly so page scripts cannot read it.
 */
export const AUTH_COOKIE = "brooks_session";

export function dashboardPassword(): string {
  return process.env.DASHBOARD_PASSWORD ?? "";
}

export async function tokenFor(password: string): Promise<string> {
  const data = new TextEncoder().encode(`rccg-the-brooks:${password}`);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

/** Length-independent comparison, so timing does not leak the token. */
export function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}
