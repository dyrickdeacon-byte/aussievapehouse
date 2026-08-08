import Image from "next/image";
import Link from "next/link";
import { requireAdmin } from "@/lib/admin";
import { getCustomProducts } from "@/lib/products-custom";
import { groupLabel } from "@/lib/catalog";
import { deleteProductAction } from "@/app/admin/products/actions";

export default async function AdminProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ saved?: string; deleted?: string }>;
}) {
  await requireAdmin();
  const { saved, deleted } = await searchParams;
  const products = await getCustomProducts();

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-3xl">Products</h1>
        <Link
          href="/admin/products/new"
          className="glow-accent rounded-lg bg-accent px-5 py-2.5 text-sm font-bold text-white transition hover:bg-accent-2"
        >
          + Add product
        </Link>
      </div>

      {(saved || deleted) && (
        <p className="mt-3 inline-block rounded-lg border border-eucalypt/40 bg-eucalypt/10 px-4 py-2 text-sm font-semibold text-eucalypt">
          {saved ? "Product saved — live on the store now." : "Product deleted."}
        </p>
      )}

      <p className="mt-4 text-sm text-muted">
        Products you add here get a full product page, appear in search and
        their category, and sit at the top of category listings as newest
        stock. The imported supplier catalog is managed separately.
      </p>

      {products.length === 0 ? (
        <div className="mt-6 rounded-xl border border-line bg-surface p-10 text-center">
          <p className="text-muted">No products added yet.</p>
          <Link
            href="/admin/products/new"
            className="mt-4 inline-block rounded-lg bg-accent px-6 py-2.5 text-sm font-bold text-white transition hover:bg-accent-2"
          >
            Add your first product
          </Link>
        </div>
      ) : (
        <ul className="mt-6 divide-y divide-line rounded-xl border border-line bg-surface">
          {products.map((p) => (
            <li key={p.id} className="flex flex-wrap items-center gap-4 p-4">
              <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-lg bg-white">
                {p.images[0] && (
                  <Image
                    src={p.images[0].src}
                    alt=""
                    fill
                    sizes="56px"
                    className="object-contain p-1"
                    unoptimized
                  />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <Link
                  href={`/product/${p.slug}`}
                  className="line-clamp-1 text-sm font-semibold hover:text-accent"
                >
                  {p.name}
                </Link>
                <p className="text-xs text-muted">
                  {groupLabel(p.group)}
                  {p.brand ? ` · ${p.brand}` : ""} · {p.images.length} image
                  {p.images.length === 1 ? "" : "s"}
                  {p.in_stock ? "" : " · out of stock"}
                </p>
              </div>
              <span className="text-sm font-bold">AU${p.price.toFixed(2)}</span>
              <Link
                href={`/admin/products/${p.id}`}
                className="rounded-lg border border-line-2 px-3 py-1.5 text-xs font-semibold text-muted transition hover:text-foreground"
              >
                Edit
              </Link>
              <form action={deleteProductAction}>
                <input type="hidden" name="id" value={p.id} />
                <button className="rounded-lg border border-line-2 px-3 py-1.5 text-xs font-semibold text-muted transition hover:border-accent hover:text-accent">
                  Delete
                </button>
              </form>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
