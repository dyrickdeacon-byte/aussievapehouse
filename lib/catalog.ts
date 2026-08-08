import { readFileSync } from "node:fs";
import { getCustomProducts, slugify, type CustomProduct } from "@/lib/products-custom";
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
  /** ISO date — set for owner-added products (drives "newest first") */
  createdAt?: string;
  /** True for products created in the admin dashboard */
  isCustom?: boolean;
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
  /why (choose|buy|shop)|shipping|deliver|about (us|aussie|vape)|faq|frequently asked|warranty|order (from|online)|where to buy|australia.?wide|customer|support|payment|returns|contact|conclusion|final (thoughts|words)|online today|get yours|discreet|browse|explore|bundle|\(\d+\s*pcs\)|mixed flavours|wholesale|bulk buy/i;

const KEEP_HEADING = /specification|package content|what's in|contents|advantage|feature/i;

// Other retailers' names + generic promo phrasing that leaked in from the
// supplier scraping THEIR catalog off competitor stores
const STORE_NAMES =
  "ozvapeshops?|oz ?vape ?shops?|vapelink|vape ?king|vaper ?choice|vape ?superstore|vapestore|iget vapes? australia";
const STORE_PROMO_SENTENCE = new RegExp(
  `[^.!?<>]*\\b(?:${STORE_NAMES}|visit us|is the place to be|look no further)\\b[^.!?<>]*[.!?]`,
  "gi"
);
// Fallback: any block element still naming another store after
// sentence-stripping (inline tags break sentence boundaries, and the
// blocks carry class attributes) gets dropped whole
const STORE_PROMO_PARAGRAPH = new RegExp(
  `<(p|li|h2|h3)[^>]*>(?:(?!</\\1>)[\\s\\S])*?\\b(?:${STORE_NAMES})\\b(?:(?!</\\1>)[\\s\\S])*?</\\1>`,
  "gi"
);

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

// Page-builder CSS (Elementor/GreenShift) dumped as literal TEXT inside
// the description — "#gspb_row-id-x{...}", "@media(...){...}" etc., with
// `--` often entity-mangled to en dashes. Peel rules from the inside out.
function stripCssBlobs(html: string): string {
  let out = html;
  for (let i = 0; i < 5; i++) {
    const before = out;
    out = out
      // a CSS rule: selector-ish run + {props containing a colon}
      .replace(/[#.@\w&][^{}<>]{0,400}\{[^{}]*:[^{}]*\}/g, "")
      // @media / keyframes shells left hollow after inner rules removed
      .replace(/@[\w-]+[^{}<>]{0,300}\{[\s;]*\}/g, "")
      // stray closers
      .replace(/\{[\s;]*\}/g, "");
    if (out === before) break;
  }
  return out;
}

function cleanDescription(html: string): string {
  const base = stripCssBlobs(html)
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<iframe[\s\S]*?<\/iframe>/gi, "")
    .replace(/<video[\s\S]*?<\/video>/gi, "")
    .replace(/<audio[\s\S]*?<\/audio>/gi, "")
    .replace(/<source[^>]*>/gi, "")
    // embedded images hotlink dead external CDNs — the "broken image" reports
    .replace(/<img[^>]*>/gi, "")
    .replace(/<figure[^>]*>/gi, "")
    .replace(/<\/figure>/gi, "")
    .replace(/<a\b[^>]*>/gi, "")
    .replace(/<\/a>/gi, "")
    // page-builder scaffolding divs (elementor/gspb wrappers, spacers) —
    // our .desc styles only render p/h/ul/table content anyway
    .replace(/<\/?div[^>]*>/gi, "")
    .replace(/<span[^>]*class="[^"]*(?:gspb_|elementor)[^"]*"[^>]*>[\s\S]*?<\/span>/gi, "")
    .replace(/[^.!?<>]*click here[^.!?<>]*[.!?]/gi, "")
    .replace(/Aussie Vape Mart( Australia)?/gi, "Aussie Vape House")
    // run the promo strips here too so the over-cleaned fallback path
    // can't resurrect competitor-store copy
    .replace(STORE_PROMO_SENTENCE, "")
    .replace(STORE_PROMO_PARAGRAPH, "")
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
    // Third-party store self-promo left in by the supplier's own scraping
    // ("At Ozvapeshops, we provide…", "…Vapelink is the place to be.")
    cleaned = cleaned
      .replace(STORE_PROMO_SENTENCE, "")
      .replace(STORE_PROMO_PARAGRAPH, "");
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
  let result = kept.join("\n").trim();
  // Over-cleaned to nothing but the source had substance? Keep the first
  // stretch of the source (headings with the old title format dropped).
  if (!result) {
    const fallback = base.replace(/<h[23][^>]*>[^<]*\|[^<]*<\/h[23]>/gi, "");
    if (fallback.replace(/<[^>]+>/g, " ").trim()) {
      result = truncateAtBoundary(fallback, 1200).trim();
    }
  }
  return result;
}

// Alt text should describe the product, not carry a whole description.
// Falls back to the product name when the source alt is junk.
function cleanAltText(alt: string | undefined, productName: string): string {
  const a = decodeEntities(alt ?? "").replace(/\s+/g, " ").trim();
  // Leave placeholder markers intact — isPlaceholderImage keys off them to
  // exclude the listings the supplier never photographed.
  if (/placeholder/i.test(a)) return a;
  if (!a || a.length > 120 || /^#|\*\*|\]\(|aussie vape mart|ozvapeshop|vapelink/i.test(a)) {
    return productName;
  }
  return a;
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
// Broken supplier imports: listings literally named "Product" (or blank).
// Nothing real to sell there — drop them from the catalog.
function dropJunk(products: Product[]): Product[] {
  return products.filter(
    (p) => p.name.trim().length >= 4 && p.name.trim().toLowerCase() !== "product"
  );
}

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

function getBaseProducts(): Product[] {
  if (!cache) {
    const meta = loadImageMeta();
    const file = path.join(process.cwd(), "catalog", "products.json");
    const raw = JSON.parse(readFileSync(file, "utf8")) as RawProduct[];
    cache = dropJunk(
      dedupe(
      raw.map((p) => ({
        ...p,
        name: decodeEntities(p.name),
        categories: p.categories.map((c) => ({ ...c, name: decodeEntities(c.name) })),
        images: p.images.map((im) => {
          const name = im.local.replace(/^images\//, "");
          const [width, height] = meta[name] ?? [0, 0];
          // Served as a pre-optimised static webp from public/products/
          // (scripts/optimise-images.mjs) — deploys with the app, no
          // image-optimiser quota and no hotlinking the supplier.
          const webp = name.replace(/\.[a-z0-9]+$/i, "") + ".webp";
          return {
            ...im,
            // some scraped alts hold an entire markdown description
            // (complete with the old store's branding) — keep alts short
            alt: cleanAltText(im.alt, p.name),
            remote: im.src,
            src: `/products/${webp}`,
            width: Math.min(width || 800, 800),
            height: Math.min(height || 800, 800),
          };
        }),
        description_html: cleanDescription(p.description_html),
        description_text: p.description_text.replace(
          /Aussie Vape Mart( Australia)?/gi,
          "Aussie Vape House"
        ),
        group: classify(p),
      }))
      )
    );
  }
  return cache;
}

// Owner-added products (admin dashboard) mapped into the catalog shape so
// they behave exactly like built-in ones: product page, search, categories,
// cart. They carry createdAt so "newest first" can float them to the top.
function customToProduct(c: CustomProduct): Product {
  return {
    id: c.id,
    name: c.name,
    slug: c.slug,
    sku: null,
    type: "simple",
    permalink: `/product/${c.slug}`,
    // Own collection slug (not the group) so each collection is separately
    // filterable in the shop sidebar
    categories: [
      {
        id: 0,
        name: c.categoryName || groupLabel(c.group),
        slug: slugify(c.categoryName || groupLabel(c.group)),
      },
    ],
    tags: [],
    brands: c.brand ? [c.brand] : [],
    currency: "AUD",
    price: c.price,
    regular_price: c.regular_price,
    sale_price: c.price,
    price_min: null,
    price_max: null,
    on_sale: !!c.regular_price && c.regular_price > c.price,
    in_stock: c.in_stock,
    description_html: c.descriptionHtml,
    description_text: c.descriptionHtml.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim(),
    short_description_text: "",
    attributes: [],
    has_options: false,
    average_rating: "5",
    review_count: 0,
    images: c.images.map((im) => ({
      src: im.src,
      alt: im.alt || c.name,
      local: im.src,
      remote: im.src,
      width: im.width,
      height: im.height,
    })),
    group: c.group,
    createdAt: c.createdAt,
    isCustom: true,
  };
}

// Products imported by scripts/source-products.mjs (committed file, so they
// ship with the deploy). Same shape as admin-created ones.
let sourcedCache: Product[] | null = null;
function getSourcedProducts(): Product[] {
  if (!sourcedCache) {
    try {
      const raw = JSON.parse(
        readFileSync(path.join(process.cwd(), "catalog", "sourced-products.json"), "utf8")
      ) as (CustomProduct & { replacesBaseName: string | null })[];
      sourcedCache = raw.map((c, i) =>
        customToProduct({ ...c, id: 800_000 + i, updatedAt: c.createdAt })
      );
    } catch {
      sourcedCache = [];
    }
  }
  return sourcedCache;
}

// Merged catalog, highest precedence first:
//   1. admin-created products   2. sourced imports   3. base scraped catalog
// A sourced/admin product replaces a base entry with the same name or slug,
// so the better photography wins. Products with no real photo are excluded
// entirely (owner rule).
export async function getProducts(): Promise<Product[]> {
  let custom: Product[] = [];
  try {
    custom = (await getCustomProducts()).map(customToProduct);
  } catch (e) {
    console.error("[catalog] custom products unavailable:", e);
  }
  const sourced = getSourcedProducts();

  const takenSlugs = new Set(custom.map((p) => p.slug));
  const takenNames = new Set(custom.map((p) => p.name.trim().toLowerCase()));
  const sourcedKept = sourced.filter(
    (p) => !takenSlugs.has(p.slug) && !takenNames.has(p.name.trim().toLowerCase())
  );
  for (const p of sourcedKept) {
    takenSlugs.add(p.slug);
    takenNames.add(p.name.trim().toLowerCase());
  }

  const base = getBaseProducts().filter(
    (p) =>
      !!primaryImage(p) &&
      !takenSlugs.has(p.slug) &&
      !takenNames.has(p.name.trim().toLowerCase())
  );
  return [...custom, ...sourcedKept, ...base];
}

export async function getProductBySlug(slug: string): Promise<Product | undefined> {
  return (await getProducts()).find((p) => p.slug === slug);
}

// Deduping and sourcing drop duplicate listings, so their old slugs would
// 404. Map a dropped slug to the surviving product with the same name.
export async function resolveRetiredSlug(slug: string): Promise<string | null> {
  const raw = JSON.parse(
    readFileSync(path.join(process.cwd(), "catalog", "products.json"), "utf8")
  ) as { slug: string; name: string }[];
  const dropped = raw.find((p) => p.slug === slug);
  if (!dropped) return null;
  const target = (await getProducts()).find(
    (p) => p.name.trim().toLowerCase() === decodeEntities(dropped.name).trim().toLowerCase()
  );
  return target && target.slug !== slug ? target.slug : null;
}

export async function getGroupCounts(): Promise<{ key: GroupKey; label: string; count: number }[]> {
  const counts = new Map<GroupKey, number>();
  for (const p of await getProducts()) {
    counts.set(p.group, (counts.get(p.group) ?? 0) + 1);
  }
  return GROUPS.filter((g) => (counts.get(g.key) ?? 0) > 0).map((g) => ({
    key: g.key,
    label: g.label,
    count: counts.get(g.key) ?? 0,
  }));
}

export async function getCategoriesForGroup(
  group: GroupKey | null
): Promise<{ slug: string; name: string; count: number }[]> {
  const counts = new Map<string, { name: string; count: number }>();
  for (const p of await getProducts()) {
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
// Ordered most-specific first so "IGET Bar Pro" wins over plain "IGET"
const BRAND_LIST = [
  // newly sourced ranges
  "IGET Bar Pro", "IGET Moon", "IGET Bar Plus", "IGET Legend", "IGET Star",
  "Elf Bar Raya", "Elf Bar Duke", "Elf Bar MoonNight", "Elf Bar BC",
  "Alibarbar Ingot", "Alibarbar Pandora", "Alibarbar Upload", "Alibarbar Pro",
  // broader brands
  "IGET", "Elf Bar", "Alibarbar", "Geek Bar", "Geekvape", "HQD", "VooPoo",
  "Uwell", "Vaporesso", "DynaVap", "Nasty Juice", "Airmez", "SMOK",
  "Lost Vape", "Kado", "Waka", "Tyson", "Puffmi", "Lost Mary",
  "Pulse", "Cloud Nurdz", "Simrell", "Storz & Bickel",
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

export async function getBrandsForGroup(group?: string | null): Promise<{ name: string; count: number }[]> {
  const pool = (await getProducts()).filter((p) => !group || p.group === group);
  return BRAND_LIST.map((name) => ({
    name,
    count: pool.filter((p) => matchesTerm(p, name)).length,
  }))
    .filter((b) => b.count >= 3)
    .sort((a, b) => b.count - a.count)
    .slice(0, 14);
}

export async function getFlavoursForGroup(group?: string | null): Promise<{ name: string; count: number }[]> {
  const pool = (await getProducts()).filter((p) => !group || p.group === group);
  return FLAVOUR_LIST.map((name) => ({
    name,
    count: pool.filter((p) => new RegExp(name, "i").test(p.name)).length,
  }))
    .filter((f) => f.count >= 3)
    .sort((a, b) => b.count - a.count)
    .slice(0, 16);
}

export async function searchProducts(opts: SearchOptions): Promise<{
  items: Product[];
  total: number;
  page: number;
  pages: number;
}> {
  const perPage = opts.perPage ?? 24;
  let items = await getProducts();

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
      // "featured": in-stock first, then name
      items = [...items].sort(
        (a, b) =>
          Number(b.in_stock) - Number(a.in_stock) ||
          a.name.localeCompare(b.name)
      );
  }

  // Owner rule: whatever the sort, products without a real photo list last
  const withPhoto: Product[] = [];
  const withoutPhoto: Product[] = [];
  for (const p of items) (primaryImage(p) ? withPhoto : withoutPhoto).push(p);
  items = [...withPhoto, ...withoutPhoto];

  // Owner-added products lead their category on the default sort (newest
  // first among themselves); explicit price/name sorts are left alone.
  if (!opts.sort || opts.sort === "featured") {
    const fresh = items
      .filter((p) => p.isCustom)
      .sort((a, b) => (b.createdAt ?? "").localeCompare(a.createdAt ?? ""));
    if (fresh.length) {
      const freshIds = new Set(fresh.map((p) => p.id));
      items = [...fresh, ...items.filter((p) => !freshIds.has(p.id))];
    }
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

export async function getFeatured(limit = 8): Promise<Product[]> {
  const seen = new Set<GroupKey>();
  const picks: Product[] = [];
  const pool = (await getProducts()).filter(
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

const HERO_EYEBROWS = [
  "Most Wanted",
  "Top Shelf",
  "Trending Now",
  "Staff Favourite",
  "Big Puffs",
  "Fan Favourite",
  "Hot Right Now",
  "Premium Pick",
  "Crowd Pleaser",
];

// Owner rule: the hero rotates the client's high-demand lines — products
// NOT already shown elsewhere on the homepage (pass those ids to exclude).
export async function getHeroProducts(
  excludeIds: number[] = [],
  limit = 9
): Promise<{ product: Product; eyebrow: string }[]> {
  const excluded = new Set(excludeIds);
  // Hero shots must be high-res (≥700px measured) — no fuzzy thumbnails.
  // Only two high-demand lines have such photos, so: those first (max 2
  // slides each), then other sharp-shot products for variety — never the
  // same two brands ping-ponging all nine slides.
  const pool = (await getProducts()).filter(
    (p) =>
      sellable(p) &&
      (primaryImage(p)?.width ?? 0) >= 700 &&
      !excluded.has(p.id) &&
      !/bundle|\(\d+\s*pcs\)|bulk buy/i.test(p.name)
  );
  const rank = (p: Product) =>
    (primaryImage(p)?.width ?? 0) + (p.price ?? p.price_min ?? 0);
  // Brand word — caps any single brand at 2 hero slides
  const familyOf = (p: Product) => p.name.toLowerCase().split(/\s+/)[0];

  const picks: Product[] = [];
  const used = new Set<number>();
  const famCount = new Map<string, number>();
  const push = (p: Product) => {
    used.add(p.id);
    famCount.set(familyOf(p), (famCount.get(familyOf(p)) ?? 0) + 1);
    picks.push(p);
  };

  // Phase 1: high-demand lines, up to 2 slides per line
  for (let round = 0; round < 2; round++) {
    for (const line of HIGH_DEMAND_LINES) {
      if (picks.length >= limit) break;
      const next = pool
        .filter((p) => !used.has(p.id) && line.match.test(p.name))
        .sort((a, b) => rank(b) - rank(a))[0];
      if (next) push(next);
    }
  }

  // Phase 2: fill with other quality products — mainstream vape gear
  // (disposables, kits, pods, e-liquids), keeping niche dry-herb/artisan
  // hardware off the marquee; max 2 per product family
  const GROUP_WEIGHT: Partial<Record<GroupKey, number>> = {
    disposables: 3,
    kits: 2,
    pods: 2,
    "e-liquids": 2,
  };
  const NICHE =
    /dynavap|vapcap|flame ?powered|stem\b|brick|wynd|unidyn|induction|dry ?herb|bong|dab|puffco|proxy|concentrate|rig\b/i;
  const rest = pool
    .filter((p) => !used.has(p.id) && !NICHE.test(p.name))
    .sort(
      (a, b) =>
        (GROUP_WEIGHT[b.group] ?? 0) - (GROUP_WEIGHT[a.group] ?? 0) ||
        rank(b) - rank(a)
    );
  for (const p of rest) {
    if (picks.length >= limit) break;
    if ((famCount.get(familyOf(p)) ?? 0) >= 2) continue;
    push(p);
  }

  return picks.map((product, i) => ({
    product,
    eyebrow: HERO_EYEBROWS[i % HERO_EYEBROWS.length],
  }));
}

export async function getCategoryTiles(): Promise<{
  key: GroupKey;
  label: string;
  count: number;
  image: string | null;
}[]> {
  const products = await getProducts();
  return (await getGroupCounts())
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
  "Elf Bar",
  "HQD",
  "VooPoo",
  "Uwell",
  "Vaporesso",
  "DynaVap",
  "Nasty Juice",
  "Airmez",
];

// The owner's must-feature lines — one best-in-show product per line
// fills the homepage "high demand" rail
const HIGH_DEMAND_LINES: { name: string; match: RegExp }[] = [
  { name: "IGET Bar Plus", match: /iget bar plus|bar plus/i },
  { name: "IGET Bar Pro", match: /iget bar pro|bar pro/i },
  { name: "IGET Bar", match: /iget bar\b(?! plus| pro)/i },
  { name: "IGET Legend", match: /iget legend/i },
  { name: "IGET One", match: /iget one/i },
  { name: "IGET Moon", match: /iget moon/i },
  { name: "IGET Star", match: /iget star/i },
  { name: "Geek Bar", match: /geek ?bar/i },
  { name: "Elf Bar", match: /elf ?bar/i },
  { name: "Alibarbar", match: /alibarbar/i },
];

export async function getHighDemand(limit = 10): Promise<Product[]> {
  const pool = (await getProducts()).filter(
    (p) =>
      sellable(p) &&
      primaryImage(p) &&
      !/bundle|\(\d+\s*pcs\)|bulk/i.test(p.name)
  );
  const score = (p: Product) =>
    (primaryImage(p)?.width ?? 0) + (p.on_sale ? 300 : 0);
  const picks: Product[] = [];
  const used = new Set<number>();
  for (const line of HIGH_DEMAND_LINES) {
    const best = pool
      .filter((p) => !used.has(p.id) && line.match.test(p.name))
      .sort((a, b) => score(b) - score(a))[0];
    if (best) {
      used.add(best.id);
      picks.push(best);
    }
  }
  // Fill remaining slots round-robin across the lines so one brand
  // doesn't monopolise the rail
  let added = true;
  while (picks.length < limit && added) {
    added = false;
    for (const line of HIGH_DEMAND_LINES) {
      if (picks.length >= limit) break;
      const next = pool
        .filter((p) => !used.has(p.id) && line.match.test(p.name))
        .sort((a, b) => score(b) - score(a))[0];
      if (next) {
        used.add(next.id);
        picks.push(next);
        added = true;
      }
    }
  }
  return picks.slice(0, limit);
}

export async function getBrandCounts(): Promise<{ name: string; count: number }[]> {
  const products = await getProducts();
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

export async function getBestSellers(limit = 8): Promise<Product[]> {
  // Owner rule: at most 2 accessory-type products in the featured grid
  const isAccessory = (p: Product) =>
    p.group === "accessories" ||
    p.group === "coils" ||
    /accessor/i.test(p.categories[0]?.name ?? "");
  const ranked = [...(await getProducts())]
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

export async function getRelated(product: Product, limit = 4): Promise<Product[]> {
  const catSlugs = new Set(product.categories.map((c) => c.slug));
  // Owner rule: no photo-less products in "You might also like"
  const same = (await getProducts()).filter(
    (p) =>
      p.id !== product.id &&
      p.in_stock &&
      primaryImage(p) &&
      (p.categories.some((c) => catSlugs.has(c.slug)) || p.group === product.group)
  );
  // Deterministic but varied: rotate the list based on product id
  const offset = same.length ? product.id % same.length : 0;
  return [...same.slice(offset), ...same.slice(0, offset)].slice(0, limit);
}
