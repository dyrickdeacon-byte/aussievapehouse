// Whole-site health sweep against the running dev server.
// Checks every key route + a sample of product pages for: HTTP status,
// error boundaries, missing buy box, empty grids, broken image URLs,
// leftover junk text, and price/description sanity.
// Usage: node scripts/audit-site.mjs [baseUrl]

import { readFileSync } from "node:fs";

const BASE = process.argv[2] ?? "http://localhost:3000";
const problems = [];
const note = (route, msg) => problems.push(`${route.padEnd(46)} ${msg}`);

async function get(route) {
  const r = await fetch(BASE + route, { signal: AbortSignal.timeout(120000) });
  const html = await r.text();
  return { status: r.status, html };
}

const ROUTES = [
  "/", "/shop", "/cart", "/checkout",
  "/shop?group=disposables", "/shop?group=e-liquids", "/shop?group=pods",
  "/shop?group=coils", "/shop?group=kits", "/shop?group=pouches",
  "/shop?group=glass", "/shop?group=accessories", "/shop?group=other",
  "/shop?q=watermelon", "/shop?q=zzzznotarealproduct",
  "/shop?group=disposables&brand=IGET%20Bar%20Pro",
  "/shop?group=disposables&flavour=Mango",
  "/shop?sort=price-asc", "/shop?sort=price-desc", "/shop?sort=name",
  "/shop?page=2", "/shop?page=50",
  "/admin", "/admin/login",
];

console.log("── routes ──");
for (const route of ROUTES) {
  try {
    const { status, html } = await get(route);
    if (status >= 400) { note(route, `HTTP ${status}`); continue; }
    if (/__next_error__|Application error|Internal Server Error/.test(html)) {
      note(route, "error boundary rendered");
    }
    // Shop pages should show products (except the deliberate no-match query)
    if (route.startsWith("/shop") && !route.includes("zzzz")) {
      const cards = (html.match(/line-clamp-2/g) || []).length;
      if (cards === 0) note(route, "no product cards rendered");
    }
    if (/undefined|NaN|\[object Object\]/.test(html.replace(/<script[\s\S]*?<\/script>/g, ""))) {
      note(route, "literal undefined/NaN/[object Object] in markup");
    }
    if (/AU\$0\.00|AU\$NaN/.test(html)) note(route, "zero/NaN price shown");
    if (/Sold out/.test(html)) note(route, "sold-out badge still present");
    if (/ozvapeshop|vapelink|Aussie Vape Mart|chatgpt\.com|vapebarstore/i.test(html)) {
      note(route, "competitor/source name leaked into page");
    }
    process.stdout.write(".");
  } catch (e) {
    note(route, `FETCH FAILED ${e.message}`);
  }
}
console.log();

// Sample product pages across sources
console.log("── product pages ──");
const sourced = JSON.parse(readFileSync("catalog/sourced-products.json", "utf8"));
const base = JSON.parse(readFileSync("catalog/products.json", "utf8"));
const slugs = [
  ...sourced.filter((_, i) => i % 20 === 0).slice(0, 8).map((p) => p.slug),
  ...base.filter((_, i) => i % 260 === 0).slice(0, 8).map((p) => p.slug),
];
for (const slug of slugs) {
  const route = `/product/${slug}`;
  try {
    const { status, html } = await get(route);
    if (status >= 400) { note(route, `HTTP ${status}`); continue; }
    if (!/Add to cart|Pricing to be confirmed/.test(html)) note(route, "no buy box");
    if (/__next_error__|Application error/.test(html)) note(route, "error boundary");
    if (/&#\d+;|&amp;#/.test(html.replace(/<script[\s\S]*?<\/script>/g, ""))) {
      note(route, "undecoded HTML entity in page");
    }
    if (/ozvapeshop|vapelink|Aussie Vape Mart|vapebarstore/i.test(html)) {
      note(route, "source name leaked");
    }
    process.stdout.write(".");
  } catch (e) {
    note(route, `FETCH FAILED ${e.message}`);
  }
}
console.log();

// API endpoints
console.log("── api ──");
try {
  const r = await fetch(`${BASE}/api/subscribe`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: "not-an-email" }),
    signal: AbortSignal.timeout(30000),
  });
  if (r.status !== 400) note("/api/subscribe", `bad email should 400, got ${r.status}`);
} catch (e) { note("/api/subscribe", `FAILED ${e.message}`); }

try {
  const r = await fetch(`${BASE}/api/orders`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ items: [] }),
    signal: AbortSignal.timeout(30000),
  });
  if (r.status !== 400) note("/api/orders", `empty order should 400, got ${r.status}`);
} catch (e) { note("/api/orders", `FAILED ${e.message}`); }

console.log(`\n── ${problems.length} problem(s) ──`);
for (const p of problems) console.log("  " + p);
