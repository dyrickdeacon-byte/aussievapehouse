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
