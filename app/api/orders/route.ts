import { NextResponse } from "next/server";
import { addOrder, newOrderId, type Order, type OrderItem } from "@/lib/orders";
import { getSettings } from "@/lib/settings";
import { orderCustomerHtml, orderOwnerHtml, sendMail } from "@/lib/email";
import { getProducts } from "@/lib/catalog";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(req: Request) {
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  const c = (body.customer ?? {}) as Record<string, string>;
  const required = ["name", "email", "phone", "address", "suburb", "state", "postcode"];
  for (const f of required) {
    if (!c[f] || String(c[f]).trim().length < 2) {
      return NextResponse.json({ error: `Missing ${f}` }, { status: 400 });
    }
  }
  if (!EMAIL_RE.test(c.email)) {
    return NextResponse.json({ error: "Invalid email" }, { status: 400 });
  }

  const rawItems = Array.isArray(body.items) ? (body.items as OrderItem[]) : [];
  if (rawItems.length === 0 || rawItems.length > 100) {
    return NextResponse.json({ error: "Cart is empty" }, { status: 400 });
  }
  // Re-price server-side — never trust client prices
  const catalog = new Map(getProducts().map((p) => [p.id, p]));
  const items: OrderItem[] = [];
  for (const it of rawItems) {
    const p = catalog.get(Number(it.id));
    const qty = Math.min(Math.max(1, Number(it.qty) || 1), 50);
    if (!p) continue;
    items.push({
      id: p.id,
      slug: p.slug,
      name: p.name,
      price: p.price ?? p.price_min ?? 0,
      qty,
    });
  }
  if (items.length === 0) {
    return NextResponse.json({ error: "No valid items" }, { status: 400 });
  }

  const settings = getSettings();
  const method = String(body.paymentMethod ?? "bank");
  const order: Order = {
    id: newOrderId(),
    createdAt: new Date().toISOString(),
    status: settings.payments.mode === "direct" ? "awaiting-payment" : "new",
    paymentMode: settings.payments.mode,
    paymentMethod: method,
    paymentOther: body.paymentOther ? String(body.paymentOther).slice(0, 120) : undefined,
    paymentReference: body.paymentReference
      ? String(body.paymentReference).slice(0, 120)
      : undefined,
    customer: {
      name: String(c.name).slice(0, 120),
      email: String(c.email).slice(0, 160),
      phone: String(c.phone).slice(0, 40),
      address: String(c.address).slice(0, 200),
      suburb: String(c.suburb).slice(0, 80),
      state: String(c.state).slice(0, 40),
      postcode: String(c.postcode).slice(0, 10),
      notes: c.notes ? String(c.notes).slice(0, 500) : undefined,
    },
    items,
    subtotal: items.reduce((n, i) => n + i.price * i.qty, 0),
  };

  addOrder(order);

  // Emails are fire-and-forget — a mail outage must not lose the order
  void sendMail({
    to: order.customer.email,
    subject: `Your Aussie Vape House order ${order.id}`,
    html: orderCustomerHtml(order, settings),
  });
  void sendMail({
    to: process.env.MAIL_OWNER || "info@aussievapehouse.com",
    subject: `New order ${order.id} — AU$${order.subtotal.toFixed(2)} (${order.paymentMode})`,
    html: orderOwnerHtml(order),
  });

  return NextResponse.json({ ok: true, orderId: order.id });
}
