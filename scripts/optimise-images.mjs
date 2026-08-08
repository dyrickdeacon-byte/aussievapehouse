// Converts the scraped catalog images that live products actually use into
// small webp files under public/products/, so they deploy with the app and
// are served as static assets (no image-optimiser quota, no hotlinking).
//
// Usage: node scripts/optimise-images.mjs

import { existsSync, mkdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import path from "node:path";
import sharp from "sharp";

const SRC_DIR = path.resolve("catalog", "images");
const OUT_DIR = path.resolve("public", "products");
const MAX_EDGE = 800;
const QUALITY = 78;
const CONCURRENCY = 8;

mkdirSync(OUT_DIR, { recursive: true });

const base = JSON.parse(readFileSync(path.resolve("catalog", "products.json"), "utf8"));

// Only images belonging to products that survive to the live catalog, max 3 each
const wanted = new Set();
for (const p of base) {
  const real = p.images.filter((im) => !/placeholder/i.test(im.alt ?? ""));
  for (const im of real.slice(0, 3)) wanted.add(im.local.replace(/^images\//, ""));
}

const jobs = [...wanted];
console.log(`${jobs.length} images to process → ${OUT_DIR}`);

let done = 0, skipped = 0, failed = 0, bytesOut = 0;
const failures = [];

async function worker() {
  while (jobs.length) {
    const name = jobs.shift();
    if (!name) break;
    const src = path.join(SRC_DIR, name);
    const outName = name.replace(/\.[a-z0-9]+$/i, "") + ".webp";
    const out = path.join(OUT_DIR, outName);
    try {
      if (existsSync(out) && statSync(out).size > 0) {
        bytesOut += statSync(out).size;
        skipped++;
        continue;
      }
      if (!existsSync(src)) { failed++; failures.push(name); continue; }
      const buf = await sharp(src)
        .resize({ width: MAX_EDGE, height: MAX_EDGE, fit: "inside", withoutEnlargement: true })
        .webp({ quality: QUALITY })
        .toBuffer();
      writeFileSync(out, buf);
      bytesOut += buf.length;
      done++;
      if ((done + skipped) % 400 === 0) {
        console.log(`  ${done + skipped}/${wanted.size} (${(bytesOut / 1048576).toFixed(0)}MB so far)`);
      }
    } catch (e) {
      failed++;
      failures.push(`${name}: ${e.message}`);
    }
  }
}

await Promise.all(Array.from({ length: CONCURRENCY }, worker));

console.log(`\nconverted: ${done}  reused: ${skipped}  failed: ${failed}`);
console.log(`total size: ${(bytesOut / 1048576).toFixed(1)} MB`);
if (failures.length) {
  writeFileSync(path.resolve("catalog", "image-optimise-failures.json"), JSON.stringify(failures, null, 1));
  console.log(`failures written to catalog/image-optimise-failures.json`);
}
