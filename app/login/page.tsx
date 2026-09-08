import Logo from "@/components/Logo";
import ThemeToggle from "@/components/ThemeToggle";

export const metadata = { title: "Sign in | RCCG The Brooks" };

export default function LoginPage({
  searchParams,
}: {
  searchParams: { error?: string; unconfigured?: string };
}) {
  const wrongPassword = searchParams.error === "1";
  const unconfigured = searchParams.unconfigured === "1";

  return (
    <main className="relative flex min-h-screen items-center justify-center px-4">
      <div className="absolute right-4 top-4">
        <ThemeToggle />
      </div>

      <div className="w-full max-w-sm">
        <div className="mb-6 flex flex-col items-center gap-3">
          <Logo />
          <div className="brand-rule w-24" />
          <p className="text-sm font-semibold text-ink-700 dark:text-slate-100">
            Attendance Dashboard
          </p>
        </div>

        <div className="card p-6">
          {unconfigured ? (
            <div className="rounded-lg border border-accent-200 bg-accent-50 p-4 text-sm text-accent-900 dark:border-accent-500/30 dark:bg-accent-500/10 dark:text-accent-100">
              <p className="font-semibold">Dashboard not configured</p>
              <p className="mt-1">
                No <code className="font-mono text-xs">DASHBOARD_PASSWORD</code> is
                set. Add it under Vercel → Settings → Environment Variables, then
                redeploy.
              </p>
            </div>
          ) : (
            <form action="/api/login" method="POST" className="space-y-4">
              <div>
                <label
                  htmlFor="password"
                  className="block text-sm font-medium text-ink-700 dark:text-slate-200"
                >
                  Dashboard password
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoFocus
                  autoComplete="current-password"
                  required
                  className="mt-1.5 w-full rounded-lg border border-brand-200 bg-white px-3 py-2 text-sm text-ink-700 outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100 dark:border-night-600 dark:bg-night-900 dark:text-slate-100 dark:focus:ring-brand-900"
                />
              </div>

              {wrongPassword && (
                <p className="text-sm text-rose-600 dark:text-rose-400">
                  That password was not correct. Please try again.
                </p>
              )}

              <button
                type="submit"
                className="w-full rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-300 dark:bg-brand-600 dark:hover:bg-brand-500"
              >
                View dashboard
              </button>
            </form>
          )}
        </div>

        <p className="mt-4 text-center text-xs text-ink-500 dark:text-slate-400">
          Attendance figures are for church leadership.
        </p>
      </div>
    </main>
  );
}
