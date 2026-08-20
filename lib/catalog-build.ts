// Build-time only: turns the raw 28.6MB scrape into the runtime catalog.
// Kept out of lib/catalog.ts so the runtime module has no node:fs import —
// Cloudflare Workers have no filesystem, and importing fs there fails at
// bundle time. Used solely by scripts/build-runtime-catalog.mjs.

import { readFileSync } from "node:fs";
import path from "node:path";
import {
  cleanAltText,
  cleanDescription,
  classify,
  decodeEntities,
  dedupe,
  dropJunk,
  type Product,
  type RawProduct,
} from "@/lib/catalog";

function loadImageMeta(): Record<string, [number, number]> {
  try {
    return JSON.parse(
      readFileSync(path.join(process.cwd(), "catalog", "image-meta.json"), "utf8")
    );
  } catch {
    return {};
  }
}

// Prebuilt, fully-processed catalog (scripts/build-runtime-catalog.mjs).
// Shipping this instead of the 28.6MB raw scrape keeps the serverless
// bundle small — the raw file was being copied into every function and
// re-read on every cold start, which is what burned Vercel's transfer quota.
const RUNTIME_CATALOG = () =>
  path.join(process.cwd(), "catalog", "runtime-catalog.json");

export function computeBaseProducts(): Product[] {
  {
    const meta = loadImageMeta();
    const file = path.join(process.cwd(), "catalog", "products.json");
    const raw = JSON.parse(readFileSync(file, "utf8")) as RawProduct[];
    return dropJunk(
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
}

