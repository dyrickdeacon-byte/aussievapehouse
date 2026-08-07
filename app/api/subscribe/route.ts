import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";

// Captures newsletter signups to data/subscribers.json for now.
// The email automation pass (welcome email with discount code + owner
// notification) will plug in here once an email provider is chosen.
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
  if (!list.some((s) => s.email.toLowerCase() === email.toLowerCase())) {
    list.push({ email, at: new Date().toISOString() });
    await writeFile(file, JSON.stringify(list, null, 1));
  }
  return NextResponse.json({ ok: true });
}
