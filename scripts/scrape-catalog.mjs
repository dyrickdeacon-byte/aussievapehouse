// Scrapes the full product catalog from aussievapemart.com.au (WooCommerce Store API)
// into ./catalog: products.json (cleaned), products.csv (summary), images/ (all product images).
// Rerunnable: already-downloaded images are skipped, so it resumes where it left off.
//
// Usage: node scripts/scrape-catalog.mjs

import { mkdir, writeFile, stat } from "node:fs/promises";
import { createWriteStream } from "node:fs";
import { Readable } from "node:stream";
import { pipeline } from "node:stream/promises";
import path from "node:path";

const API = "https://aussievapemart.com.au/wp-json/wc/store/v1/products";
const OUT = path.resolve("catalog");
const IMG_DIR = path.join(OUT, "images");
const PER_PAGE = 100;
const IMG_CONCURRENCY = 10;

async function fetchJson(url, tries = 3) {
  for (let i = 1; i <= tries; i++) {
    try {
      const res = await fetch(url, { signal: AbortSignal.timeout(45000) });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.json();
    } catch (e) {
      if (i === tries) throw e;
      await new Promise((r) => setTimeout(r, 1500 * i));
    }
  }
}

function toDollars(cents, minorUnit) {
  if (cents == null || cents === "") return null;
  return Number(cents) / 10 ** (minorUnit ?? 2);
}

function stripHtml(html) {
  return (html ?? "")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&#\d+;/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function extFromUrl(url) {
  const m = new URL(url).pathname.match(/(\.[a-z0-9]+)$/i);
  return m ? m[1].toLowerCase() : ".jpg";
}

function csvCell(v) {
  const s = String(v ?? "");
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

async function main() {
  await mkdir(IMG_DIR, { recursive: true });

  // 1. Page through the catalog metadata
  const first = await fetch(`${API}?per_page=${PER_PAGE}&page=1`, {
    signal: AbortSignal.timeout(45000),
  });
  if (!first.ok) throw new Error(`HTTP ${first.status} on page 1`);
  const totalPages = Number(first.headers.get("x-wp-totalpages"));
  const total = Number(first.headers.get("x-wp-total"));
  console.log(`Catalog: ${total} products across ${totalPages} pages`);
  const raw = [...(await first.json())];

  for (let page = 2; page <= totalPages; page++) {
    const items = await fetchJson(`${API}?per_page=${PER_PAGE}&page=${page}`);
    raw.push(...items);
    console.log(`  metadata page ${page}/${totalPages} (${raw.length} products)`);
  }

  // 2. Clean + plan image downloads
  const seenSlugs = new Map(); // slug -> count, to disambiguate duplicates
  const downloads = []; // { url, file }
  const products = raw.map((p) => {
    let slug = p.slug || `product-${p.id}`;
    const n = seenSlugs.get(slug) ?? 0;
    seenSlugs.set(slug, n + 1);
    if (n > 0) slug = `${slug}--${p.id}`;

    const minor = p.prices?.currency_minor_unit ?? 2;
    const images = [];
    (p.images ?? []).forEach((img, i) => {
      if (!img?.src) return;
      const file = `${slug}${i > 0 ? `-${i}` : ""}${extFromUrl(img.src)}`;
      images.push({ src: img.src, alt: img.alt || p.name, local: `images/${file}` });
      downloads.push({ url: img.src, file });
    });

    return {
      id: p.id,
      name: p.name,
      slug,
      sku: p.sku || null,
      type: p.type,
      permalink: p.permalink,
      categories: (p.categories ?? []).map((c) => ({ id: c.id, name: c.name, slug: c.slug })),
      tags: (p.tags ?? []).map((t) => t.name),
      brands: (p.brands ?? []).map((b) => b.name),
      currency: p.prices?.currency_code ?? "AUD",
      price: toDollars(p.prices?.price, minor),
      regular_price: toDollars(p.prices?.regular_price, minor),
      sale_price: toDollars(p.prices?.sale_price, minor),
      price_min: toDollars(p.prices?.price_range?.min_amount, minor),
      price_max: toDollars(p.prices?.price_range?.max_amount, minor),
      on_sale: p.on_sale,
      in_stock: p.is_in_stock,
      description_html: p.description ?? "",
      description_text: stripHtml(p.description),
      short_description_text: stripHtml(p.short_description),
      attributes: (p.attributes ?? []).map((a) => ({
        name: a.name,
        terms: (a.terms ?? []).map((t) => t.name),
      })),
      has_options: p.has_options,
      average_rating: p.average_rating,
      review_count: p.review_count,
      images,
    };
  });

  await writeFile(path.join(OUT, "products.json"), JSON.stringify(products, null, 1));

  const csvHeader = "id,name,category,brand,price,currency,on_sale,in_stock,type,image_file,permalink";
  const csvRows = products.map((p) =>
    [
      p.id, p.name, p.categories.map((c) => c.name).join(" | "), p.brands.join(" | "),
      p.price ?? (p.price_min != null ? `${p.price_min}-${p.price_max}` : ""),
      p.currency, p.on_sale, p.in_stock, p.type, p.images[0]?.local ?? "", p.permalink,
    ].map(csvCell).join(",")
  );
  await writeFile(path.join(OUT, "products.csv"), [csvHeader, ...csvRows].join("\n"));
  console.log(`Wrote products.json + products.csv (${products.length} products)`);
  console.log(`Images to download: ${downloads.length}`);

  // 3. Download images with a small worker pool; skip files that already exist
  let done = 0, skipped = 0;
  const failures = [];
  const queue = [...downloads];

  async function worker() {
    while (queue.length) {
      const job = queue.shift();
      if (!job) break;
      const dest = path.join(IMG_DIR, job.file);
      try {
        const existing = await stat(dest).catch(() => null);
        if (existing && existing.size > 0) { skipped++; continue; }
        let ok = false, lastErr;
        for (let t = 1; t <= 3 && !ok; t++) {
          try {
            const res = await fetch(job.url, { signal: AbortSignal.timeout(60000) });
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            await pipeline(Readable.fromWeb(res.body), createWriteStream(dest));
            ok = true;
          } catch (e) {
            lastErr = e;
            await new Promise((r) => setTimeout(r, 1000 * t));
          }
        }
        if (!ok) throw lastErr;
        done++;
        if (done % 200 === 0) console.log(`  images: ${done} downloaded, ${skipped} skipped, ${queue.length} left`);
      } catch (e) {
        failures.push({ url: job.url, file: job.file, error: String(e?.message ?? e) });
      }
    }
  }

  await Promise.all(Array.from({ length: IMG_CONCURRENCY }, worker));
  await writeFile(path.join(OUT, "failures.json"), JSON.stringify(failures, null, 1));
  console.log(`DONE. Images downloaded: ${done}, skipped (already present): ${skipped}, failed: ${failures.length}`);
  if (failures.length) console.log("See catalog/failures.json for the failed URLs.");
}

main().catch((e) => {
  console.error("FATAL:", e);
  process.exit(1);
});
