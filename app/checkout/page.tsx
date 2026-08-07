import Link from "next/link";

export const metadata = { title: "Checkout" };

export default function CheckoutPage() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-20 text-center">
      <h1 className="font-display text-3xl">Checkout is on its way 🚧</h1>
      <p className="mx-auto mt-3 max-w-md leading-relaxed text-muted">
        Payments aren&apos;t wired up yet. This is where the payment provider,
        shipping details and order confirmation emails will live.
      </p>
      <Link
        href="/cart"
        className="mt-8 inline-block rounded-lg border border-line px-6 py-3 text-sm font-semibold text-muted transition hover:text-foreground"
      >
        ← Back to cart
      </Link>
    </div>
  );
}
