"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Uses the real church artwork at public/logo.png as soon as that file exists.
 * Until then it falls back to the SVG lockup below, which borrows the logo's
 * three swooshes (teal, orange, charcoal) so the header is on-brand either way.
 * Nothing needs changing when the PNG is added — it is picked up automatically.
 */
export default function Logo({
  className = "",
  showTagline = true,
}: {
  className?: string;
  showTagline?: boolean;
}) {
  const [artworkFailed, setArtworkFailed] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);

  // The image usually finishes loading (or failing) before React hydrates, so
  // the onError handler never fires. Re-check the element once on mount:
  // a complete image with zero natural width is a broken one.
  useEffect(() => {
    const el = imgRef.current;
    if (el && el.complete && el.naturalWidth === 0) setArtworkFailed(true);
  }, []);

  if (!artworkFailed) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        ref={imgRef}
        src="/logo.png"
        alt="RCCG The Brooks"
        className={`h-12 w-auto sm:h-14 ${className}`}
        onError={() => setArtworkFailed(true)}
      />
    );
  }

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <svg
        viewBox="0 0 44 44"
        className="h-11 w-11 shrink-0"
        role="img"
        aria-label="RCCG The Brooks"
      >
        {/* The three swooshes that sit above the "oo" in the church logo. */}
        <path
          d="M14 34c0-11 4.5-19 11-24"
          fill="none"
          stroke="#35b5c2"
          strokeWidth="4.5"
          strokeLinecap="round"
        />
        <path
          d="M22 34c0-9.5 3.6-16.5 8.8-21"
          fill="none"
          stroke="#58595b"
          strokeWidth="3.6"
          strokeLinecap="round"
        />
        <path
          d="M30 34c0-8 2.8-14 6.6-18"
          fill="none"
          stroke="#ef8b24"
          strokeWidth="4.2"
          strokeLinecap="round"
        />
      </svg>

      <div className="leading-tight">
        <div className="text-lg font-bold tracking-tight">
          <span className="text-ink-600 dark:text-slate-300">The </span>
          <span className="text-brand-500">Brooks</span>
        </div>
        {showTagline && (
          <div className="text-[11px] italic text-ink-500 dark:text-slate-400">
            Raising Impactful Leaders
          </div>
        )}
      </div>
    </div>
  );
}
