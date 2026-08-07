import { readFileSync } from "node:fs";
import path from "node:path";

export type CatalogImage = { src: string; alt: string; local: string };

export type Product = {
  id: number;
  name: string;
  slug: string;
  sku: string | null;
  type: string;
  permalink: string;
  categories: { id: number; name: string; slug: string }[];
  tags: string[];
  brands: string[];
  currency: string;
  price: number | null;
  regular_price: number | null;
  sale_price: number | null;
  price_min: number | null;
  price_max: number | null;
  on_sale: boolean;
  in_stock: boolean;
  description_html: string;
  description_text: string;
  short_description_text: string;
  attributes: { name: string; terms: string[] }[];
  has_options: boolean;
  average_rating: string;
  review_count: number;
  images: CatalogImage[];
  /** Normalised top-level group, computed at load time */
  group: GroupKey;
};

export const GROUPS = [
  { key: "disposables", label: "Disposables" },
  { key: "e-liquids", label: "E-Liquids" },
  { key: "pods", label: "Pods" },
  { key: "coils", label: "Coils" },
  { key: "kits", label: "Kits & Hardware" },
  { key: "pouches", label: "Nicotine Pouches" },
  { key: "glass", label: "Glass & Smoking" },
  { key: "accessories", label: "Accessories" },
  { key: "other", label: "Other" },
] as const;

export type GroupKey = (typeof GROUPS)[number]["key"];

export function groupLabel(key: string): string {
  return GROUPS.find((g) => g.key === key)?.label ?? "Other";
}

// Checked in order — first match wins. The source taxonomy is messy (57
// overlapping categories), so this collapses it into stable nav groups.
const GROUP_MATCHERS: { key: GroupKey; match: RegExp }[] = [
  { key: "pouches", match: /pouch/i },
  {
    key: "disposables",
    match: /disposab|geek ?bar|iget (bar|goat|moon|star|legend|hot)|cruiser|elf ?bar|kado|alibarbar|lost mary|waka|bali|puff/i,
  },
  { key: "pods", match: /\bpods?\b/i },
  { key: "coils", match: /\bcoils?\b/i },
  {
    key: "e-liquids",
    match: /e-?liquid|ejuice|e juice|juice|shortfill|salts?\b|70vg|freebase|nicotine/i,
  },
  { key: "kits", match: /\bkit\b|\bmod\b|\btank\b|device|halo|aio|hardware/i },
  { key: "glass", match: /bong|glass|pipe|grinder|paper|hookah|shisha/i },
  {
    key: "accessories",
    match: /accessor|batter|charger|cotton|wire|case|drip tip|replacement/i,
  },
];

function classify(p: {
  categories: { name: string; slug: string }[];
  name: string;
}): GroupKey {
  const haystacks = [
    ...p.categories.map((c) => `${c.name} ${c.slug}`),
    p.name,
  ];
  for (const { key, match } of GROUP_MATCHERS) {
    if (haystacks.some((h) => match.test(h))) return key;
  }
  return "other";
}

// Woo returns names/categories with HTML entities baked in (&#8211;, &amp; …)
const NAMED_ENTITIES: Record<string, string> = {
  amp: "&",
  lt: "<",
  gt: ">",
  quot: '"',
  nbsp: " ",
  ndash: "–",
  mdash: "—",
  rsquo: "’",
  lsquo: "‘",
  ldquo: "“",
  rdquo: "”",
};

function decodeEntities(s: string): string {
  return s
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)))
    .replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCodePoint(parseInt(n, 16)))
    .replace(/&([a-z]+);/gi, (m, name: string) => NAMED_ENTITIES[name.toLowerCase()] ?? m);
}

// The scraped descriptions are SEO copy with broken internal links (some
// literally pointing at chatgpt.com) and the source store's branding.
// Strip anchors, drop the "<name> | Aussie Vape Mart" heading, rebrand.
function cleanDescription(html: string): string {
  return html
    .replace(/<a\b[^>]*>/gi, "")
    .replace(/<\/a>/gi, "")
    .replace(/<h2>[^<]*\|[^<]*<\/h2>/i, "")
    .replace(/Aussie Vape Mart( Australia)?/gi, "Aussie Vape House")
    .trim();
}

// The source site double-lists ~880 products (same name, separate IDs, one
// copy sometimes broken with $0 price). Keep the best copy per name.
function dedupe(products: Product[]): Product[] {
  const score = (p: Product) =>
    (p.images.length > 0 ? 4 : 0) +
    ((p.price ?? p.price_min ?? 0) > 0 ? 2 : 0) +
    (p.in_stock ? 1 : 0) +
    Math.min(p.description_html.length / 100000, 0.9);
  const best = new Map<string, Product>();
  for (const p of products) {
    const key = p.name.trim().toLowerCase();
    const cur = best.get(key);
    if (!cur || score(p) > score(cur)) best.set(key, p);
  }
  return [...best.values()];
}

type RawProduct = Omit<Product, "group">;

let cache: Product[] | null = null;

export function getProducts(): Product[] {
  if (!cache) {
    const file = path.join(process.cwd(), "catalog", "products.json");
    const raw = JSON.parse(readFileSync(file, "utf8")) as RawProduct[];
    cache = dedupe(
      raw.map((p) => ({
        ...p,
        name: decodeEntities(p.name),
        categories: p.categories.map((c) => ({ ...c, name: decodeEntities(c.name) })),
        description_html: cleanDescription(p.description_html),
        description_text: p.description_text.replace(
          /Aussie Vape Mart( Australia)?/gi,
          "Aussie Vape House"
        ),
        group: classify(p),
      }))
    );
  }
  return cache;
}

export function getProductBySlug(slug: string): Product | undefined {
  return getProducts().find((p) => p.slug === slug);
}

export function getGroupCounts(): { key: GroupKey; label: string; count: number }[] {
  const counts = new Map<GroupKey, number>();
  for (const p of getProducts()) {
    counts.set(p.group, (counts.get(p.group) ?? 0) + 1);
  }
  return GROUPS.filter((g) => (counts.get(g.key) ?? 0) > 0).map((g) => ({
    key: g.key,
    label: g.label,
    count: counts.get(g.key) ?? 0,
  }));
}

export function getCategoriesForGroup(
  group: GroupKey | null
): { slug: string; name: string; count: number }[] {
  const counts = new Map<string, { name: string; count: number }>();
  for (const p of getProducts()) {
    if (group && p.group !== group) continue;
    for (const c of p.categories) {
      const cur = counts.get(c.slug);
      if (cur) cur.count += 1;
      else counts.set(c.slug, { name: c.name, count: 1 });
    }
  }
  return [...counts.entries()]
    .map(([slug, v]) => ({ slug, name: v.name, count: v.count }))
    .sort((a, b) => b.count - a.count);
}

export type SearchOptions = {
  q?: string;
  group?: string;
  category?: string;
  sort?: "featured" | "price-asc" | "price-desc" | "name";
  page?: number;
  perPage?: number;
};

export function searchProducts(opts: SearchOptions): {
  items: Product[];
  total: number;
  page: number;
  pages: number;
} {
  const perPage = opts.perPage ?? 24;
  let items = getProducts();

  if (opts.group) items = items.filter((p) => p.group === opts.group);
  if (opts.category)
    items = items.filter((p) => p.categories.some((c) => c.slug === opts.category));
  if (opts.q) {
    const terms = opts.q.toLowerCase().split(/\s+/).filter(Boolean);
    items = items.filter((p) => {
      const hay = `${p.name} ${p.brands.join(" ")} ${p.categories
        .map((c) => c.name)
        .join(" ")}`.toLowerCase();
      return terms.every((t) => hay.includes(t));
    });
  }

  const priceOf = (p: Product) => p.price ?? p.price_min ?? 0;
  switch (opts.sort) {
    case "price-asc":
      items = [...items].sort((a, b) => priceOf(a) - priceOf(b));
      break;
    case "price-desc":
      items = [...items].sort((a, b) => priceOf(b) - priceOf(a));
      break;
    case "name":
      items = [...items].sort((a, b) => a.name.localeCompare(b.name));
      break;
    default:
      // "featured": in-stock first, then review count, then name
      items = [...items].sort(
        (a, b) =>
          Number(b.in_stock) - Number(a.in_stock) ||
          b.review_count - a.review_count ||
          a.name.localeCompare(b.name)
      );
  }

  const total = items.length;
  const pages = Math.max(1, Math.ceil(total / perPage));
  const page = Math.min(Math.max(1, opts.page ?? 1), pages);
  return {
    items: items.slice((page - 1) * perPage, page * perPage),
    total,
    page,
    pages,
  };
}

export function getFeatured(limit = 8): Product[] {
  const seen = new Set<GroupKey>();
  const picks: Product[] = [];
  const pool = getProducts().filter(
    (p) => p.in_stock && p.images.length > 0 && (p.price ?? p.price_min ?? 0) > 0
  );
  // First pass: one popular product per group for variety
  const byPopularity = [...pool].sort((a, b) => b.review_count - a.review_count);
  for (const p of byPopularity) {
    if (picks.length >= limit) break;
    if (!seen.has(p.group)) {
      seen.add(p.group);
      picks.push(p);
    }
  }
  for (const p of byPopularity) {
    if (picks.length >= limit) break;
    if (!picks.includes(p)) picks.push(p);
  }
  return picks;
}

const sellable = (p: Product) =>
  p.in_stock && p.images.length > 0 && (p.price ?? p.price_min ?? 0) > 0;

// The catalog has zero review data, so rank "popularity" by brand heat +
// deal status instead. Deterministic per product id for stable pages.
const HOT_BRANDS =
  /geek bar pulse|iget (bar|moon|legend|goat)|alibarbar|hqd|waka|lost mary|kado/i;

function popularity(p: Product): number {
  return (
    (HOT_BRANDS.test(p.name) ? 100 : 0) +
    (p.on_sale ? 10 : 0) +
    (p.group === "disposables" ? 5 : 0) +
    // stable pseudo-random tiebreaker so it's not alphabetical
    ((p.id * 2654435761) % 97) / 97
  );
}

// Hand-picked hero heroes with graceful fallbacks to any popular product
const HERO_PICKS: { match: RegExp; eyebrow: string }[] = [
  { match: /geek bar pulse x/i, eyebrow: "Best Seller" },
  { match: /iget bar\b/i, eyebrow: "Australia's Favourite" },
  { match: /alibarbar (ingot|upload)/i, eyebrow: "Big Puffs, Big Value" },
  { match: /iget moon/i, eyebrow: "New Arrival" },
];

export function getHeroProducts(): { product: Product; eyebrow: string }[] {
  // Bundles / multi-packs make weak hero shots — single products only
  const pool = getProducts().filter(
    (p) => sellable(p) && !/bundle|\(\d+\s*pcs\)|bulk buy/i.test(p.name)
  );
  const slides: { product: Product; eyebrow: string }[] = [];
  const used = new Set<number>();
  for (const pick of HERO_PICKS) {
    const p = pool.find((x) => !used.has(x.id) && pick.match.test(x.name));
    if (p) {
      used.add(p.id);
      slides.push({ product: p, eyebrow: pick.eyebrow });
    }
  }
  for (const p of [...pool].sort((a, b) => popularity(b) - popularity(a))) {
    if (slides.length >= 3) break;
    if (!used.has(p.id)) {
      used.add(p.id);
      slides.push({ product: p, eyebrow: "Trending Now" });
    }
  }
  return slides.slice(0, 4);
}

export function getCategoryTiles(): {
  key: GroupKey;
  label: string;
  count: number;
  image: string | null;
}[] {
  const products = getProducts();
  return getGroupCounts()
    .filter((g) => g.key !== "other")
    .map((g) => {
      const rep = products
        .filter((p) => p.group === g.key && sellable(p))
        .sort((a, b) => popularity(b) - popularity(a))[0];
      return { ...g, image: rep?.images[0]?.src ?? null };
    });
}

const BRAND_DEFS = [
  "Geek Bar",
  "IGET",
  "Alibarbar",
  "HQD",
  "VooPoo",
  "Uwell",
  "Vaporesso",
  "DynaVap",
  "Nasty Juice",
  "Airmez",
];

export function getBrandCounts(): { name: string; count: number }[] {
  const products = getProducts();
  return BRAND_DEFS.map((name) => {
    const re = new RegExp(name.replace(/\s+/g, "\\s*"), "i");
    return {
      name,
      count: products.filter(
        (p) => re.test(p.name) || p.categories.some((c) => re.test(c.name))
      ).length,
    };
  }).filter((b) => b.count >= 10);
}

export function getBestSellers(limit = 8): Product[] {
  return [...getProducts()]
    .filter(sellable)
    .sort((a, b) => popularity(b) - popularity(a))
    .slice(0, limit);
}

export function getRelated(product: Product, limit = 4): Product[] {
  const catSlugs = new Set(product.categories.map((c) => c.slug));
  const same = getProducts().filter(
    (p) =>
      p.id !== product.id &&
      p.in_stock &&
      (p.categories.some((c) => catSlugs.has(c.slug)) || p.group === product.group)
  );
  // Deterministic but varied: rotate the list based on product id
  const offset = same.length ? product.id % same.length : 0;
  return [...same.slice(offset), ...same.slice(0, offset)].slice(0, limit);
}
