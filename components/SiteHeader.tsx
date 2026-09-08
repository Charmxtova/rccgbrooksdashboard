"use client";

import Link from "next/link";
import { formatDate } from "@/lib/aggregate";
import Logo from "./Logo";
import RefreshButton from "./RefreshButton";
import ThemeToggle from "./ThemeToggle";

/** Public response link for the attendance form, not the editor URL. */
const FORM_URL =
  "https://docs.google.com/forms/d/e/1FAIpQLScVj9KxawUSBTVCIOfLmBJFUvLFMIw1c5ZYWjslBFifJgrfwQ/viewform";

const NAV = [
  { href: "/", label: "Dashboard" },
  { href: "/compare", label: "Compare" },
];

export default function SiteHeader({
  title,
  latestDate,
  current,
}: {
  title: string;
  latestDate?: string | null;
  current: "/" | "/compare";
}) {
  return (
    <header className="mb-5">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Logo />
          <div>
            <p className="text-base font-bold tracking-tight text-ink-700 dark:text-slate-50">
              {title}
            </p>
            <p className="text-xs text-ink-500 dark:text-slate-400">RCCG The Brooks</p>
            {latestDate && (
              <span className="mt-1.5 inline-flex items-center gap-2 rounded-md border border-brand-200 bg-brand-50 px-2 py-1 dark:border-night-600 dark:bg-night-800">
                <span className="text-[11px] font-medium text-ink-500 dark:text-slate-400">
                  Most recent service
                </span>
                <span className="text-[11px] font-bold text-ink-800 dark:text-slate-100">
                  {formatDate(latestDate)}
                </span>
              </span>
            )}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <a
            href={FORM_URL}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 rounded-lg bg-accent-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-accent-700"
          >
            <svg
              viewBox="0 0 24 24"
              className="h-3.5 w-3.5"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
              aria-hidden
            >
              <path d="M12 5v14M5 12h14" />
            </svg>
            Enter data
          </a>
          <RefreshButton />
          <ThemeToggle />
          <form action="/api/logout" method="POST">
            <button
              type="submit"
              className="rounded-lg border border-brand-100 px-3 py-2 text-xs font-medium text-ink-600 transition hover:bg-brand-50 hover:text-brand-700 dark:border-night-700 dark:text-slate-300 dark:hover:bg-night-700"
            >
              Sign out
            </button>
          </form>
        </div>
      </div>

      <nav className="mt-4 flex gap-1">
        {NAV.map((item) => {
          const active = item.href === current;
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={`rounded-t-lg px-3 py-1.5 text-xs font-semibold transition ${
                active
                  ? "bg-brand-500 text-white dark:bg-brand-600"
                  : "text-ink-600 hover:bg-brand-50 dark:text-slate-300 dark:hover:bg-night-800"
              }`}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>
      <div className="brand-rule" />
    </header>
  );
}
