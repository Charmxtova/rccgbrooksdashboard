import { NextResponse, type NextRequest } from "next/server";
import { AUTH_COOKIE, dashboardPassword, safeEqual, tokenFor } from "./lib/auth";

export async function middleware(req: NextRequest) {
  const password = dashboardPassword();

  // With no password configured the dashboard would be silently open, which is
  // worse than failing loudly — send everyone to the login page's error state.
  if (!password) {
    if (req.nextUrl.pathname === "/login") return NextResponse.next();
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("unconfigured", "1");
    return NextResponse.redirect(url);
  }

  const cookie = req.cookies.get(AUTH_COOKIE)?.value ?? "";
  const expected = await tokenFor(password);

  if (safeEqual(cookie, expected)) {
    // Already signed in: keep them off the login page.
    if (req.nextUrl.pathname === "/login") {
      const url = req.nextUrl.clone();
      url.pathname = "/";
      url.search = "";
      return NextResponse.redirect(url);
    }
    return NextResponse.next();
  }

  if (req.nextUrl.pathname === "/login") return NextResponse.next();

  const url = req.nextUrl.clone();
  url.pathname = "/login";
  url.search = "";
  return NextResponse.redirect(url);
}

export const config = {
  matcher: [
    /**
     * Everything except Next internals, the login API, and static assets.
     *
     * Image files are matched by extension rather than by name. Naming one file
     * meant that renaming the logo left the middleware guarding it, so the
     * image 307'd to /login and the header silently fell back to its SVG
     * placeholder for anyone not yet signed in.
     *
     * The three progressive web app files are excluded for the same reason.
     * A browser fetches the manifest with credentials omitted, so gating it
     * would redirect that request to the sign-in page and the app would never
     * become installable. None of the three carry anything private: the
     * manifest holds a name and icon paths, the worker holds no data at all,
     * and the offline page is a fixed message.
     */
    "/((?!_next/static|_next/image|api/login|favicon\\.ico|robots\\.txt|manifest\\.webmanifest|sw\\.js|offline\\.html|.*\\.(?:png|jpe?g|svg|gif|webp|ico|avif)$).*)",
  ],
};
