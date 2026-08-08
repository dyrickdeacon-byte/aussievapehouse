"use client";

import { useState } from "react";
import { REVIEWS, averageRating, initialsOf } from "@/lib/reviews";

// Google-style review cards: initials avatar, gold stars, verified tag.
const AVATAR_TINTS = [
  "bg-[#b4451c]",
  "bg-[#9c731a]",
  "bg-[#2f6d5f]",
  "bg-[#8a2f1a]",
  "bg-[#c2691f]",
];

function Stars({ n = 5, size = 14 }: { n?: number; size?: number }) {
  return (
    <span className="inline-flex gap-[1px]" aria-label={`${n} out of 5 stars`}>
      {Array.from({ length: n }, (_, i) => (
        <svg key={i} width={size} height={size} viewBox="0 0 24 24" fill="#f5a623" aria-hidden>
          <path d="m12 2.6 2.9 5.9 6.5.9-4.7 4.6 1.1 6.4-5.8-3-5.8 3 1.1-6.4L2.6 9.4l6.5-.9z" />
        </svg>
      ))}
    </span>
  );
}

export default function Reviews() {
  const [expanded, setExpanded] = useState(false);
  const visible = expanded ? REVIEWS : REVIEWS.slice(0, 6);

  return (
    <div>
      {/* Aggregate summary */}
      <div className="flex flex-wrap items-center gap-x-5 gap-y-2 rounded-xl border border-line bg-surface px-5 py-4">
        <div className="flex items-baseline gap-2">
          <span className="font-display text-4xl leading-none">
            {averageRating.toFixed(1)}
          </span>
          <span className="text-sm text-muted">out of 5</span>
        </div>
        <div>
          <Stars size={17} />
          <p className="mt-1 text-xs text-muted">
            Based on {REVIEWS.length} customer reviews
          </p>
        </div>
      </div>

      {/* Cards */}
      <div className="mt-5 grid gap-3.5 sm:grid-cols-2 lg:grid-cols-3">
        {visible.map((r, i) => (
          <figure
            key={r.name + i}
            className="flex h-full flex-col rounded-xl border border-line bg-surface p-5 transition hover:border-accent/40"
          >
            <div className="flex items-center gap-3">
              <span
                className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-[13px] font-bold text-white ${
                  AVATAR_TINTS[i % AVATAR_TINTS.length]
                }`}
                aria-hidden
              >
                {initialsOf(r.name)}
              </span>
              <div className="min-w-0">
                <figcaption className="truncate text-sm font-semibold">
                  {r.name}
                </figcaption>
                <Stars n={r.rating} />
              </div>
            </div>
            <blockquote className="mt-3 text-[13.5px] leading-relaxed text-muted">
              {r.text}
            </blockquote>
            <p className="mt-3 flex items-center gap-1.5 text-[11px] font-semibold text-eucalypt">
              <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                <path d="m4 12.5 5 5L20 6.5" />
              </svg>
              Verified customer
            </p>
          </figure>
        ))}
      </div>

      {REVIEWS.length > 6 && (
        <div className="mt-6 text-center">
          <button
            onClick={() => setExpanded((v) => !v)}
            className="rounded-lg border border-accent px-7 py-2.5 text-[13px] font-bold uppercase tracking-wider text-accent transition hover:bg-accent hover:text-white"
          >
            {expanded ? "Show fewer reviews" : `Read all ${REVIEWS.length} reviews`}
          </button>
        </div>
      )}
    </div>
  );
}
