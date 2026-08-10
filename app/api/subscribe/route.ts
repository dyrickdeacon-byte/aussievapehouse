import { NextResponse } from "next/server";
import { hashHas, hashSet } from "@/lib/storage";
import {
  sendMail,
  subscribeCustomerHtml,
  subscribeOwnerHtml,
} from "@/lib/email";

// Captures newsletter signups (subscribers hash — local JSON in dev,
// Upstash Redis on Vercel) and sends the welcome email (customer) +
// notification (owner).
export async function POST(req: Request) {
  let email: unknown;
  try {
    ({ email } = await req.json());
  } catch {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }
  if (typeof email !== "string" || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: "Invalid email" }, { status: 400 });
  }

  const key = email.trim().toLowerCase();
  const isNew = !(await hashHas("subscribers", key));
  if (isNew) {
    await hashSet("subscribers", key, { email: key, at: new Date().toISOString() });
    // Awaited (capped, never throws) — serverless freezes the function once
    // the response is sent, so detached sends would never actually run.
    await Promise.allSettled([
      sendMail({
        to: email,
        subject: "Your 10% off Aussie Vape House 🎉",
        html: subscribeCustomerHtml(),
      }),
      sendMail({
        to: process.env.MAIL_OWNER || "info@aussievapehouse.com",
        subject: `New subscriber: ${email}`,
        html: subscribeOwnerHtml(email),
      }),
    ]);
  }
  return NextResponse.json({ ok: true });
}
