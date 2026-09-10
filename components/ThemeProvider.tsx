"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

export type Theme = "light" | "dark";

export const THEME_STORAGE_KEY = "brooks-theme";

interface ThemeContextValue {
  theme: Theme;
  toggle: () => void;
  /** False until the client has mounted, so SSR markup is never themed wrongly. */
  ready: boolean;
}

const ThemeContext = createContext<ThemeContextValue>({
  theme: "light",
  toggle: () => {},
  ready: false,
});

export function ThemeProvider({ children }: { children: ReactNode }) {
  // The inline script in app/layout.tsx has already set the class before paint;
  // read back from the DOM so the two never disagree.
  const [theme, setTheme] = useState<Theme>("light");
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const current = document.documentElement.classList.contains("dark")
      ? "dark"
      : "light";
    setTheme(current);
    setReady(true);
  }, []);

  /**
   * Persisting happens here and nowhere else, so only a deliberate click is
   * ever remembered. Writing on mount instead would silently record the
   * operating system's current preference as an explicit choice, and the
   * dashboard would then ignore that system setting forever after.
   *
   * A click handler is also safe from StrictMode's double invocation, unlike a
   * state updater, where a class toggle would run twice and cancel itself out.
   */
  const toggle = useCallback(() => {
    const next: Theme = theme === "dark" ? "light" : "dark";
    setTheme(next);
    try {
      window.localStorage.setItem(THEME_STORAGE_KEY, next);
    } catch {
      // Private browsing or blocked storage. The theme still applies to this
      // page view, it just will not be remembered.
    }
  }, [theme]);

  // Applying the class is idempotent, so a double render is harmless. Skipped
  // until mounted so it cannot fight the inline script in app/layout.tsx.
  useEffect(() => {
    if (!ready) return;
    document.documentElement.classList.toggle("dark", theme === "dark");
  }, [theme, ready]);

  const value = useMemo(() => ({ theme, toggle, ready }), [theme, toggle, ready]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  return useContext(ThemeContext);
}

/** Chart colours that have to be passed to Recharts as values, not classes. */
export function useChartTheme() {
  const { theme } = useTheme();
  const dark = theme === "dark";

  return useMemo(
    () => ({
      dark,
      // Logo triad: teal, orange, charcoal.
      men: dark ? "#4cbecd" : "#2494a3",
      women: dark ? "#f7a355" : "#ef8b24",
      children: dark ? "#94a3b8" : "#58595b",
      primary: dark ? "#4cbecd" : "#2494a3",
      /**
       * A deeper shade of the brand teal, for a chart that is a sibling of one
       * already using `primary` rather than a different subject. Going paler in
       * dark mode looked closer to primary than going deeper does, at 1.4:1
       * against 1.8:1, so both themes step the same way. Each still clears 3:1
       * against its own card.
       */
      primaryAlt: dark ? "#2a8b99" : "#17636e",
      accent: dark ? "#f7a355" : "#ef8b24",
      median: dark ? "#fbc389" : "#db6f13",
      grid: dark ? "#1e3339" : "#dceaed",
      axis: dark ? "#8ba3aa" : "#6d6e71",
      axisLine: dark ? "#25404a" : "#cfe2e6",
      cursor: dark ? "rgba(76,190,205,0.14)" : "rgba(53,181,194,0.12)",
      palette: dark
        ? ["#4cbecd", "#f7a355", "#94a3b8", "#a78bfa", "#f472b6"]
        : ["#2494a3", "#ef8b24", "#58595b", "#8b5cf6", "#ec4899"],
    }),
    [dark],
  );
}
