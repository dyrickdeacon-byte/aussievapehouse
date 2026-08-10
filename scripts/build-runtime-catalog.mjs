// Precomputes the storefront catalog so the deployed app never ships the
// 28.6MB raw scrape. Runs the exact same code path the app uses
// (computeBaseProducts) via tsx, then drops products that never render and
// fields nothing reads, and writes catalog/runtime-catalog.json.
//
// Wired into `npm run build` — see package.json.

import { writeFileSync, statSync } from "node:fs";
import path from "node:path";
import { computeBaseProducts } from "../lib/catalog.ts";

const products = computeBaseProducts();

// Only products that actually reach the storefront (a real photo, not a
// supplier placeholder) — matches the filter in getProducts().
const live = products.filter((p) =>
  p.images.some((im) => !/placeholder/i.test(im.alt ?? ""))
);

// Fields the storefront never reads — dropping them is most of the saving.
const slim = live.map((p) => ({
  id: p.id,
  name: p.name,
  slug: p.slug,
  sku: p.sku,
  type: p.type,
  permalink: p.permalink,
  categories: p.categories,
  tags: p.tags,
  brands: p.brands,
  currency: p.currency,
  price: p.price,
  regular_price: p.regular_price,
  sale_price: p.sale_price,
  price_min: p.price_min,
  price_max: p.price_max,
  on_sale: p.on_sale,
  in_stock: p.in_stock,
  description_html: p.description_html,
  // description_text is only used for search, and name/brand/category
  // already cover it — it was a straight duplicate of the description.
  description_text: "",
  short_description_text: "",
  attributes: p.attributes,
  has_options: p.has_options,
  average_rating: p.average_rating,
  review_count: p.review_count,
  images: p.images.map((im) => ({
    src: im.src,
    alt: im.alt,
    local: im.local,
    remote: "",
    width: im.width,
    height: im.height,
  })),
  group: p.group,
}));

const out = path.resolve("catalog", "runtime-catalog.json");
writeFileSync(out, JSON.stringify(slim));

const before = statSync(path.resolve("catalog", "products.json")).size;
const after = statSync(out).size;
console.log(
  `runtime catalog: ${slim.length} products (from ${products.length}) — ` +
    `${(before / 1048576).toFixed(1)}MB → ${(after / 1048576).toFixed(1)}MB`
);
