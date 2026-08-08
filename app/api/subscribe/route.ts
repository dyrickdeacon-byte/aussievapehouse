import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";
import {
  sendMail,
  subscribeCustomerHtml,
  subscribeOwnerHtml,
} from "@/lib/email";

// Captures newsletter signups to data/subscribers.json and sends the
// welcome email (customer) + notification (owner).
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

  const dir = path.join(process.cwd(), "data");
  const file = path.join(dir, "subscribers.json");
  await mkdir(dir, { recursive: true });
  let list: { email: string; at: string }[] = [];
  try {
    list = JSON.parse(await readFile(file, "utf8"));
  } catch {
    // first subscriber
  }
  const isNew = !list.some((s) => s.email.toLowerCase() === email.toLowerCase());
  if (isNew) {
    list.push({ email, at: new Date().toISOString() });
    await writeFile(file, JSON.stringify(list, null, 1));
    void sendMail({
      to: email,
      subject: "Your 10% off Aussie Vape House 🎉",
      html: subscribeCustomerHtml(),
    });
    void sendMail({
      to: process.env.MAIL_OWNER || "info@aussievapehouse.com",
      subject: `New subscriber: ${email}`,
      html: subscribeOwnerHtml(email),
    });
  }
  return NextResponse.json({ ok: true });
}
