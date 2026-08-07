import Link from "next/link";
import { Suspense } from "react";
import {
  getCategoriesForGroup,
  getGroupCounts,
  groupLabel,
  searchProducts,
  type GroupKey,
  type SearchOptions,
} from "@/lib/catalog";
import ProductCard from "@/components/ProductCard";
import ShopControls from "@/components/ShopControls";
import Medallion from "@/components/Medallion";

export const metadata = { title: "Shop" };

type Params = { [key: string]: string | string[] | undefined };

function str(v: string | string[] | undefined): string | undefined {
  return typeof v === "string" && v.length ? v : undefined;
}

function buildQuery(base: Params, overrides: Record<string, string | null>) {
  const next = new URLSearchParams();
  for (const [k, v] of Object.entries(base)) {
    if (typeof v === "string" && v) next.set(k, v);
  }
  for (const [k, v] of Object.entries(overrides)) {
    if (v == null) next.delete(k);
    else next.set(k, v);
  }
  const s = next.toString();
  return s ? `/shop?${s}` : "/shop";
}

export default async function ShopPage({
  searchParams,
}: {
  searchParams: Promise<Params>;
}) {
  const params = await searchParams;
  const group = str(params.group) as GroupKey | undefined;
  const opts: SearchOptions = {
    q: str(params.q),
    group,
    category: str(params.category),
    sort: (str(params.sort) as SearchOptions["sort"]) ?? "featured",
    page: Number(str(params.page) ?? 1) || 1,
  };
  const { items, total, page, pages } = searchProducts(opts);
  const groups = getGroupCounts();
  const categories = getCategoriesForGroup(group ?? null).slice(0, 20);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-4">
          <Medallion variant={1} size={44} className="shrink-0" />
          <div>
            <h1 className="font-display text-3xl sm:text-4xl">
              {group ? groupLabel(group) : "Shop all"}
            </h1>
            <div className="dot-row mt-2" aria-hidden />
          </div>
        </div>
        <p className="text-sm text-muted">{total.toLocaleString()} products</p>
      </div>

      {/* Group pills */}
      <div className="mt-4 flex flex-wrap gap-2">
        <Link
          href={buildQuery(params, { group: null, category: null, page: null })}
          className={`rounded-full border px-3 py-1.5 text-xs transition ${
            !group
              ? "border-accent bg-accent/10 text-accent"
              : "border-line text-muted hover:text-foreground"
          }`}
        >
          All
        </Link>
        {groups.map((g) => (
          <Link
            key={g.key}
            href={buildQuery(params, { group: g.key, category: null, page: null })}
            className={`rounded-full border px-3 py-1.5 text-xs transition ${
              group === g.key
                ? "border-accent bg-accent/10 text-accent"
                : "border-line text-muted hover:text-foreground"
            }`}
          >
            {g.label} <span className="opacity-60">({g.count.toLocaleString()})</span>
          </Link>
        ))}
      </div>

      <div className="mt-5">
        <Suspense>
          <ShopControls />
        </Suspense>
      </div>

      <div className="mt-6 flex gap-8">
        {/* Category sidebar */}
        <aside className="hidden w-56 shrink-0 lg:block">
          <p className="text-sm font-semibold">Collections</p>
          <ul className="mt-3 space-y-1 text-sm">
            {categories.map((c) => (
              <li key={c.slug}>
                <Link
                  href={buildQuery(params, { category: params.category === c.slug ? null : c.slug, page: null })}
                  className={`flex justify-between gap-2 rounded-md px-2 py-1.5 transition ${
                    params.category === c.slug
                      ? "bg-accent/10 text-accent"
                      : "text-muted hover:bg-surface hover:text-foreground"
                  }`}
                >
                  <span className="truncate">{c.name}</span>
                  <span className="shrink-0 opacity-60">{c.count}</span>
                </Link>
              </li>
            ))}
          </ul>
        </aside>

        {/* Grid */}
        <div className="flex-1">
          {items.length === 0 ? (
            <div className="rounded-xl border border-line bg-surface p-12 text-center text-muted">
              No products match those filters.{" "}
              <Link href="/shop" className="text-accent hover:underline">
                Clear filters
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-4">
              {items.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          )}

          {/* Pagination */}
          {pages > 1 && (
            <div className="mt-8 flex items-center justify-center gap-2 text-sm">
              {page > 1 && (
                <Link
                  href={buildQuery(params, { page: String(page - 1) })}
                  className="rounded-lg border border-line px-3 py-1.5 text-muted transition hover:text-foreground"
                >
                  ← Prev
                </Link>
              )}
              <span className="px-2 text-muted">
                Page {page} of {pages.toLocaleString()}
              </span>
              {page < pages && (
                <Link
                  href={buildQuery(params, { page: String(page + 1) })}
                  className="rounded-lg border border-line px-3 py-1.5 text-muted transition hover:text-foreground"
                >
                  Next →
                </Link>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
