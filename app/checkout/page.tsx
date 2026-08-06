import Link from "next/link";

export const metadata = { title: "Checkout" };

export default function CheckoutPage() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-20 text-center">
      <h1 className="text-2xl font-bold">Checkout is on its way 🚧</h1>
      <p className="mx-auto mt-3 max-w-md leading-relaxed text-muted">
        Payments aren&apos;t wired up yet. This is where the payment provider
        (Stripe or similar), shipping details and region-aware compliance
        checks will live.
      </p>
      <div className="mx-auto mt-6 max-w-md rounded-xl border border-line bg-surface p-5 text-left text-sm leading-relaxed text-muted">
        <p className="font-semibold text-foreground">Ordering from Australia? 🇦🇺</p>
        <p className="mt-1">
          Nicotine vaping products can&apos;t be shipped direct to Australian
          consumers — they&apos;re supplied through pharmacies.{" "}
          <Link href="/pharmacy" className="text-accent underline underline-offset-2">
            Find a pharmacy or book a consult
          </Link>{" "}
          instead.
        </p>
      </div>
      <Link
        href="/cart"
        className="mt-8 inline-block rounded-lg border border-line px-6 py-3 text-sm font-semibold text-muted transition hover:text-foreground"
      >
        ← Back to cart
      </Link>
    </div>
  );
}
