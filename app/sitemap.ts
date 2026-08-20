import type { MetadataRoute } from "next";
import { getProducts, getGroupCounts } from "@/lib/catalog";

const SITE = process.env.NEXT_PUBLIC_SITE_URL || "https://aussievapehouse.com";

// Only canonical URLs: the homepage, one landing page per category, and each
// product. Deliberately excludes every filtered/sorted/paginated permutation
// so crawlers are pointed at real content instead of the facet space.
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const products = await getProducts();
  const groups = await getGroupCounts();

  return [
    { url: SITE, changeFrequency: "daily", priority: 1 },
    { url: `${SITE}/shop`, changeFrequency: "daily", priority: 0.9 },
    ...groups.map((g) => ({
      url: `${SITE}/shop?group=${g.key}`,
      changeFrequency: "weekly" as const,
      priority: 0.8,
    })),
    ...products.map((p) => ({
      url: `${SITE}/product/${p.slug}`,
      lastModified: p.createdAt ? new Date(p.createdAt) : undefined,
      changeFrequency: "weekly" as const,
      priority: 0.7,
    })),
  ];
}
