import { NextResponse } from "next/server";
import { getProducts, primaryImage } from "@/lib/catalog";

// Dev-only data audit: runs every product through the same accessors the
// product page uses and reports anything off. Not linked from the UI.
export async function GET() {
  if (process.env.NODE_ENV === "production") {
    return new NextResponse("Not found", { status: 404 });
  }
  const products = await getProducts();
  const issues: Record<string, string[]> = {
    storeLeak: [],
    cssInDescription: [],
    imgInDescription: [],
    externalUrlInDescription: [],
    oldBrandLeak: [],
    undecodedEntities: [],
    emptyDescription: [],
    hugeDescription: [],
    noPrice: [],
    noRealPhoto: [],
    badSlug: [],
  };

  for (const p of products) {
    const d = p.description_html;
    if (/ozvapeshops?|oz ?vape ?shops?|vapelink|vape ?king|vaper ?choice|vapestore|visit us/i.test(d))
      issues.storeLeak.push(p.slug);
    if (/gspb_|elementor-\d|@media|\{[^{}]{0,200}:[^{}]{0,400}[;}]/.test(d))
      issues.cssInDescription.push(p.slug);
    if (/<img/i.test(d)) issues.imgInDescription.push(p.slug);
    if (/src=["']https?:\/\//i.test(d)) issues.externalUrlInDescription.push(p.slug);
    if (/aussie\s*vape\s*mart|chatgpt\.com/i.test(d + p.name))
      issues.oldBrandLeak.push(p.slug);
    if (/&#\d+;|&(amp|nbsp|ndash|rsquo|hellip);/i.test(p.name))
      issues.undecodedEntities.push(p.slug);
    const plain = d.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
    if (plain.length === 0) issues.emptyDescription.push(p.slug);
    if (plain.length > 4200) issues.hugeDescription.push(p.slug);
    if ((p.price ?? p.price_min ?? 0) <= 0) issues.noPrice.push(p.slug);
    if (!primaryImage(p)) issues.noRealPhoto.push(p.slug);
    if (!/^[\w-]+$/.test(p.slug)) issues.badSlug.push(p.slug);
  }

  return NextResponse.json({
    total: products.length,
    counts: Object.fromEntries(
      Object.entries(issues).map(([k, v]) => [k, v.length])
    ),
    samples: Object.fromEntries(
      Object.entries(issues).map(([k, v]) => [k, v.slice(0, 8)])
    ),
    slugs: products.map((p) => p.slug),
  });
}
