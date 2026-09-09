"use client";

import { useTheme } from "./ThemeProvider";

/**
 * The icon and wording are shown and hidden with `dark:` classes rather than
 * from React state. The inline script in app/layout.tsx sets the theme class
 * before first paint, so CSS already knows which way round to render, whereas
 * React does not until it hydrates. Gating on that left the button empty and
 * then jumping to its full width, which is worse than a static label.
 */
export default function ThemeToggle({
  /**
   * Shows the wording beside the icon. The header has no room for it, but on a
   * near empty page an unlabelled icon in a corner is easy to miss entirely.
   */
  showLabel = false,
}: {
  showLabel?: boolean;
}) {
  const { theme, toggle, ready } = useTheme();

  return (
    <button
      type="button"
      onClick={toggle}
      // Assistive text needs one value, so it stays neutral until the theme is
      // actually known rather than announcing a state that may be wrong.
      aria-label={
        ready
          ? theme === "dark"
            ? "Switch to light mode"
            : "Switch to dark mode"
          : "Toggle dark mode"
      }
      title={
        ready
          ? theme === "dark"
            ? "Switch to light mode"
            : "Switch to dark mode"
          : "Toggle dark mode"
      }
      className={`inline-flex items-center justify-center gap-2 rounded-lg border border-brand-100 bg-white text-ink-600 transition hover:bg-brand-50 hover:text-brand-700 focus:outline-none focus:ring-2 focus:ring-brand-300 dark:border-night-700 dark:bg-night-800 dark:text-slate-300 dark:hover:bg-night-700 dark:hover:text-brand-300 ${
        showLabel ? "px-3 py-2 text-xs font-medium" : "h-9 w-9"
      }`}
    >
      {/* Sun, shown in dark mode as the way back out of it. */}
      <svg
        viewBox="0 0 24 24"
        className="hidden h-4 w-4 dark:block"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        aria-hidden
      >
        <circle cx="12" cy="12" r="4" />
        <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
      </svg>

      {/* Moon, shown in light mode. */}
      <svg
        viewBox="0 0 24 24"
        className="h-4 w-4 dark:hidden"
        fill="currentColor"
        aria-hidden
      >
        <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8Z" />
      </svg>

      {showLabel && (
        <>
          <span className="hidden dark:inline">Switch to light mode</span>
          <span className="dark:hidden">Switch to dark mode</span>
        </>
      )}
    </button>
  );
}
