// Crawls EVERY product page on the local dev server and reports any that
// fail to render: non-200s, error boundaries, or missing buy box.
// Usage: node scripts/crawl-products.mjs

import { readFileSync, writeFileSync } from "node:fs";

const audit = JSON.parse(readFileSync("catalog/audit-result.json", "utf8"));
const slugs = audit.slugs;
const BASE = "http://localhost:3000/product/";
const CONCURRENCY = 8;

let done = 0;
const failures = [];
const queue = [...slugs];

async function worker() {
  while (queue.length) {
    const slug = queue.shift();
    if (!slug) break;
    try {
      const res = await fetch(BASE + encodeURIComponent(slug), {
        signal: AbortSignal.timeout(30000),
      });
      if (!res.ok) {
        failures.push(`${res.status} ${slug}`);
        continue;
      }
      const html = await res.text();
      const hasBuyBox =
        html.includes("Add to cart") ||
        html.includes("Out of stock") ||
        html.includes("Pricing to be confirmed") ||
        html.includes("Currently out of stock");
      const hasError =
        html.includes("Application error") || html.includes("__next_error__");
      if (!hasBuyBox || hasError) {
        failures.push(`RENDER ${slug} buyBox=${hasBuyBox} err=${hasError}`);
      }
    } catch (e) {
      failures.push(`ERR ${slug} ${String(e?.message ?? e).slice(0, 40)}`);
    } finally {
      done++;
      if (done % 200 === 0) console.log(`crawled ${done}/${slugs.length}, failures: ${failures.length}`);
    }
  }
}

await Promise.all(Array.from({ length: CONCURRENCY }, worker));
writeFileSync("catalog/crawl-failures.json", JSON.stringify(failures, null, 1));
console.log(`DONE. ${done} pages crawled, ${failures.length} failures.`);
if (failures.length) console.log(failures.slice(0, 15).join("\n"));
