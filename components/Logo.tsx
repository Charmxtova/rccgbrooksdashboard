/**
 * Placeholder wordmark. To use the real church logo, drop the artwork at
 * public/logo.png and replace the <svg> below with:
 *   <img src="/logo.png" alt="RCCG The Brooks" className="h-10 w-auto" />
 */
export default function Logo({ className = "" }: { className?: string }) {
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <svg
        viewBox="0 0 40 40"
        className="h-10 w-10 shrink-0"
        role="img"
        aria-label="RCCG The Brooks"
      >
        <circle cx="20" cy="20" r="19" fill="#1e2d8a" />
        <path
          d="M8 25c3.2 0 3.2-3.4 6.4-3.4S17.6 25 20.8 25s3.2-3.4 6.4-3.4S30.4 25 33 25"
          fill="none"
          stroke="#2dd4bf"
          strokeWidth="2.2"
          strokeLinecap="round"
        />
        <path
          d="M8 30c3.2 0 3.2-3.4 6.4-3.4S17.6 30 20.8 30s3.2-3.4 6.4-3.4S30.4 30 33 30"
          fill="none"
          stroke="#60a5fa"
          strokeWidth="1.6"
          strokeLinecap="round"
          opacity="0.7"
        />
        <path
          d="M20 8v9M16.5 11.5h7"
          stroke="#ffffff"
          strokeWidth="2.2"
          strokeLinecap="round"
        />
      </svg>
      <div className="leading-tight">
        <div className="text-base font-bold tracking-tight text-slate-900">
          RCCG The Brooks
        </div>
        <div className="text-xs text-slate-500">Attendance Dashboard</div>
      </div>
    </div>
  );
}
