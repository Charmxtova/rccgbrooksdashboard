"use client";

import { useEffect, useState } from "react";

/**
 * Registers the service worker and, on Android Chrome, offers the install
 * prompt in the page rather than leaving it to the browser's easily missed
 * mini-infobar.
 */
interface InstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

const DISMISSED_KEY = "brooks-install-dismissed";

export default function InstallApp() {
  const [prompt, setPrompt] = useState<InstallPromptEvent | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if ("serviceWorker" in navigator) {
      // Registration failing is not worth surfacing: the dashboard works
      // perfectly well without it, only the install offer is lost.
      navigator.serviceWorker.register("/sw.js").catch(() => {});
    }
  }, []);

  useEffect(() => {
    function onPrompt(event: Event) {
      // Holding the event lets the offer be made from a button in the page,
      // which is far more visible than the browser's own hint.
      event.preventDefault();
      try {
        if (window.localStorage.getItem(DISMISSED_KEY) === "1") return;
      } catch {
        // Blocked storage just means the offer reappears next visit.
      }
      setPrompt(event as InstallPromptEvent);
    }

    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", () => setPrompt(null));
    return () => window.removeEventListener("beforeinstallprompt", onPrompt);
  }, []);

  // Browsers that never fire the event, iOS and desktop Safari among them, show
  // nothing at all rather than a button that would do nothing.
  if (!prompt) return null;

  async function install() {
    if (!prompt) return;
    setBusy(true);
    try {
      await prompt.prompt();
      await prompt.userChoice;
    } finally {
      setPrompt(null);
      setBusy(false);
    }
  }

  function dismiss() {
    try {
      window.localStorage.setItem(DISMISSED_KEY, "1");
    } catch {
      // Nothing to do; the offer simply returns on the next visit.
    }
    setPrompt(null);
  }

  return (
    <div className="card mb-6 flex flex-wrap items-center gap-3 border-l-4 border-l-brand-500 p-4">
      <svg
        viewBox="0 0 24 24"
        className="h-5 w-5 shrink-0 text-brand-500"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden
      >
        <rect x="5" y="2" width="14" height="20" rx="2" />
        <path d="M12 18h.01" />
      </svg>

      <p className="min-w-[14rem] flex-1 text-sm text-ink-700 dark:text-slate-200">
        <span className="font-semibold">Add this to your home screen</span>
        <span className="block text-xs text-ink-500 dark:text-slate-400">
          Opens full screen with no address bar, like an app.
        </span>
      </p>

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={install}
          disabled={busy}
          className="rounded-lg bg-brand-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-brand-700 disabled:opacity-70"
        >
          {busy ? "Installing" : "Install"}
        </button>
        <button
          type="button"
          onClick={dismiss}
          className="rounded-lg border border-brand-100 px-3 py-2 text-xs font-medium text-ink-600 transition hover:bg-brand-50 dark:border-night-700 dark:text-slate-300 dark:hover:bg-night-700"
        >
          Not now
        </button>
      </div>
    </div>
  );
}
