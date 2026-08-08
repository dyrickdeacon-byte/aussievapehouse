import Link from "next/link";
import { requireAdmin } from "@/lib/admin";
import { readOrders } from "@/lib/orders";
import { getSettings } from "@/lib/settings";
import { readFileSync } from "node:fs";
import path from "node:path";

function subscriberCount(): number {
  try {
    return JSON.parse(
      readFileSync(path.join(process.cwd(), "data", "subscribers.json"), "utf8")
    ).length;
  } catch {
    return 0;
  }
}

export default async function AdminDashboard() {
  await requireAdmin();
  const orders = readOrders();
  const settings = getSettings();
  const newOrders = orders.filter((o) => o.status === "new" || o.status === "awaiting-payment");
  const revenue = orders
    .filter((o) => o.status === "paid" || o.status === "shipped")
    .reduce((n, o) => n + o.subtotal, 0);

  const cards = [
    { label: "Orders needing action", value: newOrders.length, href: "/admin/orders" },
    { label: "Total orders", value: orders.length, href: "/admin/orders" },
    { label: "Revenue (paid + shipped)", value: `AU$${revenue.toFixed(2)}`, href: "/admin/orders" },
    { label: "Subscribers", value: subscriberCount(), href: "/admin" },
  ];

  return (
    <div>
      <h1 className="font-display text-3xl">Dashboard</h1>
      <div className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {cards.map((c) => (
          <Link
            key={c.label}
            href={c.href}
            className="rounded-xl border border-line bg-surface p-5 transition hover:border-accent/50"
          >
            <p className="text-2xl font-bold">{c.value}</p>
            <p className="mt-1 text-xs text-muted">{c.label}</p>
          </Link>
        ))}
      </div>

      <div className="mt-8 rounded-xl border border-line bg-surface p-5 text-sm">
        <h2 className="font-bold">Store status</h2>
        <ul className="mt-3 space-y-1.5 text-muted">
          <li>
            Checkout mode:{" "}
            <b className="text-foreground">
              {settings.payments.mode === "direct"
                ? "Direct — customers see your payment details"
                : "Manual — you email payment details after each order"}
            </b>
          </li>
          <li>
            WhatsApp button:{" "}
            <b className="text-foreground">{settings.whatsapp ? "on" : "off"}</b>{" "}
            · Livechat:{" "}
            <b className="text-foreground">
              {/embed\.tawk\.to/.test(settings.livechatEmbed) ? "on (Tawk.to)" : "off"}
            </b>{" "}
            · Socials:{" "}
            <b className="text-foreground">
              {Object.values(settings.socials).filter(Boolean).length} linked
            </b>
          </li>
        </ul>
        <Link href="/admin/settings" className="mt-3 inline-block text-accent hover:underline">
          Change settings →
        </Link>
      </div>
    </div>
  );
}
