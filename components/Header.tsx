"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useCart } from "@/lib/cart";
import LogoMark from "@/components/Logo";

const NAV = [
  { href: "/shop", label: "Shop All" },
  { href: "/shop?group=disposables", label: "Disposables" },
  { href: "/shop?group=e-liquids", label: "E-Liquids" },
  { href: "/shop?group=kits", label: "Kits" },
  { href: "/shop?group=pods", label: "Pods" },
  { href: "/shop?group=pouches", label: "Pouches" },
  { href: "/shop?group=accessories", label: "Accessories" },
];

const TICKER = [
  "Free express shipping on orders over $100",
  "Same-day dispatch before 2pm AEST",
  "2,500+ products in stock",
  "Discreet packaging, always",
  "Genuine stock — sourced direct",
];

export default function Header() {
  const { count } = useCart();
  const router = useRouter();
  const [q, setQ] = useState("");
  const [mobileOpen, setMobileOpen] = useState(false);

  function submitSearch(e: React.FormEvent) {
    e.preventDefault();
    setMobileOpen(false);
    router.push(q.trim() ? `/shop?q=${encodeURIComponent(q.trim())}` : "/shop");
  }

  return (
    <header className="sticky top-0 z-40">
      {/* Announcement ticker */}
      <div className="announce overflow-hidden py-1.5 text-xs font-semibold tracking-wide">
        <div className="ticker-row">
          {[...TICKER, ...TICKER].map((t, i) => (
            <span key={i}>
              <span className="mr-2 text-[#e9b44c]">●</span>
              {t}
            </span>
          ))}
        </div>
      </div>

      {/* Main bar */}
      <div className="border-b border-line bg-background/95 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-[1380px] items-center gap-4 px-4 lg:gap-6">
          <Link href="/" className="flex shrink-0 items-center gap-2.5">
            <LogoMark size={42} className="shrink-0" />
            <span className="flex flex-col leading-none">
              <span className="font-display text-[22px] text-foreground">
                AUSSIE <span className="text-accent">VAPE</span> HOUSE
              </span>
              <span className="text-[8px] font-semibold uppercase tracking-[0.35em] text-muted">
                aussievapehouse.com
              </span>
            </span>
          </Link>

          <nav className="hidden items-center gap-0.5 xl:flex">
            {NAV.map((item) => (
              <Link
                key={item.label}
                href={item.href}
                className="rounded-md px-2.5 py-1.5 text-[12px] font-medium uppercase tracking-wider text-muted transition hover:bg-accent/10 hover:text-accent"
              >
                {item.label}
              </Link>
            ))}
          </nav>

          <form onSubmit={submitSearch} className="ml-auto hidden max-w-xs flex-1 sm:block">
            <div className="relative">
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search 2,500+ products…"
                className="w-full rounded-lg border border-line bg-surface py-2 pl-9 pr-3 text-sm outline-none transition placeholder:text-muted/70 focus:border-accent"
              />
              <svg
                viewBox="0 0 24 24" width="15" height="15"
                className="absolute left-3 top-1/2 -translate-y-1/2 text-muted"
                fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"
              >
                <circle cx="11" cy="11" r="7" />
                <path d="m20 20-3.8-3.8" />
              </svg>
            </div>
          </form>

          <Link
            href="/cart"
            className="glow-accent flex shrink-0 items-center gap-2 rounded-lg bg-accent px-4 py-2 text-[13px] font-bold text-white transition hover:bg-accent-2"
          >
            <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M6 6h15l-1.5 8.5a2 2 0 0 1-2 1.5H9a2 2 0 0 1-2-1.6L5 3H2" />
              <circle cx="9.5" cy="20.5" r="1.5" />
              <circle cx="17.5" cy="20.5" r="1.5" />
            </svg>
            Cart
            {count > 0 && (
              <span className="flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-black/40 px-1 text-[11px] font-extrabold">
                {count}
              </span>
            )}
          </Link>

          <button
            onClick={() => setMobileOpen((o) => !o)}
            className="flex flex-col gap-[5px] p-2 xl:hidden"
            aria-label="Menu"
          >
            <span className={`block h-0.5 w-[22px] rounded bg-muted transition ${mobileOpen ? "translate-y-[7px] rotate-45" : ""}`} />
            <span className={`block h-0.5 w-[22px] rounded bg-muted transition ${mobileOpen ? "opacity-0" : ""}`} />
            <span className={`block h-0.5 w-[22px] rounded bg-muted transition ${mobileOpen ? "-translate-y-[7px] -rotate-45" : ""}`} />
          </button>
        </div>

        {/* Mobile menu */}
        {mobileOpen && (
          <div className="border-t border-line bg-background px-4 pb-4 xl:hidden">
            <form onSubmit={submitSearch} className="pt-3 sm:hidden">
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search products…"
                className="w-full rounded-lg border border-line bg-surface px-3 py-2 text-sm outline-none focus:border-accent"
              />
            </form>
            {NAV.map((item) => (
              <Link
                key={item.label}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className="block border-b border-line py-3 text-sm font-medium text-muted transition hover:text-accent"
              >
                {item.label}
              </Link>
            ))}
          </div>
        )}
      </div>
    </header>
  );
}
