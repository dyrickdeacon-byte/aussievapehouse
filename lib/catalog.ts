import { readFileSync } from "node:fs";
import path from "node:path";

// src is rewritten at load time to the local /img/ route (the supplier's
// server rate-limits hotlinking); remote keeps the original URL as fallback.
// width/height are measured from the downloaded files (scripts/measure-images.mjs).
export type CatalogImage = {
  src: string;
  alt: string;
  local: string;
  remote: string;
  width: number;
  height: number;
};

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

// The scraped descriptions are bloated AI SEO copy: broken links (some
// literally pointing at chatgpt.com), embedded <img> tags from dead CDNs,
// keyword-stuffed filler and cross-sell spam. Keep the substance only.
const SEO_HEADING =
  /why (choose|buy|shop)|shipping|deliver|about (us|aussie|vape)|faq|frequently asked|warranty|order (from|online)|where to buy|australia.?wide|customer|support|payment|returns|contact|conclusion|final (thoughts|words)|online today|get yours|discreet|browse|explore|bundle|\(\d+\s*pcs\)|mixed flavours|wholesale|bulk buy|review/i;

const KEEP_HEADING = /specification|package content|what's in|contents|advantage|feature/i;

// Truncate at an element boundary (paragraph, list item, table row…)
// so cut content still renders as valid-enough HTML
function truncateAtBoundary(html: string, maxText: number): string {
  const chunks = html.split(/(?=<(?:p|li|tr|h[23]|ul|ol|table|br|div)\b)/i);
  let out = "";
  let len = 0;
  for (const chunk of chunks) {
    const chunkText = chunk.replace(/<[^>]+>/g, " ").length;
    if (len > 0 && len + chunkText > maxText) break;
    out += chunk;
    len += chunkText;
    if (len > maxText) break;
  }
  // Monolithic blob with no inner boundaries — cut at a sentence instead
  if (len > maxText * 1.5) {
    const plain = out.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim().slice(0, maxText);
    const lastStop = Math.max(
      plain.lastIndexOf(". "),
      plain.lastIndexOf("! "),
      plain.lastIndexOf("? ")
    );
    return `<p>${plain.slice(0, lastStop > 200 ? lastStop + 1 : maxText)}</p>`;
  }
  return out;
}

function cleanDescription(html: string): string {
  const base = html
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<iframe[\s\S]*?<\/iframe>/gi, "")
    // embedded images hotlink dead external CDNs — the "broken image" reports
    .replace(/<img[^>]*>/gi, "")
    .replace(/<figure[^>]*>/gi, "")
    .replace(/<\/figure>/gi, "")
    .replace(/<a\b[^>]*>/gi, "")
    .replace(/<\/a>/gi, "")
    .replace(/Aussie Vape Mart( Australia)?/gi, "Aussie Vape House")
    .replace(/<p>(&nbsp;|\s)*<\/p>/gi, "");

  // Split into intro + heading-delimited sections, keep only the useful ones
  const parts = base.split(/(?=<h[23])/i);
  const kept: string[] = [];
  let textLen = 0;
  for (const part of parts) {
    const headingMatch = part.match(/<h[23][^>]*>([\s\S]*?)<\/h[23]>/i);
    const heading = headingMatch
      ? headingMatch[1].replace(/<[^>]+>/g, "").trim()
      : "";
    const isKeeper = KEEP_HEADING.test(heading);
    // Drop SEO filler sections and "<name> | <store>" title headers
    if (heading && !isKeeper && (SEO_HEADING.test(heading) || heading.includes("|")))
      continue;
    // Strip link-bait sentences ("browse our…", "check out the…")
    let cleaned = part.replace(
      /[^.!?<>]*\b(browse|check out|visit|explore|discover|see)\s+(our|the|more|all)\b[^.!?<>]*[.!?]/gi,
      ""
    );
    let plain = cleaned.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
    if (!plain) continue;
    // Budget: ~2400 chars total; spec-style sections may still append
    // after that, but nothing escapes truncation and the 3600 hard stop
    if (textLen > 2400 && !isKeeper) continue;
    if (textLen > 3600) break;
    const sectionCap = isKeeper ? 1600 : 1400;
    if (plain.length > sectionCap) {
      cleaned = truncateAtBoundary(cleaned, sectionCap);
      plain = cleaned.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
    }
    kept.push(cleaned);
    textLen += plain.length;
  }
  return kept.join("\n").trim();
}

export function isPlaceholderImage(im: { alt?: string } | undefined): boolean {
  return !im || /placeholder/i.test(im.alt ?? "");
}

// First real (non-placeholder) image — 32 listings hide a real photo
// behind a placeholder in slot 0
export function primaryImage(p: Product): CatalogImage | undefined {
  return p.images.find((im) => !isPlaceholderImage(im));
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

type RawProduct = Omit<Product, "group" | "images"> & {
  images: { src: string; alt: string; local: string }[];
};

let cache: Product[] | null = null;

function loadImageMeta(): Record<string, [number, number]> {
  try {
    return JSON.parse(
      readFileSync(path.join(process.cwd(), "catalog", "image-meta.json"), "utf8")
    );
  } catch {
    return {};
  }
}

export function getProducts(): Product[] {
  if (!cache) {
    const meta = loadImageMeta();
    const file = path.join(process.cwd(), "catalog", "products.json");
    const raw = JSON.parse(readFileSync(file, "utf8")) as RawProduct[];
    cache = dedupe(
      raw.map((p) => ({
        ...p,
        name: decodeEntities(p.name),
        categories: p.categories.map((c) => ({ ...c, name: decodeEntities(c.name) })),
        images: p.images.map((im) => {
          const name = im.local.replace(/^images\//, "");
          const [width, height] = meta[name] ?? [0, 0];
          return { ...im, remote: im.src, src: `/img/${name}`, width, height };
        }),
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
  brand?: string;
  flavour?: string;
  sort?: "featured" | "price-asc" | "price-desc" | "name";
  page?: number;
  perPage?: number;
};

// Known brands across the catalog — used for the shop's refine pills
const BRAND_LIST = [
  "Geek Bar", "Geekvape", "IGET", "Alibarbar", "HQD", "VooPoo", "Uwell",
  "Vaporesso", "DynaVap", "Nasty Juice", "Airmez", "SMOK", "Lost Vape",
  "Muha Meds", "Kado", "Waka", "Tyson", "Puffmi", "Elf Bar", "Lost Mary",
  "INGOT", "Pulse", "Cloud Nurdz", "Simrell", "Sticky Brick", "Storz & Bickel",
];

const FLAVOUR_LIST = [
  "Watermelon", "Mango", "Grape", "Mint", "Berry", "Blueberry", "Raspberry",
  "Strawberry", "Peach", "Banana", "Apple", "Pineapple", "Passion Fruit",
  "Guava", "Kiwi", "Cola", "Lemon", "Cherry", "Coconut", "Melon", "Orange",
  "Candy", "Tobacco", "Ice", "Menthol",
];

function matchesTerm(p: Product, term: string): boolean {
  const re = new RegExp(term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&").replace(/\s+/g, "\\s*"), "i");
  return (
    re.test(p.name) ||
    p.categories.some((c) => re.test(c.name)) ||
    p.brands.some((b) => re.test(b))
  );
}

export function getBrandsForGroup(group?: string | null): { name: string; count: number }[] {
  const pool = getProducts().filter((p) => !group || p.group === group);
  return BRAND_LIST.map((name) => ({
    name,
    count: pool.filter((p) => matchesTerm(p, name)).length,
  }))
    .filter((b) => b.count >= 3)
    .sort((a, b) => b.count - a.count)
    .slice(0, 14);
}

export function getFlavoursForGroup(group?: string | null): { name: string; count: number }[] {
  const pool = getProducts().filter((p) => !group || p.group === group);
  return FLAVOUR_LIST.map((name) => ({
    name,
    count: pool.filter((p) => new RegExp(name, "i").test(p.name)).length,
  }))
    .filter((f) => f.count >= 3)
    .sort((a, b) => b.count - a.count)
    .slice(0, 16);
}

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
  if (opts.brand) items = items.filter((p) => matchesTerm(p, opts.brand!));
  if (opts.flavour) {
    const re = new RegExp(opts.flavour.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
    items = items.filter((p) => re.test(p.name));
  }
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
  // 178 supplier listings ship a blank "import placeholder" image — sink
  // them below products with real photos in the default sort
  const hasRealPhoto = (p: Product) =>
    p.images.length > 0 && !/placeholder/i.test(p.images[0].alt ?? "");
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
      // "featured": in-stock first, real photos before placeholders, then name
      items = [...items].sort(
        (a, b) =>
          Number(b.in_stock) - Number(a.in_stock) ||
          Number(hasRealPhoto(b)) - Number(hasRealPhoto(a)) ||
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

// Homepage features only well-photographed listings: 3+ real product
// images (owner rule, placeholders don't count) AND a high-resolution
// primary shot measured from the actual files — no upscaled thumbnails.
const wellShot = (p: Product) => {
  const real = p.images.filter((im) => !isPlaceholderImage(im));
  return sellable(p) && real.length >= 3 && (real[0]?.width ?? 0) >= 700;
};

const HERO_EYEBROWS = ["Top Shelf", "Premium Pick", "Staff Favourite", "Trending Now"];

// Owner rule: the hero rotates core range only — no hardware/accessories
const HERO_GROUPS: GroupKey[] = ["disposables", "e-liquids", "pods"];

export function getHeroProducts(): { product: Product; eyebrow: string }[] {
  // Bundles / multi-packs make weak hero shots — single products only.
  // Best of each hero group first (priciest, sharpest photos), then fill
  // remaining slots with the next-best from any hero group.
  const pool = getProducts()
    .filter(
      (p) =>
        wellShot(p) &&
        HERO_GROUPS.includes(p.group) &&
        !/bundle|\(\d+\s*pcs\)|bulk buy/i.test(p.name)
    )
    .sort(
      (a, b) =>
        (b.price ?? b.price_min ?? 0) - (a.price ?? a.price_min ?? 0) ||
        (b.images[0]?.width ?? 0) - (a.images[0]?.width ?? 0)
    );
  const slides: { product: Product; eyebrow: string }[] = [];
  for (const g of HERO_GROUPS) {
    const p = pool.find((x) => x.group === g);
    if (p) slides.push({ product: p, eyebrow: HERO_EYEBROWS[slides.length] });
  }
  for (const p of pool) {
    if (slides.length >= 4) break;
    if (!slides.some((s) => s.product.id === p.id)) {
      slides.push({ product: p, eyebrow: HERO_EYEBROWS[slides.length] });
    }
  }
  return slides;
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
      const rep =
        products
          .filter((p) => p.group === g.key && wellShot(p))
          .sort((a, b) => popularity(b) - popularity(a))[0] ??
        products
          .filter((p) => p.group === g.key && sellable(p) && primaryImage(p))
          .sort((a, b) => popularity(b) - popularity(a))[0];
      return { ...g, image: rep ? primaryImage(rep)?.src ?? null : null };
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
  // Owner rule: at most 2 accessory-type products in the featured grid
  const isAccessory = (p: Product) =>
    p.group === "accessories" ||
    p.group === "coils" ||
    /accessor/i.test(p.categories[0]?.name ?? "");
  const ranked = [...getProducts()]
    .filter(wellShot)
    .sort(
      (a, b) =>
        popularity(b) - popularity(a) ||
        (b.images[0]?.width ?? 0) - (a.images[0]?.width ?? 0)
    );
  const picks: Product[] = [];
  let accessories = 0;
  for (const p of ranked) {
    if (picks.length >= limit) break;
    if (isAccessory(p)) {
      if (accessories >= 2) continue;
      accessories++;
    }
    picks.push(p);
  }
  return picks;
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
