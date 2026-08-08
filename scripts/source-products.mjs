// Imports products from the specific collections the owner nominated.
//
//  - SOURCES below are exactly the linked collections — nothing else is pulled.
//  - Images carrying an owner watermark are skipped, never altered
//    (scripts/watermark-detect.mjs). alibarbarvapefrance is excluded entirely.
//  - Price numbers are carried across unchanged and shown in AU$ (note:
//    vapebarstore lists in EUR — see the report at the end of the run).
//  - Images re-encoded to webp <=1000px into public/sourced/.
//  - Output catalog/sourced-products.json is merged by lib/catalog.ts ahead
//    of the base catalog, so these replace lower-res existing entries.
//
// Usage: node scripts/source-products.mjs

import { mkdirSync, writeFileSync, readFileSync } from "node:fs";
import path from "node:path";
import sharp from "sharp";
import { watermarkScore, WATERMARK_THRESHOLD } from "./watermark-detect.mjs";

const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/126 Safari/537.36";
const OUT_IMG = path.resolve("public", "sourced");
const OUT_JSON = path.resolve("catalog", "sourced-products.json");
const MIN_WIDTH = 700;

const SOURCES = [
  {
    id: "iget-bar-pro",
    kind: "shopify-collection",
    label: "IGET Bar Pro 10000",
    url: "https://www.igetexpressaustralia.com/collections/iget-bar-pro-10000-puff",
    brand: "IGET",
    currency: "AUD",
  },
  {
    id: "alibarbar",
    kind: "woo-category",
    label: "Alibarbar",
    base: "https://ozvapeones.com",
    categoryId: 578,
    brand: "Alibarbar",
    currency: "AUD",
  },
  {
    id: "iget-moon-k5000",
    kind: "woo-category",
    label: "IGET Moon K5000",
    base: "https://ozvapeones.com",
    categoryId: 591,
    brand: "IGET",
    currency: "AUD",
  },
  {
    id: "elf-bar",
    kind: "vapebarstore",
    label: "Elf Bar",
    url: "https://vapebarstore.io/products/elf-bar_en",
    brand: "Elf Bar",
    currency: "EUR",
  },
];

const GROUP_MATCHERS = [
  ["pods", /\bpods?\b/i],
  ["coils", /\bcoils?\b/i],
  ["e-liquids", /e-?liquid|ejuice|juice|salts?\b|shortfill/i],
  ["kits", /\bkit\b|\bmod\b|\btank\b|device only/i],
  ["disposables", /bar|puff|iget|alibarbar|elf|moon|pro|disposab/i],
];

const classify = (name) => {
  for (const [key, re] of GROUP_MATCHERS) if (re.test(name)) return key;
  return "disposables";
};

const slugify = (s) =>
  s.toLowerCase().replace(/&/g, " and ").replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "").slice(0, 90);

function stripHtml(html) {
  return (html ?? "")
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<img[^>]*>/gi, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ").replace(/&amp;/g, "&").replace(/&#\d+;/g, "")
    .replace(/\s+/g, " ").trim();
}

// Source copy is another retailer's marketing text — keep factual sentences
// only, drop store self-promo, cap length. Owner can rewrite in admin.
function toDescription(raw, name) {
  const text = stripHtml(raw);
  if (!text) return `${name} — now in stock at Aussie Vape House.`;
  const sentences = text.split(/(?<=[.!?])\s+/);
  const kept = sentences.filter(
    (s) =>
      s.length > 15 &&
      !/(shop|buy|order|visit|browse|checkout|delivery|shipping|store|website|www\.|http|discount|cheap|best price|contact|vapebarstore|ozvape|iget express)/i.test(s)
  );
  const body = (kept.length ? kept : sentences).slice(0, 4).join(" ").slice(0, 700);
  return body || `${name} — now in stock at Aussie Vape House.`;
}

async function fetchText(url, tries = 3) {
  for (let i = 1; i <= tries; i++) {
    try {
      const r = await fetch(url, {
        headers: { "User-Agent": UA },
        signal: AbortSignal.timeout(45000),
      });
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      return await r.text();
    } catch (e) {
      if (i === tries) throw e;
      await new Promise((res) => setTimeout(res, 1200 * i));
    }
  }
}
const fetchJson = async (u) => JSON.parse(await fetchText(u));

async function collectShopifyCollection(src) {
  const out = [];
  for (let page = 1; page <= 10; page++) {
    const j = await fetchJson(`${src.url}/products.json?limit=250&page=${page}`);
    if (!j.products?.length) break;
    for (const p of j.products) {
      const v = p.variants?.[0];
      if (!v) continue;
      out.push({
        src,
        title: p.title.trim(),
        price: Number(v.price),
        comparePrice: v.compare_at_price ? Number(v.compare_at_price) : null,
        inStock: v.available !== false,
        description: toDescription(p.body_html, p.title),
        images: (p.images || []).filter((im) => (im.width ?? 0) >= MIN_WIDTH)
          .slice(0, 4).map((im) => im.src),
      });
    }
  }
  return out;
}

async function collectWooCategory(src) {
  const out = [];
  for (let page = 1; page <= 10; page++) {
    const items = await fetchJson(
      `${src.base}/wp-json/wc/store/v1/products?per_page=100&page=${page}&category=${src.categoryId}`
    );
    if (!items.length) break;
    for (const p of items) {
      const minor = p.prices?.currency_minor_unit ?? 2;
      const price = Number(p.prices?.price ?? 0) / 10 ** minor;
      if (!(price > 0)) continue;
      out.push({
        src,
        title: p.name.trim(),
        price,
        comparePrice:
          p.prices?.regular_price && p.prices.regular_price !== p.prices.price
            ? Number(p.prices.regular_price) / 10 ** minor
            : null,
        inStock: p.is_in_stock !== false,
        description: toDescription(p.description, p.name),
        images: (p.images || []).slice(0, 4).map((im) => im.src),
      });
    }
    if (items.length < 100) break;
  }
  return out;
}

// Custom CMS: parse the listing tiles, and swap the thumbnail path for the
// full-resolution original (product_small/… -> product/…, 2000px).
async function collectVapeBarStore(src) {
  const html = await fetchText(src.url);
  const out = [];
  const tiles = html.split('class="one-product"').slice(1);
  for (const tile of tiles) {
    const title = tile.match(/class="one-product-list-title"[^>]*>([^<]+)</i)?.[1]?.trim();
    const img = tile.match(/src="([^"]*product_small\/[^"?]+)/i)?.[1];
    const priceRaw = tile.match(/class="price"[^>]*>\s*([\d.,]+)/i)?.[1];
    if (!title || !img || !priceRaw) continue;
    // "26,90" -> 26.90
    const price = Number(priceRaw.replace(/\./g, "").replace(",", "."));
    if (!(price > 0)) continue;
    const specs = [...tile.matchAll(/<span>([^<]{2,30})<\/span>/g)]
      .map((m) => m[1].trim())
      .filter((s) => /puff|ml|mg|nicotine/i.test(s));
    out.push({
      src,
      title,
      price,
      comparePrice: null,
      inStock: /on-stock-text/.test(tile),
      description: toDescription(specs.join(". "), title),
      images: [img.replace("/product_small/", "/product/")],
    });
  }
  return out;
}

async function processImage(url, slug, index) {
  const res = await fetch(url, {
    headers: { "User-Agent": UA },
    signal: AbortSignal.timeout(60000),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const buf = Buffer.from(await res.arrayBuffer());

  const meta = await sharp(buf).metadata();
  if ((meta.width ?? 0) < MIN_WIDTH) return { skipped: "low-res" };

  const wm = await watermarkScore(buf);
  if (wm.score >= WATERMARK_THRESHOLD) return { skipped: "watermarked" };

  const file = `${slug}${index ? `-${index}` : ""}.webp`;
  const out = await sharp(buf)
    .resize({ width: 1000, height: 1000, fit: "inside", withoutEnlargement: true })
    .webp({ quality: 82 })
    .toBuffer();
  writeFileSync(path.join(OUT_IMG, file), out);
  const m2 = await sharp(out).metadata();
  return {
    image: { src: `/sourced/${file}`, alt: slug.replace(/-/g, " "), width: m2.width ?? 0, height: m2.height ?? 0 },
  };
}

async function main() {
  mkdirSync(OUT_IMG, { recursive: true });

  const raw = [];
  for (const src of SOURCES) {
    process.stdout.write(`Collecting ${src.label}… `);
    try {
      const items =
        src.kind === "shopify-collection" ? await collectShopifyCollection(src)
        : src.kind === "woo-category" ? await collectWooCategory(src)
        : await collectVapeBarStore(src);
      console.log(`${items.length} products`);
      raw.push(...items);
    } catch (e) {
      console.log(`FAILED (${e.message})`);
    }
  }

  const base = JSON.parse(readFileSync(path.resolve("catalog", "products.json"), "utf8"));
  const baseNames = new Set(base.map((p) => p.name.trim().toLowerCase()));

  const seen = new Set();
  const products = [];
  const stats = { watermarked: 0, lowres: 0, noImage: 0, replaced: 0, added: 0, failed: 0 };
  const perSource = {};
  let n = 0;

  for (const item of raw) {
    n++;
    if (n % 25 === 0) console.log(`  processed ${n}/${raw.length}…`);
    let slug = slugify(item.title);
    if (!slug || seen.has(slug)) slug = `${slug}-${n}`;
    seen.add(slug);

    const images = [];
    for (let i = 0; i < item.images.length && images.length < 3; i++) {
      try {
        const r = await processImage(item.images[i], slug, images.length);
        if (r.image) images.push(r.image);
        else if (r.skipped === "watermarked") stats.watermarked++;
        else if (r.skipped === "low-res") stats.lowres++;
      } catch {
        stats.failed++;
      }
    }
    if (!images.length) { stats.noImage++; continue; }

    const replaces = baseNames.has(item.title.trim().toLowerCase());
    replaces ? stats.replaced++ : stats.added++;
    perSource[item.src.id] = (perSource[item.src.id] ?? 0) + 1;

    products.push({
      slug,
      name: item.title,
      price: Math.round(item.price * 100) / 100,
      regular_price: item.comparePrice ? Math.round(item.comparePrice * 100) / 100 : null,
      group: classify(item.title),
      brand: item.src.brand,
      categoryName: item.src.label,
      descriptionHtml: `<p>${item.description}</p>`,
      images,
      // The source's stock flag describes THEIR warehouse, not this store's.
      // Availability here is confirmed when the owner processes the order.
      in_stock: true,
      source: item.src.id,
      sourceCurrency: item.src.currency,
      createdAt: new Date().toISOString(),
    });
  }

  writeFileSync(OUT_JSON, JSON.stringify(products, null, 1));

  console.log("\n── Import complete ──");
  for (const src of SOURCES) {
    console.log(`  ${src.label.padEnd(22)} ${perSource[src.id] ?? 0} imported`);
  }
  console.log(`total written : ${products.length}`);
  console.log(`  replacing existing catalog entries : ${stats.replaced}`);
  console.log(`  brand new                          : ${stats.added}`);
  console.log(`images skipped — watermarked : ${stats.watermarked}`);
  console.log(`images skipped — under ${MIN_WIDTH}px  : ${stats.lowres}`);
  console.log(`products dropped (no usable image)  : ${stats.noImage}`);
  console.log(`image download failures             : ${stats.failed}`);
  const eur = products.filter((p) => p.sourceCurrency === "EUR").length;
  if (eur) console.log(`\nNOTE: ${eur} Elf Bar products came from a EUR-priced source; numbers were kept as-is and shown as AU$.`);
}

main().catch((e) => { console.error("FATAL:", e); process.exit(1); });
