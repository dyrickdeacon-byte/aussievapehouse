"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";

export default function ShopControls() {
  const router = useRouter();
  const params = useSearchParams();
  const [q, setQ] = useState(params.get("q") ?? "");

  function apply(overrides: Record<string, string | null>) {
    const next = new URLSearchParams(params.toString());
    for (const [k, v] of Object.entries(overrides)) {
      if (v == null || v === "") next.delete(k);
      else next.set(k, v);
    }
    next.delete("page"); // any filter change resets pagination
    router.push(`/shop?${next.toString()}`);
  }

  return (
    <div className="flex flex-wrap items-center gap-3">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          apply({ q });
        }}
        className="flex flex-1 gap-2"
      >
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search products, brands, flavours…"
          className="w-full min-w-40 flex-1 rounded-lg border border-line bg-surface px-3 py-2 text-sm outline-none placeholder:text-muted focus:border-accent"
        />
        <button
          type="submit"
          className="rounded-lg border border-line px-4 py-2 text-sm text-muted transition hover:text-foreground"
        >
          Search
        </button>
      </form>
      <select
        value={params.get("sort") ?? "featured"}
        onChange={(e) => apply({ sort: e.target.value === "featured" ? null : e.target.value })}
        className="rounded-lg border border-line bg-surface px-3 py-2 text-sm text-muted outline-none focus:border-accent"
        aria-label="Sort products"
      >
        <option value="featured">Sort: Featured</option>
        <option value="price-asc">Price: low → high</option>
        <option value="price-desc">Price: high → low</option>
        <option value="name">Name A–Z</option>
      </select>
    </div>
  );
}
