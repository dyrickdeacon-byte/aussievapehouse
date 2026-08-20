// Pushes the values already in .env.local up to Cloudflare as secrets, so
// nobody has to retype them and they never get pasted into a chat or a file
// that gets committed.
//
// Usage: npm run cf:secrets

import { execFileSync } from "node:child_process";
import nextEnv from "@next/env";

nextEnv.loadEnvConfig(process.cwd(), true, { info() {}, error() {} });

const KEYS = [
  "SUPABASE_URL",
  "SUPABASE_SERVICE_ROLE_KEY",
  "SMTP_HOST",
  "SMTP_PORT",
  "SMTP_SECURE",
  "SMTP_USER",
  "SMTP_PASS",
  "MAIL_FROM",
  "MAIL_REPLY_TO",
  "MAIL_OWNER",
  "ADMIN_PASSWORD",
  "NEXT_PUBLIC_IMAGE_CDN",
];

const missing = KEYS.filter((k) => !process.env[k]);
const present = KEYS.filter((k) => process.env[k]);

if (missing.length) {
  console.log("Not found in .env.local (add them there, then re-run):");
  for (const k of missing) console.log("   " + k);
  console.log("");
}

for (const key of present) {
  process.stdout.write(`uploading ${key} … `);
  try {
    execFileSync("npx", ["wrangler", "secret", "put", key], {
      input: process.env[key],
      stdio: ["pipe", "ignore", "pipe"],
      shell: process.platform === "win32",
    });
    console.log("ok");
  } catch (e) {
    console.log("FAILED");
    console.log("   " + String(e.stderr ?? e.message).split("\n")[0]);
  }
}

console.log(`\n${present.length} of ${KEYS.length} secrets uploaded.`);
if (missing.length) console.log("Add the missing ones to .env.local and re-run.");
