"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { isAdmin } from "@/lib/admin";
import {
  deleteCustomProduct,
  getCustomProduct,
  saveCustomProduct,
} from "@/lib/products-custom";
import { imageDimensions, uploadProductImage } from "@/lib/uploads";
import type { GroupKey } from "@/lib/catalog";

const GROUP_KEYS: GroupKey[] = [
  "disposables", "e-liquids", "pods", "coils", "kits",
  "pouches", "glass", "accessories", "other",
];

// Owner-written copy is plain text; convert line breaks to paragraphs so
// it renders in the same .desc styling as catalog descriptions.
function toHtml(text: string): string {
  const blocks = text.trim().split(/\n{2,}/).filter(Boolean);
  return blocks
    .map((b) => `<p>${b.replace(/\n/g, "<br>").replace(/</g, "&lt;")}</p>`)
    .join("\n");
}

export async function saveProductAction(formData: FormData) {
  if (!(await isAdmin())) redirect("/admin/login");

  const str = (k: string) => String(formData.get(k) ?? "").trim();
  const idRaw = str("id");
  const id = idRaw ? Number(idRaw) : undefined;
  const name = str("name");
  const price = Number(str("price"));

  if (!name || !Number.isFinite(price) || price <= 0) {
    redirect(`/admin/products/${id ?? "new"}?error=required`);
  }

  const existing = id ? await getCustomProduct(id) : null;
  const images = [...(existing?.images ?? [])];

  // Remove images the owner unchecked
  const keep = formData.getAll("keepImage").map(String);
  const kept = existing ? images.filter((im) => keep.includes(im.src)) : images;
  const finalImages = existing ? kept : [];

  // New uploads
  try {
    for (const entry of formData.getAll("images")) {
      if (!(entry instanceof File) || entry.size === 0) continue;
      const buf = Buffer.from(await entry.arrayBuffer());
      const [width, height] = imageDimensions(buf);
      const src = await uploadProductImage(entry);
      finalImages.push({ src, alt: name, width, height });
    }
  } catch (e) {
    console.error("[admin] image upload failed:", e);
    redirect(`/admin/products/${id ?? "new"}?error=upload`);
  }

  if (finalImages.length === 0) {
    redirect(`/admin/products/${id ?? "new"}?error=image`);
  }

  const regularRaw = str("regular_price");
  const regular = regularRaw ? Number(regularRaw) : null;
  const group = GROUP_KEYS.includes(str("group") as GroupKey)
    ? (str("group") as GroupKey)
    : "other";

  await saveCustomProduct({
    id,
    name,
    price,
    regular_price: Number.isFinite(regular as number) && regular ? regular : null,
    group,
    brand: str("brand"),
    categoryName: str("categoryName"),
    descriptionHtml: toHtml(str("description")),
    images: finalImages,
    in_stock: str("in_stock") === "on",
  });

  revalidatePath("/", "layout");
  redirect("/admin/products?saved=1");
}

export async function deleteProductAction(formData: FormData) {
  if (!(await isAdmin())) redirect("/admin/login");
  const id = Number(String(formData.get("id") ?? ""));
  if (Number.isFinite(id)) await deleteCustomProduct(id);
  revalidatePath("/", "layout");
  redirect("/admin/products?deleted=1");
}
