// Products created by the owner in the admin dashboard. Stored in the same
// storage layer as orders (Supabase in prod, data/*.json locally) and merged
// into the scraped catalog at read time — they get product pages, search,
// category listings and cart support exactly like built-in products.

import { hashDelete, hashGetAll, hashSet } from "@/lib/storage";
import type { GroupKey } from "@/lib/catalog";

export type CustomProduct = {
  id: number;
  slug: string;
  name: string;
  price: number;
  regular_price: number | null;
  group: GroupKey;
  brand: string;
  categoryName: string;
  descriptionHtml: string;
  images: { src: string; alt: string; width: number; height: number }[];
  in_stock: boolean;
  createdAt: string;
  updatedAt: string;
};

const HASH = "custom-products";

// Custom product ids live above the scraped catalog's range (max ~11k)
const ID_BASE = 900_000;

export function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 90);
}

export async function getCustomProducts(): Promise<CustomProduct[]> {
  const map = await hashGetAll<CustomProduct>(HASH);
  return Object.values(map)
    .filter((p): p is CustomProduct => !!p && typeof p.id === "number")
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function getCustomProduct(id: number): Promise<CustomProduct | null> {
  const map = await hashGetAll<CustomProduct>(HASH);
  return map[String(id)] ?? null;
}

export async function saveCustomProduct(
  input: Omit<CustomProduct, "id" | "createdAt" | "updatedAt" | "slug"> & {
    id?: number;
    slug?: string;
  }
): Promise<CustomProduct> {
  const existing = input.id ? await getCustomProduct(input.id) : null;
  const now = new Date().toISOString();

  // Unique slug across custom products
  let slug = input.slug?.trim() || slugify(input.name);
  const all = await getCustomProducts();
  if (all.some((p) => p.slug === slug && p.id !== input.id)) {
    slug = `${slug}-${(input.id ?? Date.now()) % 1000}`;
  }

  const product: CustomProduct = {
    id: input.id ?? ID_BASE + (all.length ? Math.max(...all.map((p) => p.id - ID_BASE)) + 1 : 1),
    slug,
    name: input.name,
    price: input.price,
    regular_price: input.regular_price,
    group: input.group,
    brand: input.brand,
    categoryName: input.categoryName,
    descriptionHtml: input.descriptionHtml,
    images: input.images,
    in_stock: input.in_stock,
    createdAt: existing?.createdAt ?? now,
    updatedAt: now,
  };

  await hashSet(HASH, String(product.id), product);
  return product;
}

export async function deleteCustomProduct(id: number): Promise<void> {
  await hashDelete(HASH, String(id));
}
