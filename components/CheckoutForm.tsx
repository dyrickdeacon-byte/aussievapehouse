"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useCart } from "@/lib/cart";
import { formatPrice } from "@/lib/format";
import Medallion from "@/components/Medallion";
import type { PaymentMethodKey } from "@/lib/settings";
import { DISCOUNT_STORAGE_KEY, discountFor } from "@/lib/discount";

const METHODS: { key: string; label: string }[] = [
  { key: "bank", label: "Bank Transfer" },
  { key: "payid", label: "PayID" },
];

const AU_STATES = ["NSW", "VIC", "QLD", "WA", "SA", "TAS", "ACT", "NT"];

type Props = {
  mode: "manual" | "direct";
  methodDetails: Record<PaymentMethodKey, string>;
  otherLabel?: string;
};

export default function CheckoutForm({ mode, methodDetails, otherLabel }: Props) {
  const { items, subtotal, clear } = useCart();
  const [method, setMethod] = useState("bank");
  const [state, setState] = useState<"idle" | "busy" | "error">("idle");
  const [placed, setPlaced] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState("");
  const [discountCode, setDiscountCode] = useState<string | null>(null);

  // The welcome code from the popup / newsletter auto-applies here
  useEffect(() => {
    setDiscountCode(localStorage.getItem(DISCOUNT_STORAGE_KEY));
  }, []);
  const discount = discountFor(discountCode, subtotal);
  const total = Math.round((subtotal - discount) * 100) / 100;

  // Direct mode only offers methods the owner has configured; the owner's
  // custom "other" method shows under its admin-set name
  const available = useMemo(() => {
    if (mode === "manual") return METHODS;
    const configured = METHODS.filter(
      (m) => m.key !== "other" && methodDetails[m.key as PaymentMethodKey]?.trim()
    );
    if (methodDetails.other?.trim()) {
      configured.push({ key: "other", label: otherLabel?.trim() || "Other" });
    }
    return configured.length ? configured : METHODS;
  }, [mode, methodDetails, otherLabel]);

  const activeMethod = available.some((m) => m.key === method)
    ? method
    : available[0]?.key ?? "bank";

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setState("busy");
    setErrorMsg("");
    const fd = new FormData(e.currentTarget);
    const payload = {
      customer: {
        name: fd.get("name"),
        email: fd.get("email"),
        phone: fd.get("phone"),
        address: fd.get("address"),
        suburb: fd.get("suburb"),
        state: fd.get("state"),
        postcode: fd.get("postcode"),
        notes: fd.get("notes"),
      },
      items: items.map((i) => ({ id: i.id, qty: i.qty })),
      paymentMethod: activeMethod,
      paymentOther:
        mode === "direct" && activeMethod === "other"
          ? otherLabel || "Custom"
          : fd.get("paymentOther"),
      paymentReference: fd.get("paymentReference"),
      discountCode,
    };
    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Something went wrong");
      setPlaced(data.orderId);
      clear();
    } catch (err) {
      setState("error");
      setErrorMsg(String((err as Error).message));
      return;
    }
  }

  if (placed) {
    return (
      <div className="mx-auto max-w-xl px-4 py-20 text-center">
        <Medallion variant={0} size={72} className="mx-auto mb-6" />
        <h1 className="font-display text-4xl">Order placed! 🎉</h1>
        <p className="mt-3 text-muted">
          Your order number is{" "}
          <span className="font-bold text-foreground">{placed}</span>. A
          confirmation email is on its way.
        </p>
        <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-muted">
          {mode === "manual"
            ? "Our team will email you shortly with payment details to complete your order."
            : "Complete your payment using the details shown (also in your email), quoting your order number as the reference."}
        </p>
        <Link
          href="/shop"
          className="glow-accent mt-8 inline-block rounded-lg bg-accent px-7 py-3 text-sm font-bold text-white transition hover:bg-accent-2"
        >
          Keep shopping
        </Link>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="mx-auto max-w-xl px-4 py-20 text-center">
        <Medallion variant={2} size={64} className="mx-auto mb-5 opacity-90" />
        <h1 className="font-display text-3xl">Your cart is empty</h1>
        <Link
          href="/shop"
          className="mt-6 inline-block rounded-lg bg-accent px-6 py-3 text-sm font-semibold text-white transition hover:bg-accent-2"
        >
          Browse the shop
        </Link>
      </div>
    );
  }

  const input =
    "w-full rounded-lg border border-line bg-surface px-3 py-2.5 text-sm outline-none transition placeholder:text-muted/60 focus:border-accent";

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <div className="flex items-center gap-3">
        <Medallion variant={0} size={38} className="shrink-0" />
        <h1 className="font-display text-3xl sm:text-4xl">Checkout</h1>
      </div>

      <form onSubmit={submit} className="mt-8 grid gap-8 lg:grid-cols-[1.2fr_1fr]">
        {/* Details */}
        <div className="space-y-6">
          <section className="rounded-xl border border-line bg-surface p-5">
            <h2 className="text-sm font-bold uppercase tracking-wider text-muted">
              Your details
            </h2>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <input name="name" required placeholder="Full name" className={input} />
              <input name="email" type="email" required placeholder="Email" className={input} />
              <input name="phone" required placeholder="Phone" className={input} />
            </div>
          </section>

          <section className="rounded-xl border border-line bg-surface p-5">
            <h2 className="text-sm font-bold uppercase tracking-wider text-muted">
              Delivery address
            </h2>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <input name="address" required placeholder="Street address" className={`${input} sm:col-span-2`} />
              <input name="suburb" required placeholder="Suburb" className={input} />
              <div className="grid grid-cols-2 gap-3">
                <select name="state" required className={input} defaultValue="NSW">
                  {AU_STATES.map((s) => (
                    <option key={s}>{s}</option>
                  ))}
                </select>
                <input name="postcode" required placeholder="Postcode" pattern="[0-9]{4}" className={input} />
              </div>
              <textarea
                name="notes"
                rows={2}
                placeholder="Delivery notes (optional)"
                className={`${input} sm:col-span-2`}
              />
            </div>
          </section>

          <section className="rounded-xl border border-line bg-surface p-5">
            <h2 className="text-sm font-bold uppercase tracking-wider text-muted">
              Payment method
            </h2>
            <div className="mt-4 flex flex-wrap gap-2">
              {available.map((m) => (
                <button
                  key={m.key}
                  type="button"
                  onClick={() => setMethod(m.key)}
                  className={`rounded-lg border px-4 py-2 text-sm font-semibold transition ${
                    activeMethod === m.key
                      ? "border-accent bg-accent text-white"
                      : "border-line-2 bg-surface-2 text-muted hover:border-accent hover:text-accent"
                  }`}
                >
                  {m.label}
                </button>
              ))}
            </div>

            {mode === "manual" && activeMethod === "other" && (
              <input
                name="paymentOther"
                placeholder="Tell us your preferred payment method"
                className={`${input} mt-3`}
              />
            )}

            {mode === "direct" ? (
              <div className="mt-4 rounded-lg border border-ochre/40 bg-ochre/10 p-4">
                <p className="text-xs font-bold uppercase tracking-wider text-ochre">
                  Pay now — {available.find((m) => m.key === activeMethod)?.label}
                </p>
                <p className="mt-2 whitespace-pre-line text-sm leading-relaxed">
                  {methodDetails[activeMethod as PaymentMethodKey] ||
                    "Details will be emailed with your order confirmation."}
                </p>
                <input
                  name="paymentReference"
                  placeholder="Payment reference / receipt number (optional)"
                  className={`${input} mt-3`}
                />
              </div>
            ) : (
              <p className="mt-3 text-xs leading-relaxed text-muted">
                Place your order and our team will email you the{" "}
                {METHODS.find((m) => m.key === activeMethod)?.label} details to
                complete payment.
              </p>
            )}
          </section>
        </div>

        {/* Summary */}
        <aside className="h-fit rounded-xl border border-line bg-surface p-5">
          <h2 className="text-sm font-bold uppercase tracking-wider text-muted">
            Order summary
          </h2>
          <ul className="mt-4 space-y-2.5">
            {items.map((i) => (
              <li key={i.id} className="flex justify-between gap-3 text-sm">
                <span className="line-clamp-1">
                  {i.name} <span className="text-muted">×{i.qty}</span>
                </span>
                <span className="shrink-0 font-semibold">
                  {formatPrice(i.price * i.qty)}
                </span>
              </li>
            ))}
          </ul>
          <div className="mt-4 space-y-1.5 border-t border-line pt-3">
            <div className="flex justify-between text-sm">
              <span>Subtotal</span>
              <span>{formatPrice(subtotal)}</span>
            </div>
            {discount > 0 && (
              <div className="flex justify-between text-sm font-semibold text-eucalypt">
                <span>10% off ({discountCode?.toUpperCase()}) 🎉</span>
                <span>−{formatPrice(discount)}</span>
              </div>
            )}
            <div className="flex justify-between text-base font-bold">
              <span>Total</span>
              <span>{formatPrice(total)}</span>
            </div>
          </div>
          <p className="mt-1 text-xs text-muted">
            Shipping confirmed with your order — free express over AU$100.
          </p>
          <button
            disabled={state === "busy"}
            className="glow-accent mt-5 w-full rounded-lg bg-accent px-6 py-3.5 text-sm font-extrabold uppercase tracking-wide text-white transition hover:bg-accent-2 disabled:opacity-60"
          >
            {state === "busy" ? "Placing order…" : "Place order"}
          </button>
          {state === "error" && (
            <p className="mt-3 text-center text-sm text-red-600">{errorMsg}</p>
          )}
          <p className="mt-3 text-center text-[11px] text-muted">
            18+ only. By ordering you confirm you're of legal age.
          </p>
        </aside>
      </form>
    </div>
  );
}
