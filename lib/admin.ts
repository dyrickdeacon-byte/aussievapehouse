import { createHash } from "node:crypto";
import { cookies } from "next/headers";

const COOKIE = "avh_admin";

function expectedToken(): string {
  const pass = process.env.ADMIN_PASSWORD || "";
  return createHash("sha256").update(`avh-salt::${pass}`).digest("hex");
}

export function passwordMatches(password: string): boolean {
  const expected = process.env.ADMIN_PASSWORD || "";
  return expected.length > 0 && password === expected;
}

export function adminToken(): string {
  return expectedToken();
}

export async function isAdmin(): Promise<boolean> {
  const jar = await cookies();
  return jar.get(COOKIE)?.value === expectedToken();
}

export async function requireAdmin(): Promise<void> {
  if (!(await isAdmin())) {
    const { redirect } = await import("next/navigation");
    redirect("/admin/login");
  }
}

export const ADMIN_COOKIE = COOKIE;
