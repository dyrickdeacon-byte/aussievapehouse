import Image from "next/image";
import Link from "next/link";
import type { Product } from "@/lib/catalog";
import { formatPrice, formatPriceRange } from "@/lib/format";
import AddToCartButton from "@/components/AddToCartButton";

export default function ProductCard({ product }: { product: Product }) {
  const img = product.images[0];
  const hasRange = product.price_min != null && product.price_max !== product.price_min;
  const priceLabel = hasRange
    ? formatPriceRange(product.price_min, product.price_max)
    : formatPrice(product.price ?? product.price_min);

  return (
    <div className="group flex flex-col overflow-hidden rounded-xl border border-line bg-surface transition hover:border-accent/50">
      <Link
        href={`/product/${product.slug}`}
        className="relative aspect-square overflow-hidden bg-white"
      >
        {img ? (
          <Image
            src={img.src}
            alt={img.alt}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            className="object-contain p-3 transition duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-sm text-gray-400">
            No image
          </div>
        )}
        {product.on_sale && (
          <span className="absolute left-2 top-2 rounded-md bg-sale px-2 py-0.5 text-xs font-bold text-black">
            SALE
          </span>
        )}
        {!product.in_stock && (
          <span className="absolute right-2 top-2 rounded-md bg-black/70 px-2 py-0.5 text-xs font-semibold text-white">
            Out of stock
          </span>
        )}
      </Link>
      <div className="flex flex-1 flex-col gap-2 p-3">
        <Link
          href={`/product/${product.slug}`}
          className="line-clamp-2 text-sm font-medium leading-snug transition hover:text-accent"
        >
          {product.name}
        </Link>
        <div className="mt-auto flex items-center justify-between gap-2">
          <span className="text-sm font-semibold">{priceLabel}</span>
          {product.has_options || hasRange ? (
            <Link
              href={`/product/${product.slug}`}
              className="rounded-lg border border-line px-2.5 py-1.5 text-xs text-muted transition hover:text-foreground"
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
