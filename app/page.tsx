import Link from "next/link";
import { getFeatured, getGroupCounts } from "@/lib/catalog";
import ProductCard from "@/components/ProductCard";

const GROUP_EMOJI: Record<string, string> = {
  disposables: "⚡",
  "e-liquids": "🧪",
  pods: "🔋",
  coils: "🌀",
  kits: "🛠️",
  pouches: "⚪",
  glass: "🫙",
  accessories: "🎒",
  other: "📦",
};

export default function HomePage() {
  const groups = getGroupCounts();
  const featured = getFeatured(8);

  return (
    <div className="mx-auto max-w-7xl px-4">
      {/* Hero */}
      <section className="relative mt-6 overflow-hidden rounded-2xl border border-line bg-gradient-to-br from-surface-2 via-surface to-background px-6 py-16 text-center sm:py-24">
        <div className="pointer-events-none absolute -top-24 left-1/2 h-64 w-[36rem] -translate-x-1/2 rounded-full bg-accent/10 blur-3xl" />
        <h1 className="mx-auto max-w-2xl text-4xl font-bold tracking-tight sm:text-5xl">
          Everything vape, <span className="text-accent">done right</span>.
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-muted">
          {`${groups.reduce((n, g) => n + g.count, 0).toLocaleString()} products across disposables, e-liquids, kits and more — with a compliant pharmacy pathway where you need one.`}
        </p>
        <div className="mt-8 flex justify-center gap-3">
          <Link
            href="/shop"
            className="rounded-lg bg-accent-strong px-6 py-3 text-sm font-semibold text-black transition hover:bg-accent"
          >
            Shop all products
          </Link>
          <Link
            href="/pharmacy"
            className="rounded-lg border border-line px-6 py-3 text-sm font-semibold text-muted transition hover:text-foreground"
          >
            Pharmacy finder
          </Link>
        </div>
      </section>

      {/* Categories */}
      <section className="mt-12">
        <h2 className="text-xl font-semibold">Browse by category</h2>
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {groups.map((g) => (
            <Link
              key={g.key}
              href={`/shop?group=${g.key}`}
              className="group rounded-xl border border-line bg-surface p-4 transition hover:border-accent/50 hover:bg-surface-2"
            >
              <span className="text-2xl">{GROUP_EMOJI[g.key] ?? "📦"}</span>
              <p className="mt-2 font-medium transition group-hover:text-accent">
                {g.label}
              </p>
              <p className="text-xs text-muted">{g.count.toLocaleString()} products</p>
            </Link>
          ))}
        </div>
      </section>

      {/* Featured */}
      <section className="mt-12">
        <div className="flex items-baseline justify-between">
          <h2 className="text-xl font-semibold">Popular right now</h2>
          <Link href="/shop" className="text-sm text-accent hover:underline">
            View all →
          </Link>
        </div>
        <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {featured.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      </section>

      {/* Compliance strip */}
      <section className="mt-12 rounded-2xl border border-line bg-surface p-6 sm:p-8">
        <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold">Buying from Australia? 🇦🇺</h2>
            <p className="mt-1 max-w-2xl text-sm leading-relaxed text-muted">
              Australian law supplies nicotine vaping products through
              pharmacies only. Use our finder to locate a participating
              pharmacy near you, or book a consultation to talk through your
              options with a professional.
            </p>
          </div>
          <Link
            href="/pharmacy"
            className="shrink-0 rounded-lg bg-accent-strong px-5 py-2.5 text-sm font-semibold text-black transition hover:bg-accent"
          >
            Pharmacies &amp; consults near me
          </Link>
        </div>
      </section>
    </div>
  );
}
