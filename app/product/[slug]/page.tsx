import Link from "next/link";
import { notFound } from "next/navigation";
import {
  getProductBySlug,
  getRelated,
  groupLabel,
} from "@/lib/catalog";
import { formatPrice, formatPriceRange } from "@/lib/format";
import ImageGallery from "@/components/ImageGallery";
import AddToCartButton from "@/components/AddToCartButton";
import ProductCard from "@/components/ProductCard";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const product = getProductBySlug(slug);
  return { title: product?.name ?? "Product not found" };
}

export default async function ProductPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const product = getProductBySlug(slug);
  if (!product) notFound();

  const hasRange =
    product.price_min != null && product.price_max !== product.price_min;
  const priceLabel = hasRange
    ? formatPriceRange(product.price_min, product.price_max)
    : formatPrice(product.price ?? product.price_min);
  const related = getRelated(product, 4);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      {/* Breadcrumbs */}
      <nav className="text-xs text-muted">
        <Link href="/shop" className="hover:text-foreground">Shop</Link>
        {" / "}
        <Link href={`/shop?group=${product.group}`} className="hover:text-foreground">
          {groupLabel(product.group)}
        </Link>
        {" / "}
        <span className="text-foreground">{product.name}</span>
      </nav>

      <div className="mt-5 grid gap-8 md:grid-cols-2">
        <ImageGallery images={product.images} name={product.name} />

        <div>
          <h1 className="text-2xl font-bold leading-tight">{product.name}</h1>

          <div className="mt-3 flex flex-wrap items-center gap-3">
            <span className="text-2xl font-semibold text-accent">{priceLabel}</span>
            {product.on_sale &&
              product.regular_price != null &&
              product.regular_price !== product.price && (
                <span className="text-sm text-muted line-through">
                  {formatPrice(product.regular_price)}
                </span>
              )}
            <span
              className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                product.in_stock
                  ? "bg-accent/10 text-accent"
                  : "bg-red-500/10 text-red-400"
              }`}
            >
              {product.in_stock ? "In stock" : "Out of stock"}
            </span>
          </div>

          {product.review_count > 0 && (
            <p className="mt-2 text-sm text-muted">
              ★ {product.average_rating} ({product.review_count} review
              {product.review_count === 1 ? "" : "s"})
            </p>
          )}

          {product.attributes.length > 0 && (
            <div className="mt-5 space-y-3">
              {product.attributes.map((a) => (
                <div key={a.name}>
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted">
                    {a.name}
                  </p>
                  <div className="mt-1.5 flex flex-wrap gap-1.5">
                    {a.terms.map((t) => (
                      <span
                        key={t}
                        className="rounded-md border border-line bg-surface px-2 py-1 text-xs"
                      >
                        {t}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
              {product.has_options && (
                <p className="text-xs text-muted">
                  Variant selection will be wired up with checkout — quantities
                  added here use the base price.
                </p>
              )}
            </div>
          )}

          <div className="mt-6">
            {product.in_stock && (product.price ?? product.price_min ?? 0) > 0 ? (
              <AddToCartButton
                product={{
                  id: product.id,
                  slug: product.slug,
                  name: product.name,
                  price: product.price ?? product.price_min ?? 0,
                  image: product.images[0]?.src ?? null,
                }}
                showQty
              />
            ) : (
              <p className="rounded-lg border border-line bg-surface px-4 py-3 text-sm text-muted">
                {product.in_stock
                  ? "Pricing to be confirmed — check back soon."
                  : "Currently out of stock."}
              </p>
            )}
          </div>

          <p className="mt-4 rounded-lg bg-accent-strong/10 px-4 py-3 text-xs leading-relaxed text-accent">
            🇦🇺 Ordering from Australia? Nicotine vaping products are supplied
            via pharmacies.{" "}
            <Link href="/pharmacy" className="font-semibold underline underline-offset-2">
              Find a pharmacy or consult near you
            </Link>
            .
          </p>

          {product.description_html && (
            <details className="mt-6 rounded-xl border border-line bg-surface px-5 py-4" open>
              <summary className="cursor-pointer text-sm font-semibold">
                Product description
              </summary>
              <div
                className="desc mt-2 text-sm"
                dangerouslySetInnerHTML={{ __html: product.description_html }}
              />
            </details>
          )}
        </div>
      </div>

      {related.length > 0 && (
        <section className="mt-14">
          <h2 className="text-xl font-semibold">You might also like</h2>
          <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-4">
            {related.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
