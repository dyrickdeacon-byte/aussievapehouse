import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Make sure the JSON the app reads at runtime ships inside the
  // serverless bundle on Vercel (catalog + default settings)
  // Ship only the prebuilt catalog (scripts/build-runtime-catalog.mjs).
  // The raw 28.6MB scrape used to be copied into EVERY serverless function
  // and re-read on every cold start — the main driver of Vercel's origin
  // transfer bill. products.json stays in the repo for re-imports only.
  outputFileTracingIncludes: {
    "/**": ["./catalog/runtime-catalog.json", "./data/site-settings.json"],
  },
  // Product imagery is content-addressed by slug and never mutated in
  // place, so it can be cached hard. Vercel's default for public/ is
  // `max-age=0, must-revalidate`, which meant every visitor re-fetched
  // every image on every page view.
  async headers() {
    return [
      {
        source: "/:dir(products|sourced)/:file*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, s-maxage=31536000, immutable",
          },
        ],
      },
    ];
  },
  images: {
    // Every product image is pre-optimised to webp at build/source time
    // (scripts/optimise-images.mjs, scripts/source-products.mjs), so we
    // serve them as plain static files. Vercel's Hobby image-optimisation
    // quota was returning 402 for EVERY image on the live site.
    unoptimized: true,
    remotePatterns: [
      {
        protocol: "https",
        hostname: "aussievapemart.com.au",
        pathname: "/wp-content/uploads/**",
      },
      // admin-uploaded product images (Supabase Storage)
      {
        protocol: "https",
        hostname: "*.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
    ],
  },
};

export default nextConfig;
