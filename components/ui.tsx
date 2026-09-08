import type { ReactNode } from "react";

export const CHART_COLORS = {
  men: "#2547eb",
  women: "#14b8a6",
  children: "#f59e0b",
  primary: "#2547eb",
  accent: "#14b8a6",
  muted: "#94a3b8",
  median: "#f97316",
};

export const PIE_PALETTE = ["#2547eb", "#14b8a6", "#f59e0b", "#8b5cf6", "#ec4899"];

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
    <div className="flex h-[240px] items-center justify-center rounded-lg border border-dashed border-slate-200 bg-slate-50/60 px-6 text-center text-sm text-slate-500">
      {message}
    </div>
  );
}
