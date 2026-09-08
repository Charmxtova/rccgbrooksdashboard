import { NextResponse } from "next/server";
import { AUTH_COOKIE, dashboardPassword, tokenFor } from "@/lib/auth";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const form = await request.formData();
  const submitted = String(form.get("password") ?? "");
  const expected = dashboardPassword();

  const origin = new URL(request.url).origin;

  if (!expected) {
    return NextResponse.redirect(`${origin}/login?unconfigured=1`, 303);
  }
  if (submitted !== expected) {
    return NextResponse.redirect(`${origin}/login?error=1`, 303);
  }

  const response = NextResponse.redirect(origin, 303);
  response.cookies.set({
    name: AUTH_COOKIE,
    value: await tokenFor(expected),
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
  return response;
}
