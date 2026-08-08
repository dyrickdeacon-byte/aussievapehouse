"use client";

import { useState } from "react";
import {
  DISCOUNT_STORAGE_KEY,
  OFFER_DONE_KEY,
  WELCOME_CODE,
} from "@/lib/discount";

export default function NewsletterForm() {
  const [email, setEmail] = useState("");
  const [state, setState] = useState<"idle" | "busy" | "done" | "error">("idle");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.includes("@")) return;
    setState("busy");
    try {
      const res = await fetch("/api/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      if (res.ok) {
        // same auto-apply flag the popup sets — checkout picks it up
        localStorage.setItem(DISCOUNT_STORAGE_KEY, WELCOME_CODE);
        localStorage.setItem(OFFER_DONE_KEY, "1");
      }
      setState(res.ok ? "done" : "error");
    } catch {
      setState("error");
    }
  }

  if (state === "done") {
    return (
      <p className="rounded-lg border border-accent/30 bg-accent/10 px-4 py-3 text-sm font-semibold text-accent">
        You&apos;re in! Your 10% off applies automatically at checkout. 🎉
      </p>
    );
  }

  return (
    <form onSubmit={submit} className="flex">
      <input
        type="email"
        required
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Your email address"
        className="w-full rounded-l-lg border border-r-0 border-line-2 bg-surface-2 px-4 py-3 text-sm outline-none transition placeholder:text-muted/60 focus:border-accent"
      />
      <button
        disabled={state === "busy"}
        className="rounded-r-lg bg-accent px-5 py-3 text-[13px] font-extrabold text-white transition hover:bg-accent-2 disabled:opacity-60"
      >
        {state === "busy" ? "…" : "Get 10% off"}
      </button>
      {state === "error" && (
        <span className="ml-3 self-center text-xs text-red-400">
          Something went wrong — try again.
        </span>
      )}
    </form>
  );
}
