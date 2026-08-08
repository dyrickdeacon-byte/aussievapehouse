"use client";

import { useEffect, useState } from "react";
import LogoMark from "@/components/Logo";

const STORAGE_KEY = "avh_age_ok";

export default function AgeGate() {
  const [status, setStatus] = useState<"pending" | "open" | "confirmed">(
    "pending"
  );

  useEffect(() => {
    setStatus(localStorage.getItem(STORAGE_KEY) === "1" ? "confirmed" : "open");
  }, []);

  if (status !== "open") return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/85 p-4 backdrop-blur-md">
      <div className="w-full max-w-md rounded-2xl border border-line-2 bg-surface p-8 text-center shadow-2xl">
        <LogoMark size={88} className="mx-auto" />
        <p className="font-display mt-3 text-3xl">
          AUSSIE <span className="text-accent">VAPE</span> HOUSE
        </p>
        <h1 className="mt-6 text-xl font-semibold">Are you 18 or over?</h1>
        <p className="mt-3 text-sm leading-relaxed text-muted">
          This site sells age-restricted products containing nicotine.
          Nicotine is an addictive chemical. You must be of legal age to enter.
        </p>
        <div className="mt-6 flex gap-3">
          <button
            onClick={() => {
              localStorage.setItem(STORAGE_KEY, "1");
              setStatus("confirmed");
            }}
            className="glow-accent flex-1 rounded-lg bg-accent px-4 py-3 text-sm font-bold text-white transition hover:bg-accent-2"
          >
            Yes, I&apos;m 18+
          </button>
          <a
            href="https://www.google.com"
            className="flex-1 rounded-lg border border-line-2 px-4 py-3 text-sm font-semibold text-muted transition hover:bg-surface-2"
          >
            No, exit
          </a>
        </div>
      </div>
    </div>
  );
}
