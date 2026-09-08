import Logo from "@/components/Logo";

export const metadata = { title: "Sign in | RCCG The Brooks" };

export default function LoginPage({
  searchParams,
}: {
  searchParams: { error?: string; unconfigured?: string };
}) {
  const wrongPassword = searchParams.error === "1";
  const unconfigured = searchParams.unconfigured === "1";

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-sm">
        <div className="mb-6 flex justify-center">
          <Logo />
        </div>

        <div className="card p-6">
          {unconfigured ? (
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
              <p className="font-semibold">Dashboard not configured</p>
              <p className="mt-1">
                No <code className="font-mono text-xs">DASHBOARD_PASSWORD</code>{" "}
                is set. Add it under Vercel → Settings → Environment Variables,
                then redeploy.
              </p>
            </div>
          ) : (
            <form action="/api/login" method="POST" className="space-y-4">
              <div>
                <label
                  htmlFor="password"
                  className="block text-sm font-medium text-slate-700"
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
                  className="mt-1.5 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
                />
              </div>

              {wrongPassword && (
                <p className="text-sm text-red-600">
                  That password was not correct. Please try again.
                </p>
              )}

              <button
                type="submit"
                className="w-full rounded-lg bg-brand-700 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-800 focus:outline-none focus:ring-2 focus:ring-brand-300"
              >
                View dashboard
              </button>
            </form>
          )}
        </div>

        <p className="mt-4 text-center text-xs text-slate-500">
          Attendance figures are for church leadership.
        </p>
      </div>
    </main>
  );
}
