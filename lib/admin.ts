import { createHash, randomBytes } from "node:crypto";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { cookies } from "next/headers";

const COOKIE = "avh_admin";
const AUTH_FILE = () => path.join(process.cwd(), "data", "admin-auth.json");

type AuthFile = { salt: string; hash: string };

const sha = (s: string) => createHash("sha256").update(s).digest("hex");

// The dashboard-set password (hashed on disk) overrides the ADMIN_PASSWORD
// env var; the env var remains the bootstrap/recovery login (delete
// data/admin-auth.json to fall back to it).
function readAuthFile(): AuthFile | null {
  try {
    const raw = JSON.parse(readFileSync(AUTH_FILE(), "utf8"));
    if (typeof raw?.salt === "string" && typeof raw?.hash === "string") return raw;
    return null;
  } catch {
    return null;
  }
}

export function passwordMatches(password: string): boolean {
  const file = readAuthFile();
  if (file) return sha(`${file.salt}::${password}`) === file.hash;
  const env = process.env.ADMIN_PASSWORD || "";
  return env.length > 0 && password === env;
}

// Session token derives from the active secret, so changing the password
// invalidates every existing admin cookie automatically.
export function adminToken(): string {
  const file = readAuthFile();
  const material = file ? file.hash : process.env.ADMIN_PASSWORD || "";
  return sha(`avh-cookie::${material}`);
}

export function setAdminPassword(newPassword: string): void {
  const salt = randomBytes(16).toString("hex");
  mkdirSync(path.dirname(AUTH_FILE()), { recursive: true });
  writeFileSync(
    AUTH_FILE(),
    JSON.stringify({ salt, hash: sha(`${salt}::${newPassword}`) })
  );
}

export async function isAdmin(): Promise<boolean> {
  const jar = await cookies();
  return jar.get(COOKIE)?.value === adminToken();
}

export async function requireAdmin(): Promise<void> {
  if (!(await isAdmin())) {
    const { redirect } = await import("next/navigation");
    redirect("/admin/login");
  }
}

export const ADMIN_COOKIE = COOKIE;
