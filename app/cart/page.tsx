"use client";

import Image from "next/image";
import Link from "next/link";
import { useCart } from "@/lib/cart";
import { formatPrice } from "@/lib/format";

export default function CartPage() {
  const { items, subtotal, setQty, remove, clear } = useCart();

  if (items.length === 0) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-20 text-center">
        <h1 className="text-2xl font-bold">Your cart is empty</h1>
        <p className="mt-2 text-muted">Go find something you like.</p>
        <Link
          href="/shop"
          className="mt-6 inline-block rounded-lg bg-accent px-6 py-3 text-sm font-semibold text-white transition hover:bg-accent-2"
        >
          Browse the shop
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <div className="flex items-baseline justify-between">
        <h1 className="text-2xl font-bold">Your cart</h1>
        <button onClick={clear} className="text-xs text-muted hover:text-foreground">
          Clear cart
        </button>
      </div>

      <ul className="mt-6 divide-y divide-line rounded-xl border border-line bg-surface">
        {items.map((item) => (
          <li key={item.id} className="flex items-center gap-4 p-4">
            <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-lg bg-white">
              {item.image && (
                <Image src={item.image} alt="" fill sizes="64px" className="object-contain p-1" />
              )}
            </div>
            <div className="min-w-0 flex-1">
              <Link
                href={`/product/${item.slug}`}
                className="line-clamp-2 text-sm font-medium hover:text-accent"
              >
                {item.name}
              </Link>
              <p className="mt-0.5 text-xs text-muted">{formatPrice(item.price)} each</p>
            </div>
            <div className="flex items-center rounded-lg border border-line">
              <button
                onClick={() => setQty(item.id, item.qty - 1)}
                className="px-2.5 py-1.5 text-muted transition hover:text-foreground"
                aria-label="Decrease quantity"
              >
                −
              </button>
              <span className="w-8 text-center text-sm">{item.qty}</span>
              <button
                onClick={() => setQty(item.id, item.qty + 1)}
                className="px-2.5 py-1.5 text-muted transition hover:text-foreground"
                aria-label="Increase quantity"
              >
                +
              </button>
            </div>
            <p className="w-20 text-right text-sm font-semibold">
              {formatPrice(item.price * item.qty)}
            </p>
            <button
              onClick={() => remove(item.id)}
              className="text-muted transition hover:text-red-400"
              aria-label={`Remove ${item.name}`}
            >
              ✕
            </button>
          </li>
        ))}
      </ul>

      <div className="mt-6 flex flex-col items-end gap-3">
        <p className="text-lg">
          Subtotal: <span className="font-bold">{formatPrice(subtotal)}</span>
        </p>
        <p className="text-xs text-muted">Shipping and taxes calculated at checkout.</p>
        <Link
          href="/checkout"
          className="rounded-lg bg-accent px-8 py-3 text-sm font-semibold text-white transition hover:bg-accent-2"
        >
          Proceed to checkout
        </Link>
      </div>
    </div>
  );
}
