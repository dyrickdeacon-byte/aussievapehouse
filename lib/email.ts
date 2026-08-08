import { appendFileSync, mkdirSync } from "node:fs";
import path from "node:path";
import { PAYMENT_METHOD_LABELS, type SiteSettings } from "@/lib/settings";
import type { Order } from "@/lib/orders";

const OWNER = () => process.env.MAIL_OWNER || "info@aussievapehouse.com";
const REPLY_TO = () => process.env.MAIL_REPLY_TO || "info@aussievapehouse.com";
const FROM = () =>
  process.env.MAIL_FROM || "Aussie Vape House <noreply@aussievapehouse.com>";

function logEmail(entry: Record<string, unknown>) {
  try {
    const dir = path.join(process.cwd(), "data");
    mkdirSync(dir, { recursive: true });
    appendFileSync(
      path.join(dir, "email-log.jsonl"),
      JSON.stringify({ at: new Date().toISOString(), ...entry }) + "\n"
    );
  } catch {
    // logging must never throw
  }
}

// Fire-and-forget sender: an email failure must never block an order.
export async function sendMail(opts: {
  to: string;
  subject: string;
  html: string;
}): Promise<boolean> {
  try {
    const nodemailer = (await import("nodemailer")).default;
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT || 465),
      secure: (process.env.SMTP_SECURE ?? "true") !== "false",
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
      connectionTimeout: 15000,
    });
    await transporter.sendMail({
      from: FROM(),
      replyTo: REPLY_TO(),
      to: opts.to,
      subject: opts.subject,
      html: opts.html,
    });
    logEmail({ ok: true, to: opts.to, subject: opts.subject });
    return true;
  } catch (e) {
    logEmail({
      ok: false,
      to: opts.to,
      subject: opts.subject,
      error: String((e as Error)?.message ?? e).slice(0, 300),
    });
    return false;
  }
}

/* ── Branded HTML shell ── */

const aud = (n: number) => `AU$${n.toFixed(2)}`;

function shell(title: string, body: string): string {
  return `<!doctype html><html><body style="margin:0;padding:0;background:#f5eee0;font-family:Arial,Helvetica,sans-serif;color:#2a2115;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f5eee0;padding:24px 12px;"><tr><td align="center">
    <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#fdf9f0;border:1px solid #e0d3b6;border-radius:12px;overflow:hidden;">
      <tr><td style="background:#241a0e;padding:22px 28px;">
        <span style="font-size:20px;font-weight:800;letter-spacing:2px;color:#e9b44c;">AUSSIE VAPE HOUSE</span><br>
        <span style="font-size:11px;color:#a4936f;letter-spacing:3px;">AUSSIEVAPEHOUSE.COM</span>
      </td></tr>
      <tr><td style="padding:6px 28px 0;"><div style="font-size:13px;color:#b4451c;letter-spacing:2px;padding-top:16px;">&#9679;&nbsp;&#9679;&nbsp;&#9679;</div></td></tr>
      <tr><td style="padding:8px 28px 26px;">
        <h1 style="font-size:22px;margin:6px 0 14px;color:#2a2115;">${title}</h1>
        ${body}
        <p style="font-size:12px;color:#7d6e57;margin-top:28px;border-top:1px solid #e0d3b6;padding-top:14px;">
          Questions? Just reply to this email — it goes straight to our team at info@aussievapehouse.com.<br>
          18+ only. Nicotine is an addictive chemical. All prices in AUD.
        </p>
      </td></tr>
    </table>
  </td></tr></table></body></html>`;
}

function itemsTable(order: Order): string {
  const rows = order.items
    .map(
      (i) => `<tr>
        <td style="padding:8px 10px;border-bottom:1px solid #efe6d1;font-size:13.5px;">${i.name}</td>
        <td style="padding:8px 10px;border-bottom:1px solid #efe6d1;font-size:13.5px;text-align:center;">×${i.qty}</td>
        <td style="padding:8px 10px;border-bottom:1px solid #efe6d1;font-size:13.5px;text-align:right;">${aud(i.price * i.qty)}</td>
      </tr>`
    )
    .join("");
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e0d3b6;border-radius:8px;overflow:hidden;">
    ${rows}
    <tr><td colspan="2" style="padding:10px;font-weight:800;font-size:14px;">Subtotal</td>
    <td style="padding:10px;font-weight:800;font-size:14px;text-align:right;">${aud(order.subtotal)}</td></tr>
  </table>`;
}

function methodLabel(order: Order): string {
  const label =
    PAYMENT_METHOD_LABELS[order.paymentMethod as keyof typeof PAYMENT_METHOD_LABELS] ??
    order.paymentMethod;
  return order.paymentMethod === "other" && order.paymentOther
    ? `Other — ${order.paymentOther}`
    : label;
}

/* ── Order emails ── */

export function orderCustomerHtml(order: Order, settings: SiteSettings): string {
  const payBlock =
    order.paymentMode === "direct"
      ? `<div style="background:#efe6d1;border-radius:8px;padding:14px 16px;margin:16px 0;">
          <p style="margin:0 0 6px;font-size:13.5px;font-weight:800;">Complete your payment — ${methodLabel(order)}</p>
          <p style="margin:0;font-size:13.5px;white-space:pre-line;">${
            settings.payments.methods[
              order.paymentMethod as keyof typeof settings.payments.methods
            ] || "Payment details will follow shortly."
          }</p>
          <p style="margin:10px 0 0;font-size:12.5px;color:#7d6e57;">Use <b>${order.id}</b> as the payment reference. Your order ships once payment clears.</p>
        </div>`
      : `<div style="background:#efe6d1;border-radius:8px;padding:14px 16px;margin:16px 0;">
          <p style="margin:0;font-size:13.5px;">You chose <b>${methodLabel(order)}</b>. Our team will email you shortly with the payment details to complete this order.</p>
        </div>`;

  return shell(
    `Order ${order.id} received 🎉`,
    `<p style="font-size:14px;">G'day ${order.customer.name.split(" ")[0]}, thanks for your order! Here's a summary:</p>
     ${itemsTable(order)}
     ${payBlock}
     <p style="font-size:13.5px;">Delivery to: ${order.customer.address}, ${order.customer.suburb} ${order.customer.state} ${order.customer.postcode}</p>`
  );
}

export function orderOwnerHtml(order: Order): string {
  const c = order.customer;
  return shell(
    `New order ${order.id} — ${aud(order.subtotal)}`,
    `<p style="font-size:14px;"><b>${c.name}</b> placed an order (${order.paymentMode} mode, method: ${methodLabel(order)}${order.paymentReference ? `, ref: ${order.paymentReference}` : ""}).</p>
     ${itemsTable(order)}
     <p style="font-size:13.5px;margin-top:14px;">
       <b>Contact:</b> ${c.email} · ${c.phone}<br>
       <b>Ship to:</b> ${c.address}, ${c.suburb} ${c.state} ${c.postcode}<br>
       ${c.notes ? `<b>Notes:</b> ${c.notes}` : ""}
     </p>
     <p style="font-size:13.5px;">${
       order.paymentMode === "manual"
         ? "⚠️ Manual mode: reply to the customer with payment details to proceed."
         : "Direct mode: customer has your payment details; confirm once funds arrive."
     }</p>`
  );
}

/* ── Newsletter emails ── */

export function subscribeCustomerHtml(): string {
  return shell(
    "Your 10% off is inside 🎉",
    `<p style="font-size:14px;">Welcome to Aussie Vape House! Use this code at checkout for 10% off your first order:</p>
     <p style="text-align:center;margin:18px 0;"><span style="display:inline-block;background:#b4451c;color:#fff;font-weight:800;font-size:18px;letter-spacing:2px;padding:12px 26px;border-radius:8px;">WELCOME10</span></p>
     <p style="font-size:13.5px;">We'll keep you posted on deals, drops and restocks. No spam — unsubscribe anytime by replying to this email.</p>`
  );
}

export function subscribeOwnerHtml(email: string): string {
  return shell(
    "New newsletter signup",
    `<p style="font-size:14px;"><b>${email}</b> just joined the mailing list from the website.</p>`
  );
}
