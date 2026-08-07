import Image from "next/image";
import Link from "next/link";
import {
  getBestSellers,
  getBrandCounts,
  getCategoryTiles,
  getHeroProducts,
} from "@/lib/catalog";
import { formatPrice } from "@/lib/format";
import HeroSlider from "@/components/HeroSlider";
import ProductCard from "@/components/ProductCard";
import Faq from "@/components/Faq";
import NewsletterForm from "@/components/NewsletterForm";

const TRUST = [
  {
    icon: "🚀",
    title: "Same-Day Dispatch",
    body: "Order before 2pm AEST and it ships today, Australia-wide.",
  },
  {
    icon: "📦",
    title: "Discreet Packaging",
    body: "Plain box, no branding, nothing on the label. Every order.",
  },
  {
    icon: "✅",
    title: "100% Genuine Stock",
    body: "Sourced direct. Verify authenticity codes on every major brand.",
  },
  {
    icon: "🔒",
    title: "Secure Checkout",
    body: "256-bit encrypted payments — card, PayPal, Apple Pay & more.",
  },
];

const FLAVOURS = [
  "Watermelon", "Mango", "Grape", "Mint", "Berry", "Peach",
  "Strawberry", "Banana", "Cola", "Pineapple", "Tobacco", "Ice",
];

function SectionHead({ eyebrow, title }: { eyebrow: string; title: string }) {
  return (
    <div className="mb-8">
      <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-ochre">
        {eyebrow}
      </p>
      <h2 className="font-display mt-1 text-3xl text-foreground sm:text-4xl">
        {title}
      </h2>
      <div className="dot-row mt-3" aria-hidden />
    </div>
  );
}

export default function HomePage() {
  const heroes = getHeroProducts();
  const tiles = getCategoryTiles();
  const bestSellers = getBestSellers(8);
  const brands = getBrandCounts();

  return (
    <div>
      <HeroSlider
        slides={heroes.map(({ product, eyebrow }) => ({
          slug: product.slug,
          name: product.name,
          eyebrow,
          price: formatPrice(product.price ?? product.price_min),
          image: product.images[0]?.src ?? "",
          category: product.categories[0]?.name ?? "Vape",
        }))}
      />

      {/* Trust strip */}
      <section className="border-y border-line bg-surface">
        <div className="mx-auto grid max-w-[1380px] grid-cols-2 gap-6 px-4 py-9 text-center lg:grid-cols-4">
          {TRUST.map((t) => (
            <div key={t.title}>
              <div className="text-2xl">{t.icon}</div>
              <p className="mt-2 text-[13.5px] font-bold text-ochre">{t.title}</p>
              <p className="mx-auto mt-1 max-w-[220px] text-[11.5px] leading-relaxed text-muted">
                {t.body}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Category tiles */}
      <section className="mx-auto max-w-[1380px] px-4 py-16">
        <SectionHead eyebrow="Browse by Category" title="What are you looking for?" />
        <div className="grid grid-cols-2 gap-3.5 sm:grid-cols-3 lg:grid-cols-4">
          {tiles.map((t) => (
            <Link
              key={t.key}
              href={`/shop?group=${t.key}`}
              className="group relative block aspect-[3/2] overflow-hidden rounded-xl border border-line transition-all duration-300 hover:-translate-y-1 hover:border-accent hover:shadow-[0_8px_32px_var(--glow)]"
            >
              {t.image && (
                <Image
                  src={t.image}
                  alt={t.label}
                  fill
                  sizes="(max-width: 640px) 50vw, 25vw"
                  className="object-cover brightness-[0.5] saturate-[0.65] transition duration-500 group-hover:scale-105 group-hover:brightness-[0.65]"
                />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-transparent" />
              <div className="absolute inset-x-0 bottom-0 flex items-end justify-between p-4">
                <div>
                  <p className="font-display text-xl text-white">{t.label}</p>
                  <p className="text-[10px] text-white/50">
                    {t.count.toLocaleString()} products
                  </p>
                </div>
                <span className="text-accent opacity-0 transition group-hover:opacity-100">→</span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Best sellers */}
      <section className="border-t border-line bg-surface/50">
        <div className="mx-auto max-w-[1380px] px-4 py-16">
          <div className="flex items-end justify-between">
            <SectionHead eyebrow="Hand Picked" title="Top shelf this week" />
            <Link
              href="/shop"
              className="mb-8 hidden text-sm font-semibold text-accent hover:underline sm:block"
            >
              View all →
            </Link>
          </div>
          <div className="grid grid-cols-2 gap-3.5 sm:grid-cols-3 xl:grid-cols-4">
            {bestSellers.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
          <div className="mt-9 text-center">
            <Link
              href="/shop"
              className="inline-flex items-center gap-2 rounded-lg border border-accent px-8 py-3 text-[13px] font-bold uppercase tracking-wider text-accent transition hover:bg-accent hover:text-white hover:shadow-[0_0_24px_var(--glow)]"
            >
              Shop the full range
            </Link>
          </div>
        </div>
      </section>

      {/* Brands */}
      {brands.length > 0 && (
        <section className="border-t border-line">
          <div className="mx-auto max-w-[1380px] px-4 py-14">
            <SectionHead eyebrow="Stocked & Verified" title="The brands you came for" />
            <div className="flex flex-wrap gap-2.5">
              {brands.map((b) => (
                <Link
                  key={b.name}
                  href={`/shop?q=${encodeURIComponent(b.name)}`}
                  className="group flex items-center gap-2.5 rounded-full border border-line-2 bg-surface-2 px-5 py-2.5 transition hover:border-accent hover:bg-accent/10"
                >
                  <span className="font-display text-lg text-foreground transition group-hover:text-accent">
                    {b.name.toUpperCase()}
                  </span>
                  <span className="text-[10.5px] text-muted">{b.count}</span>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Flavour pills */}
      <section className="border-t border-line bg-surface/50">
        <div className="mx-auto max-w-[1380px] px-4 py-14">
          <SectionHead eyebrow="Shop by Flavour" title="What's your flavour?" />
          <div className="flex flex-wrap gap-2.5">
            {FLAVOURS.map((f) => (
              <Link
                key={f}
                href={`/shop?q=${encodeURIComponent(f.toLowerCase())}`}
                className="rounded-full border border-line-2 bg-surface-3 px-5 py-2 text-[12.5px] font-medium text-muted transition hover:border-accent hover:bg-accent/10 hover:text-accent"
              >
                {f}
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="border-t border-line">
        <div className="mx-auto max-w-[820px] px-4 py-16">
          <SectionHead eyebrow="Common Questions" title="Frequently asked" />
          <Faq />
        </div>
      </section>

      {/* Newsletter */}
      <section className="dot-field border-t border-line bg-surface">
        <div className="mx-auto max-w-[520px] px-4 py-16 text-center">
          <h2 className="font-display text-3xl sm:text-4xl">
            Get <em className="not-italic text-ochre">10% off</em> your first order
          </h2>
          <p className="mb-6 mt-2 text-[13px] text-muted">
            Deals, drops and restocks — straight to your inbox. No spam, unsubscribe anytime.
          </p>
          <NewsletterForm />
          <p className="mt-3 text-[11px] text-muted/60">18+ only. We never share your email.</p>
        </div>
      </section>
    </div>
  );
}
