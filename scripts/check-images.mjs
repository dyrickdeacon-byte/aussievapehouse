// Crawls key storefront pages against the running dev server and requests
// every optimised image URL, reporting any that fail.
// Usage: node scripts/check-images.mjs [baseUrl]

const BASE = process.argv[2] ?? "http://localhost:3000";
const PAGES = [
  "/",
  "/shop",
  "/shop?group=disposables",
  "/shop?group=disposables&page=2",
  "/shop?group=e-liquids",
  "/shop?group=kits",
  "/shop?group=pods",
  "/shop?group=accessories",
  "/shop?group=glass",
];

// Next serialises these into HTML with &amp; entities
const IMG_RE = /\/_next\/image\?url=([^&"\\]+)&(?:amp;)?w=(\d+)&(?:amp;)?q=(\d+)/g;

const urls = new Set();
for (const page of PAGES) {
  try {
    const html = await (
      await fetch(BASE + page, { signal: AbortSignal.timeout(120000) })
    ).text();
    for (const m of html.matchAll(IMG_RE)) {
      urls.add(`/_next/image?url=${m[1]}&w=${m[2]}&q=${m[3]}`);
    }
  } catch (e) {
    console.log(`page failed: ${page} — ${e.message}`);
  }
}

console.log(`unique image URLs across ${PAGES.length} pages: ${urls.size}`);

const list = [...urls];
const bad = [];
for (let i = 0; i < list.length; i += 12) {
  const batch = list.slice(i, i + 12);
  const results = await Promise.all(
    batch.map(async (u) => {
      try {
        const r = await fetch(BASE + u, { signal: AbortSignal.timeout(30000) });
        return r.ok ? null : `${r.status} ${decodeURIComponent(u).slice(0, 100)}`;
      } catch (e) {
        return `ERR ${decodeURIComponent(u).slice(0, 100)}`;
      }
    })
  );
  bad.push(...results.filter(Boolean));
}

console.log(`BROKEN: ${bad.length}`);
if (bad.length) console.log(bad.slice(0, 15).join("\n"));
