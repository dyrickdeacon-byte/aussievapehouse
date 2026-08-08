import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/admin";
import { getCustomProduct } from "@/lib/products-custom";
import { GROUPS } from "@/lib/catalog";
import { saveProductAction } from "@/app/admin/products/actions";

const input =
  "w-full rounded-lg border border-line bg-surface px-3 py-2.5 text-sm outline-none transition placeholder:text-muted/60 focus:border-accent";

const ERRORS: Record<string, string> = {
  required: "Name and a price above 0 are required.",
  image: "Add at least one product image.",
  upload: "Image upload failed — check the file type/size (max 6MB).",
};

// One form for both create and edit — /admin/products/new or /admin/products/<id>
export default async function AdminProductFormPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  await requireAdmin();
  const { id } = await params;
  const { error } = await searchParams;

  const isNew = id === "new";
  const product = isNew ? null : await getCustomProduct(Number(id));
  if (!isNew && !product) notFound();

  // Owner copy is stored as HTML; show it back as plain text for editing
  const descriptionText = (product?.descriptionHtml ?? "")
    .replace(/<\/p>\s*<p>/gi, "\n\n")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .trim();

  return (
    <div>
      <div className="flex items-center gap-3">
        <Link href="/admin/products" className="text-sm text-muted hover:text-foreground">
          ← Products
        </Link>
      </div>
      <h1 className="font-display mt-2 text-3xl">
        {isNew ? "Add product" : "Edit product"}
      </h1>

      {error && (
        <p className="mt-3 inline-block rounded-lg border border-accent/40 bg-accent/10 px-4 py-2 text-sm font-semibold text-accent">
          {ERRORS[error] ?? "Something went wrong."}
        </p>
      )}

      <form action={saveProductAction} className="mt-6 space-y-6">
        {product && <input type="hidden" name="id" value={product.id} />}

        <section className="rounded-xl border border-line bg-surface p-5">
          <h2 className="text-sm font-bold uppercase tracking-wider text-muted">
            Product details
          </h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <label className="text-sm sm:col-span-2">
              <span className="font-semibold">Product name *</span>
              <input
                name="name"
                required
                defaultValue={product?.name}
                placeholder="e.g. IGET Bar Plus 6000 Puffs – Blueberry Ice"
                className={`${input} mt-1.5`}
              />
            </label>
            <label className="text-sm">
              <span className="font-semibold">Price (AU$) *</span>
              <input
                name="price"
                type="number"
                step="0.01"
                min="0.01"
                required
                defaultValue={product?.price}
                placeholder="44.90"
                className={`${input} mt-1.5`}
              />
            </label>
            <label className="text-sm">
              <span className="font-semibold">Was price (AU$)</span>{" "}
              <span className="text-muted">— shows a discount badge</span>
              <input
                name="regular_price"
                type="number"
                step="0.01"
                min="0"
                defaultValue={product?.regular_price ?? ""}
                placeholder="59.90"
                className={`${input} mt-1.5`}
              />
            </label>
            <label className="text-sm">
              <span className="font-semibold">Category *</span>
              <select
                name="group"
                defaultValue={product?.group ?? "disposables"}
                className={`${input} mt-1.5`}
              >
                {GROUPS.map((g) => (
                  <option key={g.key} value={g.key}>
                    {g.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="text-sm">
              <span className="font-semibold">Brand</span>
              <input
                name="brand"
                defaultValue={product?.brand}
                placeholder="e.g. IGET"
                className={`${input} mt-1.5`}
              />
            </label>
            <label className="text-sm sm:col-span-2">
              <span className="font-semibold">Collection label</span>{" "}
              <span className="text-muted">— shown on the product card</span>
              <input
                name="categoryName"
                defaultValue={product?.categoryName}
                placeholder="e.g. IGET Bar Plus"
                className={`${input} mt-1.5`}
              />
            </label>
            <label className="flex items-center gap-2.5 text-sm sm:col-span-2">
              <input
                type="checkbox"
                name="in_stock"
                defaultChecked={product ? product.in_stock : true}
                className="h-4 w-4 accent-[#b4451c]"
              />
              <span className="font-semibold">In stock</span>
            </label>
          </div>
        </section>

        <section className="rounded-xl border border-line bg-surface p-5">
          <h2 className="text-sm font-bold uppercase tracking-wider text-muted">
            Description
          </h2>
          <textarea
            name="description"
            rows={7}
            defaultValue={descriptionText}
            placeholder={
              "Write the product description here.\n\nLeave a blank line between paragraphs."
            }
            className={`${input} mt-4`}
          />
        </section>

        <section className="rounded-xl border border-line bg-surface p-5">
          <h2 className="text-sm font-bold uppercase tracking-wider text-muted">
            Images
          </h2>
          <p className="mt-1.5 text-xs text-muted">
            First image is the main product shot. Use 700px or larger for the
            product to qualify for the homepage hero. JPG, PNG or WebP, max 6MB
            each.
          </p>

          {product && product.images.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-3">
              {product.images.map((im) => (
                <label
                  key={im.src}
                  className="relative block cursor-pointer overflow-hidden rounded-lg border border-line-2 bg-white p-1"
                >
                  <Image
                    src={im.src}
                    alt=""
                    width={90}
                    height={90}
                    unoptimized
                    className="h-[90px] w-[90px] object-contain"
                  />
                  <span className="mt-1 flex items-center gap-1.5 px-1 pb-1 text-[11px] text-foreground">
                    <input
                      type="checkbox"
                      name="keepImage"
                      value={im.src}
                      defaultChecked
                      className="h-3.5 w-3.5 accent-[#b4451c]"
                    />
                    keep ({im.width}px)
                  </span>
                </label>
              ))}
            </div>
          )}

          <input
            type="file"
            name="images"
            accept="image/jpeg,image/png,image/webp,image/avif"
            multiple
            className={`${input} mt-4 file:mr-3 file:rounded-md file:border-0 file:bg-accent file:px-3 file:py-1.5 file:text-xs file:font-bold file:text-white`}
          />
        </section>

        <div className="flex items-center gap-3">
          <button className="glow-accent rounded-lg bg-accent px-8 py-3 text-sm font-extrabold uppercase tracking-wide text-white transition hover:bg-accent-2">
            {isNew ? "Create product" : "Save changes"}
          </button>
          <Link href="/admin/products" className="text-sm text-muted hover:text-foreground">
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}
