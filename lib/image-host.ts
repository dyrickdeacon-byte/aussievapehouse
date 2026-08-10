// Product imagery is served from jsDelivr's free CDN, which mirrors the
// public GitHub repo. This keeps ~99MB of images off Vercel's metered
// origin transfer (the Hobby plan's 10GB was being exhausted by image
// traffic alone) at no cost and with no extra account.
//
// Set NEXT_PUBLIC_IMAGE_CDN="" to serve from Vercel instead (local dev
// does this automatically, so unpushed images still render).

const CDN = process.env.NEXT_PUBLIC_IMAGE_CDN ?? "";

/**
 * Rewrites a local image path ("/products/foo.webp") to the CDN.
 * Admin uploads ("/uploads/…") and absolute URLs are left alone — those
 * aren't in the repo.
 */
export function imageUrl(src: string): string {
  if (!CDN) return src;
  if (!src.startsWith("/products/") && !src.startsWith("/sourced/")) return src;
  return `${CDN}${src}`;
}
