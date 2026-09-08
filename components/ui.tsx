import type { ReactNode } from "react";

export function Card({
  title,
  subtitle,
  children,
  className = "",
  action,
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
  className?: string;
  action?: ReactNode;
}) {
  return (
    <section className={`card p-4 sm:p-5 ${className}`}>
      <header className="mb-4 flex items-start justify-between gap-3">
        <div>
          <h2 className="card-title">{title}</h2>
          {subtitle && <p className="card-sub">{subtitle}</p>}
        </div>
        {action}
      </header>
      {children}
    </section>
  );
}

export function EmptyChart({ message }: { message: string }) {
  return (
    <div className="flex h-[240px] items-center justify-center rounded-lg border border-dashed border-brand-200 bg-brand-50/40 px-6 text-center text-sm text-ink-500 dark:border-night-600 dark:bg-night-800/50 dark:text-slate-400">
      {message}
    </div>
  );
}

export function ChartTooltipShell({ children }: { children: ReactNode }) {
  return (
    <div className="max-w-[230px] rounded-lg border border-brand-100 bg-white p-3 text-xs shadow-lg dark:border-night-600 dark:bg-night-800">
      {children}
    </div>
  );
}
