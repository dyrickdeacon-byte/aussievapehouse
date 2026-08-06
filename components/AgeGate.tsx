"use client";

import { useEffect, useState } from "react";

const STORAGE_KEY = "vapeaussie_age_ok";

export default function AgeGate() {
  const [status, setStatus] = useState<"pending" | "open" | "confirmed">(
    "pending"
  );

  useEffect(() => {
    setStatus(localStorage.getItem(STORAGE_KEY) === "1" ? "confirmed" : "open");
  }, []);

  if (status !== "open") return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-md">
      <div className="w-full max-w-md rounded-2xl border border-line bg-surface p-8 text-center shadow-2xl">
        <p className="text-3xl font-bold tracking-tight">
          Vape<span className="text-accent">Aussie</span>
        </p>
        <h1 className="mt-6 text-xl font-semibold">Are you 18 or over?</h1>
        <p className="mt-3 text-sm leading-relaxed text-muted">
          This site sells age-restricted products containing nicotine. Nicotine
          is an addictive chemical. You must be 18+ to enter.
        </p>
        <div className="mt-6 flex gap-3">
          <button
            onClick={() => {
              localStorage.setItem(STORAGE_KEY, "1");
              setStatus("confirmed");
            }}
            className="flex-1 rounded-lg bg-accent-strong px-4 py-3 text-sm font-semibold text-black transition hover:bg-accent"
          >
            Yes, I am 18+
          </button>
          <a
            href="https://www.google.com"
            className="flex-1 rounded-lg border border-line px-4 py-3 text-sm font-semibold text-muted transition hover:bg-surface-2"
          >
            No, exit
          </a>
        </div>
        <p className="mt-4 text-xs text-muted">
          In Australia, nicotine vaping products are available through
          pharmacies only.
        </p>
      </div>
    </div>
  );
}
