"use client";

import { useEffect, useRef, useState } from "react";
import Medallion from "@/components/Medallion";
import {
  DISCOUNT_STORAGE_KEY,
  OFFER_DONE_KEY,
  WELCOME_CODE,
} from "@/lib/discount";

// 10%-off popup: appears 10 seconds after the age gate is confirmed,
// once per visitor. Signing up stores the code locally so checkout
// auto-applies it — same flag the on-page newsletter form sets.
export default function OfferPopup() {
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [state, setState] = useState<"idle" | "busy" | "done">("idle");
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  useEffect(() => {
    if (localStorage.getItem(OFFER_DONE_KEY)) return;
    if (localStorage.getItem(DISCOUNT_STORAGE_KEY)) return;

    const poll = setInterval(() => {
      if (localStorage.getItem("avh_age_ok") === "1") {
        clearInterval(poll);
        timers.current.push(setTimeout(() => setOpen(true), 10_000));
      }
    }, 500);
    timers.current.push(poll as unknown as ReturnType<typeof setTimeout>);
    return () => timers.current.forEach(clearTimeout);
  }, []);

  function dismiss() {
    localStorage.setItem(OFFER_DONE_KEY, "1");
    setOpen(false);
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.includes("@")) return;
    setState("busy");
    try {
      await fetch("/api/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
    } catch {
      // still grant the code — the signup capture is best-effort
    }
    localStorage.setItem(DISCOUNT_STORAGE_KEY, WELCOME_CODE);
    localStorage.setItem(OFFER_DONE_KEY, "1");
    setState("done");
    timers.current.push(setTimeout(() => setOpen(false), 3200));
  }

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[90] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
      onClick={dismiss}
    >
      <div
        className="dot-field relative w-full max-w-md rounded-2xl border border-line-2 bg-surface p-8 text-center shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={dismiss}
          aria-label="Close offer"
          className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full text-muted transition hover:bg-surface-2 hover:text-foreground"
        >
          ✕
        </button>
        <Medallion variant={1} size={56} className="mx-auto" />
        {state === "done" ? (
          <>
            <h2 className="font-display mt-4 text-3xl">You're in! 🎉</h2>
            <p className="mt-2 text-sm leading-relaxed text-muted">
              <b className="text-foreground">{WELCOME_CODE}</b> is locked in —
              your 10% off applies automatically at checkout.
            </p>
          </>
        ) : (
          <>
            <h2 className="font-display mt-4 text-3xl">
              Here's <em className="not-italic text-accent">10% off</em> your
              first order
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-muted">
              Drop your email and we'll apply the discount automatically at
              checkout — no code to remember.
            </p>
            <form onSubmit={submit} className="mt-5 flex">
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Your email address"
                className="w-full rounded-l-lg border border-r-0 border-line-2 bg-background px-4 py-3 text-sm outline-none focus:border-accent"
              />
              <button
                disabled={state === "busy"}
                className="rounded-r-lg bg-accent px-5 py-3 text-[13px] font-extrabold text-white transition hover:bg-accent-2 disabled:opacity-60"
              >
                {state === "busy" ? "…" : "Claim 10%"}
              </button>
            </form>
            <button
              onClick={dismiss}
              className="mt-3 text-xs text-muted underline-offset-2 hover:underline"
            >
              No thanks, I'll pay full price
            </button>
          </>
        )}
      </div>
    </div>
  );
}
