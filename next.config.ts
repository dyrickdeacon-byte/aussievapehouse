import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Make sure the JSON the app reads at runtime ships inside the
  // serverless bundle on Vercel (catalog + default settings)
  outputFileTracingIncludes: {
    "/**": [
      "./catalog/products.json",
      "./catalog/image-meta.json",
      "./data/site-settings.json",
    ],
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
