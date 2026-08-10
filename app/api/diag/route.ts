import { NextResponse } from "next/server";
import { kvGet } from "@/lib/storage";

// Diagnostics for production issues that can't be reproduced locally
// (blocked ports, missing env vars, read-only filesystem).
// Gated behind the admin password: /api/diag?key=<ADMIN_PASSWORD>
export const dynamic = "force-dynamic";

async function trySmtp(port: number, secure: boolean) {
  const started = Date.now();
  try {
    const nodemailer = (await import("nodemailer")).default;
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port,
      secure,
      auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
      connectionTimeout: 6000,
      greetingTimeout: 6000,
      socketTimeout: 6000,
    });
    await transporter.verify();
    return { port, secure, ok: true, ms: Date.now() - started };
  } catch (e) {
    return {
      port,
      secure,
      ok: false,
      ms: Date.now() - started,
      error: String((e as Error)?.message ?? e).slice(0, 200),
    };
  }
}

export async function GET(req: Request) {
  const key = new URL(req.url).searchParams.get("key");
  if (!process.env.ADMIN_PASSWORD || key !== process.env.ADMIN_PASSWORD) {
    return new NextResponse("Not found", { status: 404 });
  }

  const env = {
    SUPABASE_URL: !!process.env.SUPABASE_URL,
    SUPABASE_SERVICE_ROLE_KEY: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
    RESEND_API_KEY: !!process.env.RESEND_API_KEY,
    SMTP_HOST: process.env.SMTP_HOST ?? null,
    SMTP_USER: !!process.env.SMTP_USER,
    SMTP_PASS: !!process.env.SMTP_PASS,
    NEXT_PUBLIC_IMAGE_CDN: process.env.NEXT_PUBLIC_IMAGE_CDN ?? null,
  };

  // Can we reach the database at all?
  let storage: unknown;
  try {
    await kvGet("site-settings");
    storage = { ok: true };
  } catch (e) {
    storage = { ok: false, error: String((e as Error)?.message ?? e).slice(0, 250) };
  }

  // Which SMTP ports actually work from this host?
  const smtp = process.env.SMTP_HOST
    ? await Promise.all([trySmtp(465, true), trySmtp(587, false), trySmtp(2525, false)])
    : "SMTP_HOST not set";

  // Plain outbound HTTPS, as a control
  let https: unknown;
  try {
    const t = Date.now();
    const r = await fetch("https://api.resend.com/", { signal: AbortSignal.timeout(6000) });
    https = { ok: true, status: r.status, ms: Date.now() - t };
  } catch (e) {
    https = { ok: false, error: String((e as Error)?.message ?? e).slice(0, 150) };
  }

  return NextResponse.json({ env, storage, smtp, https }, { status: 200 });
}
