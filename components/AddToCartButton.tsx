"use client";

import { useState } from "react";
import { useCart, type CartItem } from "@/lib/cart";

type Props = {
  product: Omit<CartItem, "qty">;
  compact?: boolean;
  showQty?: boolean;
};

export default function AddToCartButton({ product, compact, showQty }: Props) {
  const { add } = useCart();
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);

  function handleAdd() {
    add(product, qty);
    setAdded(true);
    setTimeout(() => setAdded(false), 1200);
  }

  if (compact) {
    return (
      <button
        onClick={handleAdd}
        className="rounded-lg bg-accent-strong px-2.5 py-1.5 text-xs font-semibold text-black transition hover:bg-accent"
      >
        {added ? "Added ✓" : "Add"}
      </button>
    );
  }

  return (
    <div className="flex items-center gap-3">
      {showQty && (
        <div className="flex items-center rounded-lg border border-line">
          <button
            onClick={() => setQty((q) => Math.max(1, q - 1))}
            className="px-3 py-2 text-muted transition hover:text-foreground"
            aria-label="Decrease quantity"
          >
            −
          </button>
          <span className="w-8 text-center text-sm font-medium">{qty}</span>
          <button
            onClick={() => setQty((q) => q + 1)}
            className="px-3 py-2 text-muted transition hover:text-foreground"
            aria-label="Increase quantity"
          >
            +
          </button>
        </div>
      )}
      <button
        onClick={handleAdd}
        className="flex-1 rounded-lg bg-accent-strong px-6 py-3 text-sm font-semibold text-black transition hover:bg-accent"
      >
        {added ? "Added to cart ✓" : "Add to cart"}
      </button>
    </div>
  );
}
