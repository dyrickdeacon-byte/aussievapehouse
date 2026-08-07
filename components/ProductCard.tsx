import Image from "next/image";
import Link from "next/link";
import { groupLabel, primaryImage, type Product } from "@/lib/catalog";
import { formatPrice, formatPriceRange } from "@/lib/format";
import AddToCartButton from "@/components/AddToCartButton";
import Medallion from "@/components/Medallion";

export default function ProductCard({ product }: { product: Product }) {
  const img = primaryImage(product);
  const hasRange = product.price_min != null && product.price_max !== product.price_min;
  const priceLabel = hasRange
    ? formatPriceRange(product.price_min, product.price_max)
    : formatPrice(product.price ?? product.price_min);
  // Our normalised group, not the supplier's messy (often wrong) category
  const category = groupLabel(product.group);
  const discount =
    product.on_sale && product.regular_price && product.price && product.regular_price > product.price
      ? Math.round((1 - product.price / product.regular_price) * 100)
      : null;

  return (
    <div className="group overflow-hidden rounded-xl border border-line bg-surface transition-all duration-200 hover:-translate-y-0.5 hover:border-accent/50 hover:shadow-[0_14px_32px_rgba(60,45,25,.16)]">
      <Link href={`/product/${product.slug}`} className="relative block aspect-square overflow-hidden bg-white">
        {img ? (
          <Image
            src={img.src}
            alt={img.alt}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            className="object-contain p-3 transition duration-500 group-hover:scale-105"
          />
        ) : (
          // 178 supplier listings ship a blank "import placeholder" image —
          // show intentional artwork instead of a broken-looking white tile
          <div className="flex h-full flex-col items-center justify-center gap-2.5 bg-surface-2">
            <Medallion variant={2} size={56} className="opacity-70" />
            <span className="text-[11px] font-medium text-muted">
              Photo coming soon
            </span>
          </div>
        )}
        {product.on_sale && (
          <span className="absolute right-2 top-2 rounded-full bg-accent px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wide text-white">
            {discount ? `-${discount}%` : "Sale"}
          </span>
        )}
        {!product.in_stock && (
          <span className="absolute left-2 top-2 rounded-full bg-black/75 px-2 py-0.5 text-[10px] font-bold uppercase text-white">
            Sold out
          </span>
        )}
      </Link>
      <div className="flex flex-col gap-1 p-3.5">
        <Link
          href={`/product/${product.slug}`}
          className="line-clamp-2 min-h-[2.4em] text-[13px] font-semibold leading-snug transition group-hover:text-accent"
        >
          {product.name}
        </Link>
        {category && (
          <p className="truncate text-[10.5px] text-muted">{category}</p>
        )}
        {product.review_count > 0 && (
          <p className="text-[10px] tracking-widest text-amber-400">
            {"★".repeat(Math.round(Number(product.average_rating) || 5))}
            <span className="ml-1 text-muted">({product.review_count})</span>
          </p>
        )}
        <div className="mt-1.5 flex items-center justify-between gap-2">
          <span className="text-[15px] font-bold">
            {(product.price ?? product.price_min ?? 0) <= 0 ? (
              <span className="text-[12px] font-semibold text-muted">Price TBC</span>
            ) : (
              <>
                {hasRange && (
                  <span className="mr-0.5 text-[10px] font-normal text-muted">from</span>
                )}
                {hasRange ? formatPrice(product.price_min) : priceLabel}
              </>
            )}
          </span>
          {product.has_options || hasRange ? (
            <Link
              href={`/product/${product.slug}`}
              className="rounded-lg bg-accent px-3 py-1.5 text-[10.5px] font-extrabold uppercase tracking-wide text-white transition hover:bg-accent-2"
            >
              Options
            </Link>
          ) : (
            product.in_stock &&
            (product.price ?? 0) > 0 && (
              <AddToCartButton
                product={{
                  id: product.id,
                  slug: product.slug,
                  name: product.name,
                  price: product.price ?? 0,
                  image: img?.src ?? null,
                }}
                compact
              />
            )
          )}
        </div>
      </div>
    </div>
  );
}
