import type { MetadataRoute } from "next";

const SITE = process.env.NEXT_PUBLIC_SITE_URL || "https://aussievapehouse.com";

// The shop has faceted navigation: category x brand x flavour x sort x page.
// That is 8,000+ filter combinations before pagination, and every one is a
// server-rendered page carrying ~24 product images. Left open, crawlers walk
// that space endlessly — it exhausted a 100GB bandwidth allowance in under a
// day. Real content (products, category landing pages) stays fully indexable.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/admin",
          "/api/",
          "/cart",
          "/checkout",
          "/shop?", // any filtered/sorted/paginated view
          "/*?brand=",
          "/*?flavour=",
          "/*?sort=",
          "/*?page=",
          "/*?q=",
          "/*&", // any multi-parameter combination
        ],
      },
      // Aggressive SEO crawlers that ignore crawl-delay and provide no value
      // to a retail store.
      {
        userAgent: ["AhrefsBot", "SemrushBot", "MJ12bot", "DotBot", "PetalBot", "DataForSeoBot"],
        disallow: "/",
      },
    ],
    sitemap: `${SITE}/sitemap.xml`,
  };
}
