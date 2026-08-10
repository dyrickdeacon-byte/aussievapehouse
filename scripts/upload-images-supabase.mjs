// Uploads product imagery to Supabase Storage so it is served from there
// instead of Vercel (metered) or jsDelivr (needs a public repo).
//
// Prereqs, one time:
//   1. Supabase dashboard → Storage → New bucket → name "product-images",
//      tick PUBLIC → Create.
//   2. Put these in .env.local (they are already in your Vercel env):
//        SUPABASE_URL=https://vdcyciwpuuczrqelshyi.supabase.co
//        SUPABASE_SERVICE_ROLE_KEY=<your service_role key>
//
// Then:  npm run images:upload
//
// Re-runnable: files already present are skipped, so it resumes safely.

import { readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import nextEnv from "@next/env";
import { createClient } from "@supabase/supabase-js";

// Standalone scripts don't get .env.local for free — load it the same way
// Next does, so the keys live in that file and nowhere else.
nextEnv.loadEnvConfig(process.cwd(), true, { info() {}, error() {} });

const URL = process.env.SUPABASE_URL;
const KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const BUCKET = "product-images";
const CONCURRENCY = 6;

if (!URL || !KEY) {
  console.error(
    "Missing SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY.\n" +
      "Add them to .env.local (see the header of this file), then re-run."
  );
  process.exit(1);
}

const db = createClient(URL, KEY, { auth: { persistSession: false } });

// Both image sets, keeping their folder prefix inside the bucket
const DIRS = [
  { dir: path.resolve("public", "products"), prefix: "products" },
  { dir: path.resolve("public", "sourced"), prefix: "sourced" },
];

const jobs = [];
for (const { dir, prefix } of DIRS) {
  let names = [];
  try {
    names = readdirSync(dir);
  } catch {
    console.log(`skip ${prefix} (no such folder)`);
    continue;
  }
  for (const name of names) {
    if (!/\.(webp|png|jpe?g|avif)$/i.test(name)) continue;
    jobs.push({ local: path.join(dir, name), key: `${prefix}/${name}` });
  }
}

console.log(`${jobs.length} images to upload to ${BUCKET}`);

// What's already there (paged listing)
const existing = new Set();
for (const { prefix } of DIRS) {
  let offset = 0;
  for (;;) {
    const { data, error } = await db.storage
      .from(BUCKET)
      .list(prefix, { limit: 1000, offset });
    if (error) {
      console.error(
        `Could not list bucket "${BUCKET}": ${error.message}\n` +
          `Create it in Supabase → Storage (public), then re-run.`
      );
      process.exit(1);
    }
    if (!data?.length) break;
    for (const f of data) existing.add(`${prefix}/${f.name}`);
    if (data.length < 1000) break;
    offset += data.length;
  }
}
console.log(`already uploaded: ${existing.size}`);

const CONTENT_TYPE = {
  ".webp": "image/webp",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".avif": "image/avif",
};

const queue = jobs.filter((j) => !existing.has(j.key));
let done = 0,
  failed = 0,
  bytes = 0;
const failures = [];

async function worker() {
  while (queue.length) {
    const job = queue.shift();
    if (!job) break;
    try {
      const body = readFileSync(job.local);
      const { error } = await db.storage.from(BUCKET).upload(job.key, body, {
        contentType: CONTENT_TYPE[path.extname(job.key).toLowerCase()] ?? "image/webp",
        cacheControl: "31536000",
        upsert: false,
      });
      if (error && !/exists/i.test(error.message)) throw new Error(error.message);
      bytes += statSync(job.local).size;
      done++;
      if (done % 200 === 0) {
        console.log(`  ${done}/${jobs.length - existing.size} (${(bytes / 1048576).toFixed(0)}MB)`);
      }
    } catch (e) {
      failed++;
      failures.push(`${job.key}: ${e.message}`);
    }
  }
}

await Promise.all(Array.from({ length: CONCURRENCY }, worker));

console.log(`\nuploaded: ${done}  skipped: ${existing.size}  failed: ${failed}`);
console.log(`bytes uploaded: ${(bytes / 1048576).toFixed(1)} MB`);
if (failures.length) console.log(failures.slice(0, 10).join("\n"));

console.log(
  `\nNow set this in Vercel (and .env.local) and redeploy:\n` +
    `  NEXT_PUBLIC_IMAGE_CDN=${URL}/storage/v1/object/public/${BUCKET}`
);
