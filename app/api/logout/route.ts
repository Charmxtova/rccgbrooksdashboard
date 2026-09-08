import { NextResponse } from "next/server";
import { AUTH_COOKIE } from "@/lib/auth";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const origin = new URL(request.url).origin;
  const response = NextResponse.redirect(`${origin}/login`, 303);
  response.cookies.set({ name: AUTH_COOKIE, value: "", path: "/", maxAge: 0 });
  return response;
}
