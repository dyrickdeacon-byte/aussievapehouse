import Image from "next/image";
import Link from "next/link";
import {
  getBestSellers,
  getBrandCounts,
  getCategoryTiles,
  getHeroProducts,
  groupLabel,
  primaryImage,
} from "@/lib/catalog";
import { formatPrice } from "@/lib/format";
import HeroSlider from "@/components/HeroSlider";
import ProductCard from "@/components/ProductCard";
import Faq from "@/components/Faq";
import NewsletterForm from "@/components/NewsletterForm";
import Medallion, { MedallionDivider } from "@/components/Medallion";

// Each trust item carries its own earth tone — part of the multicolour blend
const TRUST = [
  {
    icon: "🚀",
    title: "Same-Day Dispatch",
    body: "Order before 2pm AEST and it ships today, Australia-wide.",
    circle: "bg-[#b4451c]/12",
    text: "text-accent",
  },
  {
    icon: "📦",
    title: "Discreet Packaging",
    body: "Plain box, no branding, nothing on the label. Every order.",
    circle: "bg-[#9c731a]/15",
    text: "text-ochre",
  },
  {
    icon: "✅",
    title: "100% Genuine Stock",
    body: "Sourced direct. Verify authenticity codes on every major brand.",
    circle: "bg-[#2f6d5f]/12",
    text: "text-eucalypt",
  },
  {
    icon: "🔒",
    title: "Secure Checkout",
    body: "256-bit encrypted payments — card, PayPal, Apple Pay & more.",
    circle: "bg-[#8a2f1a]/12",
    text: "text-[#8a2f1a]",
  },
];

// Rotating earth hues for tiles and pills
const TILE_OVERLAYS = ["#241a0e", "#5c2008", "#1c4038", "#5a3c08"];
const PILL_TINTS = [
  "border-[#b4451c]/35 bg-[#b4451c]/8 text-[#9a3a16] hover:bg-[#b4451c]/15",
  "border-[#9c731a]/40 bg-[#9c731a]/10 text-[#7d5c14] hover:bg-[#9c731a]/18",
  "border-[#2f6d5f]/35 bg-[#2f6d5f]/8 text-[#2a5d51] hover:bg-[#2f6d5f]/15",
  "border-[#8a2f1a]/35 bg-[#8a2f1a]/8 text-[#7a2a17] hover:bg-[#8a2f1a]/15",
];

const FLAVOURS = [
  "Watermelon", "Mango", "Grape", "Mint", "Berry", "Peach",
  "Strawberry", "Banana", "Cola", "Pineapple", "Tobacco", "Ice",
];

function SectionHead({
  eyebrow,
  title,
  medallion = 0,
}: {
  eyebrow: string;
  title: string;
  medallion?: number;
}) {
  return (
    <div className="mb-8 flex items-center gap-4">
      <Medallion variant={medallion} size={46} className="shrink-0" />
      <div>
        <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-ochre">
          {eyebrow}
        </p>
        <h2 className="font-display mt-1 text-3xl text-foreground sm:text-4xl">
          {title}
        </h2>
        <div className="dot-row mt-3" aria-hidden />
      </div>
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
          image: primaryImage(product)?.src ?? "",
          category: groupLabel(product.group),
        }))}
      />

      {/* Trust strip */}
      <section className="border-y border-line bg-surface">
        <div className="mx-auto grid max-w-[1380px] grid-cols-2 gap-6 px-4 py-9 text-center lg:grid-cols-4">
          {TRUST.map((t) => (
            <div key={t.title}>
              <div className={`mx-auto flex h-12 w-12 items-center justify-center rounded-full text-2xl ${t.circle}`}>
                {t.icon}
              </div>
              <p className={`mt-2.5 text-[13.5px] font-bold ${t.text}`}>{t.title}</p>
              <p className="mx-auto mt-1 max-w-[220px] text-[11.5px] leading-relaxed text-muted">
                {t.body}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Category tiles */}
      <section className="relative mx-auto max-w-[1380px] overflow-hidden px-4 py-16">
        <div className="pointer-events-none absolute -right-24 top-4 opacity-[0.06]" aria-hidden>
          <Medallion variant={2} size={360} />
        </div>
        <SectionHead eyebrow="Browse by Category" title="What are you looking for?" medallion={1} />
        <div className="grid grid-cols-2 gap-3.5 sm:grid-cols-3 lg:grid-cols-4">
          {tiles.map((t, i) => (
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
                  className="bg-white object-cover transition duration-500 group-hover:scale-105"
                />
              )}
              <div
                className="absolute inset-0"
                style={{
                  background: `linear-gradient(to top, ${TILE_OVERLAYS[i % 4]}e0 0%, ${TILE_OVERLAYS[i % 4]}22 45%, transparent 70%)`,
                }}
              />
              <div className="absolute inset-x-0 bottom-0 flex items-end justify-between p-4">
                <div>
                  <p className="font-display text-xl text-[#f5eee0]">{t.label}</p>
                  <p className="text-[10px] text-[#d8c9a8]/80">
                    {t.count.toLocaleString()} products
                  </p>
                </div>
                <span className="text-[#e9b44c] opacity-0 transition group-hover:opacity-100">→</span>
              </div>
            </Link>
          ))}
        </div>
        <div className="mt-12">
          <MedallionDivider />
        </div>
      </section>

      {/* Best sellers */}
      <section
        className="border-t border-line bg-surface/50"
        style={{
          backgroundImage:
            "radial-gradient(620px 300px at 92% 0%, rgba(156,115,26,.10), transparent), radial-gradient(520px 280px at 4% 100%, rgba(47,109,95,.10), transparent)",
        }}
      >
        <div className="mx-auto max-w-[1380px] px-4 py-16">
          <div className="flex items-end justify-between">
            <SectionHead eyebrow="Hand Picked" title="Top shelf this week" medallion={0} />
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
            <SectionHead eyebrow="Stocked & Verified" title="The brands you came for" medallion={3} />
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
          <SectionHead eyebrow="Shop by Flavour" title="What's your flavour?" medallion={5} />
          <div className="flex flex-wrap gap-2.5">
            {FLAVOURS.map((f, i) => (
              <Link
                key={f}
                href={`/shop?q=${encodeURIComponent(f.toLowerCase())}`}
                className={`rounded-full border px-5 py-2 text-[12.5px] font-semibold transition ${PILL_TINTS[i % 4]}`}
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
          <SectionHead eyebrow="Common Questions" title="Frequently asked" medallion={4} />
          <Faq />
        </div>
      </section>

      {/* Newsletter */}
      <section
        className="dot-field relative overflow-hidden border-t border-line bg-surface"
        style={{
          backgroundImage:
            "radial-gradient(480px 260px at 88% 20%, rgba(180,69,28,.09), transparent), radial-gradient(460px 240px at 8% 85%, rgba(47,109,95,.09), transparent)",
        }}
      >
        <div className="pointer-events-none absolute left-10 top-1/2 hidden -translate-y-1/2 lg:block" aria-hidden>
          <Medallion variant={2} size={90} className="opacity-70" />
        </div>
        <div className="pointer-events-none absolute right-10 top-1/2 hidden -translate-y-1/2 lg:block" aria-hidden>
          <Medallion variant={1} size={90} className="opacity-70" />
        </div>
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
