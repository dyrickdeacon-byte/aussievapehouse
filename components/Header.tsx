"use client";

import Link from "next/link";
import { useCart } from "@/lib/cart";

const NAV = [
  { href: "/shop", label: "Shop All" },
  { href: "/shop?group=disposables", label: "Disposables" },
  { href: "/shop?group=e-liquids", label: "E-Liquids" },
  { href: "/shop?group=kits", label: "Kits" },
  { href: "/shop?group=pods", label: "Pods" },
  { href: "/shop?group=accessories", label: "Accessories" },
];

export default function Header() {
  const { count } = useCart();

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-background/90 backdrop-blur">
      <div className="bg-accent-strong/15 px-4 py-1.5 text-center text-xs text-accent">
        🇦🇺 In Australia, nicotine vapes are pharmacy-only.{" "}
        <Link href="/pharmacy" className="font-semibold underline underline-offset-2">
          Find a pharmacy or consult near you →
        </Link>
      </div>
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-6 px-4 py-3">
        <Link href="/" className="text-xl font-bold tracking-tight">
          Vape<span className="text-accent">Aussie</span>
        </Link>
        <nav className="hidden gap-5 text-sm text-muted md:flex">
          {NAV.map((item) => (
            <Link
              key={item.label}
              href={item.href}
              className="transition hover:text-foreground"
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-4">
          <Link
            href="/pharmacy"
            className="hidden rounded-lg border border-line px-3 py-1.5 text-xs text-muted transition hover:text-foreground sm:block"
          >
            Pharmacy Finder
          </Link>
          <Link
            href="/cart"
            className="relative rounded-lg border border-line px-3 py-1.5 text-sm transition hover:bg-surface"
          >
            Cart
            {count > 0 && (
              <span className="absolute -right-2 -top-2 flex h-5 min-w-5 items-center justify-center rounded-full bg-accent px-1 text-xs font-bold text-black">
                {count}
              </span>
            )}
          </Link>
        </div>
      </div>
    </header>
  );
}
